import Command from './command';
import Message from 'core/model/message';
import db from 'core/db';

const loadDisabledCommands = db
    .get('disabled-commands')
    .then(obj => obj?.list ?? [])
    .catch(() => []);

class Registry {
    private commands: Record<string, Command> = {};
    private allCommands: Record<string, Command> = {};

    public async register(command: Command) {
        const disabled = await loadDisabledCommands;
        this.allCommands[command.keyword] = command;
        if (!disabled.includes(command.keyword)) {
            this.commands[command.keyword.toLowerCase()] = command;
        }
        return command;
    }

    public unregister(keyword: string) {
        delete this.commands[keyword.toLowerCase()];
        delete this.allCommands[keyword.toLowerCase()];
    }

    public find(keyword: string) {
        return this.commands[keyword];
    }

    public findMatch(message: Message) {
        return this.all().find(command => command.matches(message));
    }

    public all() {
        return Object.values(this.commands);
    }

    public allDisabled() {
        return Object.values(this.allCommands).filter(
            cmd => !Object.values(this.commands).includes(cmd)
        );
    }

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

const registry = new Registry();
export default registry;
