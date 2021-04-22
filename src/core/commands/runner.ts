import Channel from 'core/model/channel';
import Message from 'core/model/message';
import User from 'core/model/user';
import Container from 'core/oop/di/container';
import Command from './command';
import registry from './registry';
import { logerror } from 'core/log';

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
        runner.resolveCommand();
        if (runner.isNoOp) return;

        await runner.execute();
    }

    public static async run(command: string, message: Message) {
        const runner = new CommandRunner(await message.clone());
        runner.forceCommand(command);
        if (runner.isNoOp) return;

        await runner.execute();
    }

    private constructor(message: Message) {
        this.message = message;
    }

    /**
     * Resolve a command for the message from the registry.
     *
     * First pass: check if a command matches the first token
     *      of the message
     * Second pass: check if any of the commands pass the match
     *      test defined in the Command class.
     */
    public resolveCommand() {
        this.command = registry.find(
            this.message.firstToken.toLowerCase(),
            this.message
        );
    }

    public forceCommand(command: string) {
        this.message.set({ text: command });
        this.resolveCommand();
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
        Container.singleton(Message, this.message);
        Container.singleton(Channel, this.message.channel);
        Container.singleton(User, this.message.user);

        try {
            return await this.command.run(this.message);
        } catch (e) {
            logerror(e);
            this.message.replySystemError(e);
        }
    }
}
