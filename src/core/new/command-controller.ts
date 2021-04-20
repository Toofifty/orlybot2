import { Command, registry } from 'core/commands';
import { CommandArgument } from 'core/commands/types';
import db from 'core/db';
import Channel from 'core/model/channel';
import Message from 'core/model/message';
import User from 'core/model/user';
import { StoreModel, StoreModelProperties } from './store-model';
import { Meta } from './meta';
import { DbStore } from './db-store';

const numMapToArray = <T>(map: Record<number, T>) =>
    map
        ? Object.entries(map)
              .sort(([a], [b]) => +a - +b)
              .map(([, v]) => v)
        : [];

export default class CommandController<TStore = any> {
    public message: Message;
    public user: User;
    public channel: Channel;
    public parent?: CommandController<TStore>;
    protected _store: DbStore<TStore> & StoreModelProperties<TStore>;

    private m<T = string>(key: any): T {
        return Reflect.getMetadata(key, this);
    }

    private _exec(fnName: string) {
        return async (message: Message, args: string[]) => {
            this.message = message;
            this.user = message.user;
            this.channel = message.channel;

            const argMeta = numMapToArray(
                this.m<CommandArgument[]>(`${fnName}/${Meta.ARGS}`)
            );
            // required arguments
            argMeta.forEach(({ name, required, def }, index) => {
                if (required && !def && !args[index]) {
                    throw new Error(
                        `Missing argument: \`${name}\`. See \`help ${this.m(
                            Meta.KEYWORD
                        )}\``
                    );
                }
            });

            // validate arguments
            const promises = argMeta.map(async ({ validators }, index) => {
                if (!validators || !args[index]) return;
                const validationPromises = validators?.map(async validator => {
                    const res = await validator(args[index], index, {
                        controller: this,
                        args,
                    });
                    if (res !== true) {
                        throw new Error(res);
                    }
                });
                await Promise.all(validationPromises);
            });
            await Promise.all(promises);

            // validate command

            await this.before();
            await this[fnName].bind(this)(args);
            await this.after();
        };
    }

    public _convert(): Command {
        const main = this.m(Meta.MAIN_COMMAND);
        const subcommands = this.m<string[]>(Meta.SUB_COMMANDS) ?? [];

        const cmd = Command.sub(this.m(Meta.KEYWORD), this._exec(main))
            .alias(...(this.m(Meta.ALIASES) ?? []))
            .desc(this.m(Meta.DESCRIPTION) ?? 'No description provided.');

        const mainArgs = numMapToArray(
            this.m<CommandArgument[]>(`${main}/${Meta.ARGS}`)
        );
        mainArgs.forEach(arg => cmd.arg(arg));

        subcommands.forEach(sub => {
            const m = <T = string>(key: any): T => this.m(`${sub}/${key}`);
            const delegated = m<typeof CommandController>(Meta.DELEGATED);
            if (delegated) {
                cmd.nest(new delegated()._convert());
                return;
            }

            const subcmd = Command.sub(sub, this._exec(sub))
                .alias(...(m(Meta.ALIASES) ?? []))
                .desc(m(Meta.DESCRIPTION) ?? 'No description provided.');

            const args = numMapToArray(m<CommandArgument[]>(Meta.ARGS));
            args.forEach(arg => subcmd.arg(arg));

            cmd.nest(subcmd);
        });

        return cmd;
    }

    public _register(): void {
        registry.register(this._convert());
    }

    public async before(): Promise<void> {}
    public async after(): Promise<void> {}

    public async main(): Promise<void> {}

    protected async setStore(
        store: DbStore<TStore> & StoreModelProperties<TStore>
    ) {
        await store.load();
        this._store = store;
    }

    public get store() {
        return this.parent?._store ?? this._store;
    }
}
