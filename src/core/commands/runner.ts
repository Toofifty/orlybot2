import Message from 'core/model/message';
import Command from './command';
import registry from './registry';
import { loginfo } from 'core/log';

export default class CommandRunner {
    private message: Message;
    private command: Command;

    public static async handle(parentMessage: Message) {
        await Promise.all((await parentMessage.all()).map(this.handleSingle));
    }

    private static async handleSingle(message: Message) {
        const runner = new CommandRunner(message);
        if (runner.isNoOp) return;

        await runner.execute();
    }

    private constructor(message: Message) {
        this.message = message;
        this.resolveCommand(message.firstToken);
    }

    public resolveCommand(keyword: string) {
        this.command = registry.find(keyword);
    }

    public get isNoOp(): boolean {
        return !this.command;
    }

    public async execute(): Promise<void> {
        try {
            loginfo(`Executing command: [${this.command.keyword}]`);
            return await this.command.run(this.message);
        } catch (e) {
            this.message.replySystemError(e);
        }
    }
}
