import Command from './command';
import Message from 'core/model/message';
import db from 'core/db';

const loadDisabledCommands = db
    .get('disabled-commands')
    .then(obj => obj?.list ?? [])
    .catch(() => []);

class Registry {
    /**
     * Map of enabled commands.
     */
    private commands: Record<string, Command> = {};

    /**
     * Map of all commands; both enabled and disabled.
     */
    private allCommands: Record<string, Command> = {};

    /**
     * Register a command.
     *
     * If the command is in the disabled list loaded from
     * the database, it won't be added to the map of
     * enabled commands.
     */
    public async register(command: Command) {
        const disabled = await loadDisabledCommands;
        this.allCommands[command.keyword] = command;
        if (!disabled.includes(command.keyword)) {
            this.commands[command.keyword.toLowerCase()] = command;
        }
        return command;
    }

    /**
     * Unregister a command.
     *
     * Really only used for temporary commands or listeners.
     */
    public unregister(keyword: string) {
        delete this.commands[keyword.toLowerCase()];
        delete this.allCommands[keyword.toLowerCase()];
    }

    /**
     * Get a command by main keyword. (first pass)
     */
    public find(keyword: string) {
        return this.commands[keyword];
    }

    /**
     * Get a command by alias or full-text match. (second pass)
     */
    public findMatch(message: Message) {
        return this.all().find(command => command.matches(message));
    }

    /**
     * Get all enabled commands. Includes hidden and permission
     * restricted commands.
     */
    public all() {
        return Object.values(this.commands);
    }

    /**
     * Get all disabled commands.
     */
    public allDisabled() {
        return Object.values(this.allCommands).filter(
            cmd => !Object.values(this.commands).includes(cmd)
        );
    }

    /**
     * Enable a command by keyword.
     *
     * Adds the command to the enabled command list and updates
     * the in-database disabled list to remove the keyword.
     */
    public enable(keyword: string) {
        keyword = keyword.toLowerCase();
        if (keyword in this.commands) {
            throw new Error(`${keyword} is already enabled`);
        }
        if (!(keyword in this.allCommands)) {
            throw new Error(`There is no command ${keyword}`);
        }
        this.commands[keyword] = this.allCommands[keyword];
        db.update('disabled-commands', obj => ({
            ...obj,
            list: (obj?.list ?? []).filter((kw: string) => kw !== keyword),
        }));
    }

    /**
     * Enable a command by keyword.
     *
     * Removes the command from the enabled command list and updates
     * the in-database disabled list to append the keyword.
     */
    public disable(keyword: string) {
        keyword = keyword.toLowerCase();
        if (!(keyword in this.allCommands)) {
            throw new Error(`There is no command ${keyword}`);
        }
        if (!(keyword in this.commands)) {
            throw new Error(`${keyword} is already disabled`);
        }
        delete this.commands[keyword];
        db.update('disabled-commands', obj => ({
            ...obj,
            list: [...(obj?.list ?? []), keyword],
        }));
    }
}

/**
 * Command registry for managing and matching commands.
 */
const registry = new Registry();
export default registry;
