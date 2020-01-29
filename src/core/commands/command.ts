import Message from 'core/model/message';
import { arghelp } from 'core/util';
import { CommandAction, CommandArgument } from './types';
import registry from './registry';
import { flat } from 'core/util/array';
import { loginfo } from 'core/log';

enum CommandPermission {
    USER = 0,
    ADMIN = 1,
}

export default class Command {
    public keyword: string;
    public action: CommandAction;
    public description: string;
    public arguments: CommandArgument[] = [];
    public permission: CommandPermission = CommandPermission.USER;
    public aliases: string[] = [];
    public phrase: boolean;
    public parent?: Command;
    public subcommands: Record<string, Command> = {};

    public static create(keyword: string, action?: CommandAction) {
        const command = new this(keyword, action);
        registry.register(command);
        return command;
    }

    public static sub(keyword: string, action?: CommandAction) {
        return new this(keyword, action);
    }

    private constructor(keyword: string, action?: CommandAction) {
        this.set({ keyword, action });
    }

    private set(data: Partial<Command>): Command {
        Object.keys(data)
            .filter(key => data[key] !== undefined)
            .forEach(key => (this[key] = data[key]));
        return this;
    }

    public do(action: CommandAction) {
        return this.set({ action });
    }

    public desc(description: string) {
        return this.set({ description });
    }

    public arg(argument: Partial<CommandArgument>) {
        this.arguments.push({ required: false, name: 'null', ...argument });
        return this;
    }

    public admin() {
        return this.set({ permission: CommandPermission.ADMIN });
    }

    public isPhrase(phrase: boolean = true) {
        return this.set({ phrase });
    }

    public alias(...keywords: string[]) {
        this.aliases.push(...keywords);
        return this;
    }

    public nest(subcommand: Command) {
        this.subcommands[subcommand.keyword] = subcommand;
        subcommand.parent = this;
        return this;
    }

    public matches(message: Message): boolean {
        if (this.phrase) {
            return message.text.includes(this.keyword);
        }

        return this.aliases.includes(message.firstToken);
    }

    public async run(message: Message, step: number = 0) {
        loginfo(`Executing command: [${this.keywords}]`);
        if (message.tokens.length >= step) {
            const nextToken = message.tokens[step + 1];
            if (nextToken in this.subcommands) {
                return this.subcommands[nextToken].run(message, step + 1);
            }
        }

        const result = await this.action(
            message,
            message.tokens.slice(step + 1)
        );
        if (typeof result === 'string') {
            if (this.permission !== CommandPermission.USER) {
                message.replyEphemeral(result);
            } else {
                message.reply(result);
            }
        }
    }

    public get keywords(): string {
        const keywords = this.parent
            ? `${this.parent.keywords} ${this.keyword}`
            : this.keyword;
        return [keywords, ...this.aliases].join('|');
    }

    public get help(): string[] {
        return [
            [
                this.keywords,
                ...this.arguments.map(arghelp),
                '-',
                this.description,
            ].join(' '),
            ...flat(Object.values(this.subcommands).map(sub => sub.help)),
        ];
    }
}
