import Message from 'core/model/message';
import { arghelp, rpad } from 'core/util';
import { CommandAction, CommandArgument } from './types';
import registry from './registry';
import { flat } from 'core/util/array';
import { loginfo } from 'core/log';
import { KwargDefinition, Match } from 'core/model/kwargs';

enum CommandPermission {
    USER = 0,
    ADMIN = 1,
}

/**
 * @deprecated Use the OOP controllers instead
 *
 * Command class and namespace.
 *
 * You probably want to use `Command.create(...)`.
 * Or maybe `Command.sub(...)` if you're getting
 * advanced
 */
export default class Command {
    /**
     * Keyword to listen for to trigger the command.
     *
     * If this contains spaces, the command must be in 'phrase'
     * mode, and this can be set with `.isPhrase()`.
     */
    public keyword: string;

    /**
     * Callback to run when the command is found in
     * the user's message.
     *
     * If the resolved callback returns a string, that
     * will be sent as a reply to the message.
     */
    public action: CommandAction;

    /**
     * Description to show in help text.
     */
    public description: string;

    /**
     * Group description
     *
     * Provides extra information about the group of commands
     * that is displayed above the command help
     */
    public groupDescription: string;

    /**
     * Arguments to show in help text.
     *
     * These are not validated and defaults aren't
     * automatically assigned.
     */
    public arguments: CommandArgument[] = [];

    /**
     * Minimum permission the user must have to
     * perform the command.
     */
    public permission: CommandPermission = CommandPermission.USER;

    /**
     * Aliases for the command that can be matched on the
     * second pass. If another command has one of these aliases
     * as it's keyword, it'll always be preferred.
     */
    public aliases: string[] = [];

    /**
     * Phrase mode: whether the command must match the entire
     * message term to be considered.
     */
    public phrase: boolean;

    /**
     * Partial mode: matches if the keyword is anywhere in the message
     */
    public partial: boolean;

    /**
     * Parent command instance, if this is a subcommand.
     */
    public parent?: Command;

    /**
     * Dictionary of subcommands.
     */
    public subcommands: Record<string, Command> = {};

    /**
     * Whether this command is hidden from help text.
     */
    public hidden?: boolean;

    public kwargKeywords: KwargDefinition[] = [];
    public kwargFlags: KwargDefinition[] = [
        { key: ['help', 'h'], description: 'Get help about this command.' },
    ];

    /**
     * @deprecated Use the OOP controllers instead
     *
     * Create and register a new command. The resulting object
     * can be chained to set properties.
     *
     * The `action` parameters can also be set via chaining in `.do()`
     *
     * For subcommands, use `Command.sub()` instead of this so they
     * aren't registered.
     *
     * @param keyword Keyword to listen for to trigger the command.
     * @param action Callback to run when the command is found in
     *               the user's message.
     *               If the resolved callback returns a string, that
     *               will be sent as a reply to the message.
     */
    public static create(keyword: string, action?: CommandAction) {
        const command = new this(keyword, action);
        registry.register(command);
        return command;
    }

    /**
     * Create a subcommand that isn't registered. Use within the
     * `.nest()` call of a parent to attach it.
     */
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

    /**
     * Set the action callback to run when the command is executed.
     *
     * If the resolved callback returns a string, that
     * will be sent as a reply to the message.
     */
    public do(action: CommandAction) {
        return this.set({ action });
    }

    /**
     * Set the help text description of the command.
     */
    public desc(description: string) {
        return this.set({ description });
    }

    /**
     * Set the group description of the command.
     * Only valid for group/module commands
     */
    public gdesc(groupDescription: string) {
        return this.set({ groupDescription });
    }

    /**
     * Add a help text argument for the command.
     */
    public arg(argument: Partial<CommandArgument>) {
        this.arguments.push({ required: false, name: 'null', ...argument });
        return this;
    }

    /**
     * Make the command admin-only.
     */
    public admin() {
        return this.set({ permission: CommandPermission.ADMIN });
    }

    /**
     * Make the command admin-only.
     */
    public isAdmin(admin = true) {
        return this.set({
            permission: admin
                ? CommandPermission.ADMIN
                : CommandPermission.USER,
        });
    }

    /**
     * Put the command in phrase mode.
     *
     * Phrase mode: whether the command must match the entire
     * message term to be considered.
     */
    public isPhrase(phrase: boolean = true) {
        return this.set({ phrase });
    }

    /**
     * Put the command in partial mode.
     */
    public isPartial(partial: boolean = true) {
        return this.set({ partial });
    }

    /**
     * Add one or more aliases that can be matched on the
     * second pass when resolving a command to run. If another
     * command has one of these aliases as it's keyword, it'll
     * always be preferred.
     */
    public alias(...keywords: string[]) {
        this.aliases.push(...keywords);
        return this;
    }

    /**
     * Add a subcommand.
     *
     * Example usage: `cmd.nest(Command.sub('nested', message => {...}))`
     */
    public nest(subcommand: Command) {
        this.subcommands[subcommand.keyword] = subcommand;
        subcommand.parent = this;
        return this;
    }

    /**
     * Hide the command from help text.
     */
    public hide(hidden: boolean = true) {
        return this.set({ hidden });
    }

    /**
     * Hide the command from help text.
     */
    public isHidden(hidden: boolean = true) {
        return this.hide(hidden);
    }

    public kwarg(key: Match, description: string) {
        this.kwargKeywords.push({ key, description });
        return this;
    }

    public flag(key: Match, description: string) {
        this.kwargFlags.push({ key, description });
        return this;
    }

    /**
     * Check if this command matches the message's
     * terms on the second pass. Only executed if no
     * command matches the first pass (key lookup).
     */
    public matches(message: Message): boolean {
        if (
            this.phrase &&
            message.text.toLowerCase().startsWith(this.keyword.toLowerCase())
        ) {
            return true;
        }

        if (
            this.partial &&
            message.text.toLowerCase().includes(this.keyword.toLowerCase())
        ) {
            return true;
        }

        return this.aliases.includes(message.firstToken);
    }

    /**
     * Execute the command.
     */
    public async run(message: Message, step: number = 0) {
        loginfo(`Executing command: [${this.keywords}]`);
        if (message.tokens.length >= step) {
            const nextToken = message.tokens[step + 1];
            const matchedSub = Object.values(this.subcommands).find(
                sub =>
                    sub.keyword === nextToken || sub.aliases.includes(nextToken)
            );
            if (matchedSub) {
                return matchedSub.run(message, step + 1);
            }
        }

        if (
            this.permission === CommandPermission.ADMIN &&
            !message.user.isAdmin
        ) {
            message.replyEphemeral('No');
            return;
        }

        const result = await this.action(
            message,
            message.tokens.slice(step + 1)
        );
        if (typeof result === 'string') {
            if (this.permission !== CommandPermission.USER) {
                await message.replyEphemeral(result);
            } else {
                await message.reply(result);
            }
        }
    }

    /**
     * Get all keywords that will trigger the command,
     * including keywords of parents and aliases (split with
     * a pipe `|`).
     */
    public get keywords(): string {
        return [this.keyword, ...this.aliases].join('|');
    }

    /**
     * Get the full name of this command, including
     * parent commands.
     */
    public get commandName(): string {
        return this.parent
            ? `${this.parent.commandName} ${this.keyword}`
            : this.keyword;
    }

    public get parents(): number {
        if (!this.parent) return 0;
        return this.parent.parents + 1;
    }

    public get commandNameForHelp(): string {
        return this.parent
            ? '\t'.repeat(this.parents) + this.keywords
            : this.keywords;
    }

    public get commandNameForVerboseHelp(): string {
        return this.parent
            ? `${this.parent.commandNameForVerboseHelp} ${this.keywords}`
            : this.keywords;
    }

    /**
     * Get the help text for this command and all sub
     * commands.
     */
    public get help(): string[] {
        return [
            [
                this.commandNameForHelp,
                ...this.arguments.map(arghelp),
                this.description && '-',
                this.description,
            ]
                .filter(Boolean)
                .join(' '),
            ...flat(Object.values(this.subcommands).map(sub => sub.help)),
        ];
    }

    public get kwargDescriptions(): string[] {
        const kwargFlags = this.kwargFlags.slice(1);

        const maxKwLen = (defs: KwargDefinition[]) =>
            defs.reduce((max, def) => Math.max(def.key[0].length + 5, max), 5);

        return [
            ...(this.kwargKeywords.length > 0 ? ['Keyword arguments'] : []),
            ...this.kwargKeywords.map(
                kw =>
                    `${rpad(
                        `-${kw.key[1]}|--${kw.key[0]}`,
                        maxKwLen(this.kwargKeywords) + 1
                    )} - ${kw.description}`
            ),
            ...(kwargFlags.length > 0 ? ['Flags'] : []),
            ...kwargFlags.map(
                kw =>
                    `${rpad(
                        `-${kw.key[1]}|--${kw.key[0]}`,
                        maxKwLen(kwargFlags) + 1
                    )} - ${kw.description}`
            ),
        ];
    }

    public get verboseHelp(): string[] {
        return [
            `${this.commandNameForVerboseHelp} [kwargs?] ${this.arguments
                .map(arghelp)
                .join(' ')}\n${this.description}\n${this.kwargDescriptions.join(
                '\n'
            )}`,
            ...flat(
                Object.values(this.subcommands).map(sub => sub.verboseHelp)
            ),
        ];
    }
}
