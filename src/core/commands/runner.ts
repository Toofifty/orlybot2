import Message from 'core/model/message';
import Command from './command';
import registry from './registry';

export default class CommandRunner {
    private message: Message;
    private command: Command;

    public static async handle(parentMessage: Message) {
        // run through submessages in order
        await (await parentMessage.all()).reduce(async (promise, message) => {
            await promise;
            return this.handleSingle(message);
        }, Promise.resolve());
    }

    private static async handleSingle(message: Message) {
        const runner = new CommandRunner(message);
        if (runner.isNoOp) return;

        await runner.execute();
    }

    private constructor(message: Message) {
        this.message = message;
        this.resolveCommand(message);
    }

    public resolveCommand(message: Message) {
        this.command =
            registry.find(message.firstToken.toLowerCase()) ??
            registry.findMatch(message);
    }

    public get isNoOp(): boolean {
        return !this.command;
    }

    public async execute(): Promise<void> {
        try {
            return await this.command.run(this.message);
        } catch (e) {
            this.message.replySystemError(e);
        }
    }
}
