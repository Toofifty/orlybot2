import Command from './command';

class Registry {
    private commands: Record<string, Command> = {};

    public register(command: Command) {
        this.commands[command.keyword] = command;
    }

    public contains(keyword: string) {
        return !!this.commands[keyword];
    }

    public execute(keyword: string) {
        return this.commands[keyword].run();
    }
}

const registry = new Registry();
export default registry;
