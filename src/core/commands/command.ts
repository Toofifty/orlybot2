import Message from 'core/model/message';
import { arghelp } from 'core/util';
import { CommandAction, CommandArgument } from './types';
import registry from './registry';

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

    public static create(keyword: string) {
        const command = new this(keyword);
        registry.register(command);
        return command;
    }

    private constructor(keyword: string) {
        this.set({ keyword });
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

    public run(message: Message) {
        return this.action(message, message.lastTokens);
    }

    public get help() {
        return [
            this.keyword,
            ...this.arguments.map(arghelp),
            '-',
            this.description,
        ].join(' ');
    }
}
