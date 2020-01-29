import Message from 'core/model/message';
import Command from './command';
import registry from './registry';

/**
 *
 */
export default class CommandRunner {
    /**
     * User message to attempt to resolve a command
     * from.
     */
    private message: Message;

    /**
     * Resolved command for the message.
     */
    private command: Command;

    /**
     * Handle a message.
     *
     * A single message can have multiple terms which will each
     * be re-processed as individual messages, then (attempt to be)
     * executed in sequence.
     */
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

    /**
     * Resolve a command for the message from the registry.
     *
     * First pass: check if a command matches the first token
     *      of the message
     * Second pass: check if any of the commands pass the match
     *      test defined in the Command class.
     */
    public resolveCommand(message: Message) {
        this.command =
            registry.find(message.firstToken.toLowerCase()) ??
            registry.findMatch(message);
    }

    /**
     * Whether the message has resolved to a command.
     */
    public get isNoOp(): boolean {
        return !this.command;
    }

    /**
     * Run the resolved command.
     *
     * Will also print out any uncaught errors to the user.
     */
    public async execute(): Promise<void> {
        try {
            return await this.command.run(this.message);
        } catch (e) {
            this.message.replySystemError(e);
        }
    }
}
