import Command from './command';

class Registry {
    private commands: Record<string, Command> = {};

    public register(command: Command) {
        this.commands[command.keyword] = command;
    }

    public find(keyword: string) {
        return this.commands[keyword];
    }

    public all() {
        return Object.values(this.commands);
    }
}

const registry = new Registry();
export default registry;
