import { Command, CommandArgument, UserError } from 'core/commands';
import { KwargDefinition } from 'core/model/kwargs';
import Container, { Constructable } from './di/container';
import { Controller } from './controller';
import { Meta, MetaKey } from './meta';
import { StoredValidator, ArgumentValidator, CommandValidator } from './types';
import bot from 'core/bot';

const getMetaFactory = (target: Object, property?: string) => <T>(
    key: MetaKey
): T => Meta.get(property ? Meta.prop(key, property) : key, target);

export const adapt = async <T extends Controller>(
    controller: Constructable<T>
): Promise<Command[]> => {
    const cls = await Container.resolve(controller);
    const meta = getMetaFactory(cls);

    const setupFn = meta<string>(Meta.GROUP_SETUP);

    if (setupFn) {
        bot.ready(() => {
            Container.execute(cls, setupFn);
        });
    }

    const group = meta<string>(Meta.COMMAND_GROUP);
    const main = meta<string>(Meta.MAIN_COMMAND_METHOD);

    if (main && !group) {
        throw new Error(
            'Failed to construct commands from controller.' +
                ' If a @maincmd is specified, the class must have a @group.'
        );
    }

    const subcommands = (meta<string[]>(Meta.SUB_COMMANDS) ?? []).map(sub =>
        createCommand(cls, sub)
    );

    if (!group) return subcommands;

    const cmd = createCommand(cls, group, true);
    subcommands.forEach(sub => {
        cmd.nest(sub);
    });

    const delegates = meta<Constructable<any>[]>(Meta.GROUP_DELEGATES) ?? [];
    const promises = delegates.map(async delegate => {
        const builtCommand = await adapt(delegate);
        builtCommand.forEach(builtSubcommand => {
            cmd.nest(builtSubcommand);
        });
    });
    await Promise.all(promises);

    return [cmd];
};

const createCommand = (cls: Controller, method: string, isGroup = false) => {
    const cmeta = getMetaFactory(cls);
    if (isGroup) {
        method = cmeta(Meta.MAIN_COMMAND_METHOD);
    }
    const meta = getMetaFactory(cls, method);

    const cmd = Command.sub(
        isGroup ? cmeta(Meta.COMMAND_GROUP) : meta(Meta.COMMAND_NAME),
        createAction(cls, method)
    )
        .desc(meta(Meta.COMMAND_DESCRIPTION))
        .alias(...(meta<string[]>(Meta.COMMAND_ALIASES) ?? []))
        .isPhrase(meta(Meta.COMMAND_IS_PHRASE) ?? false)
        .isPartial(meta(Meta.COMMAND_IS_PARTIAL) ?? false)
        .isAdmin(meta(Meta.COMMAND_IS_ADMIN) ?? false)
        .isHidden(meta(Meta.COMMAND_IS_HIDDEN) ?? false);

    (meta<CommandArgument[]>(Meta.COMMAND_ARGS) ?? []).forEach(arg =>
        cmd.arg(arg)
    );

    (
        meta<KwargDefinition[]>(Meta.COMMAND_KWARGS) ?? []
    ).forEach(({ key, description }) => cmd.kwarg(key, description));

    (
        meta<KwargDefinition[]>(Meta.COMMAND_FLAGS) ?? []
    ).forEach(({ key, description }) => cmd.flag(key, description));

    if (isGroup) {
        cmd.gdesc(cmeta(Meta.GROUP_DESCRIPTION));
    }

    return cmd;
};

const createAction = (cls: Controller, method: string) => {
    const cmeta = getMetaFactory(cls);

    const beforeFn = cmeta<string>(Meta.GROUP_BEFORE);
    const afterFn = cmeta<string>(Meta.GROUP_AFTER);

    return async (_: any, args: string[]) => {
        await runArgValidators(cls, method, args);
        await runCommandValidators(cls, method, args);

        if (beforeFn) await Container.execute(cls, beforeFn);
        await Container.execute(cls, method, args);
        if (afterFn) await Container.execute(cls, afterFn);
    };
};

const runCommandValidators = async (
    cls: Controller,
    method: string,
    args: string[]
) => {
    const meta = getMetaFactory(cls, method);

    const validatorPromises = (
        meta<StoredValidator[]>(Meta.COMMAND_VALIDATION) ?? []
    ).map(
        async ({ target, property }) =>
            (await Container.execute(target, property)) as CommandValidator
    );

    const validators = await Promise.all(validatorPromises);

    for (let validator of validators) {
        const result = await validator({ args });
        if (result !== true) {
            throw new UserError(result);
        }
    }
};

const runArgValidators = async (
    cls: Controller,
    method: string,
    args: string[]
) => {
    const meta = getMetaFactory(cls, method);

    const argStart = meta<number>(Meta.COMMAND_ARGSTART) ?? 0;

    const validatorPromises = (
        meta<StoredValidator[]>(Meta.COMMAND_ARGS_VALIDATION) ?? []
    )
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map(async ({ index, target, property }) => ({
            index: index! - argStart,
            validator: (await Container.execute(
                target,
                property
            )) as ArgumentValidator,
        }));

    const validators = await Promise.all(validatorPromises);

    for (let { index, validator } of validators) {
        const result = await validator(args[index], index, { args });
        if (result !== true) {
            throw new UserError(result);
        }
    }
};
