import { Meta } from '../meta';
import { CommandArgument } from 'core/commands';
import { Match } from 'core/model/kwargs';

const getArguments = (func: any): CommandArgument[] =>
    func
        .toString()
        .replace(/[/][/].*$/gm, '')
        .replace(/\s+/g, '')
        .replace(/[/][*][^/*]*[*][/]/g, '')
        .split('){', 1)[0]
        .replace(/^[^(]*[(]/, '')
        .split(',')
        .filter(Boolean)
        .map((param: string) => {
            const [, name, def] =
                param.match(/((?:\.\.\.)?\w+)(?:='(.*)')?/) ?? [];
            return { name, def, required: !def };
        });

const setArguments = (target: Object, property: string | symbol) => {
    const argStart = Meta.get<object[]>(
        Meta.DESIGN_PARAMTYPES,
        target,
        property
    )
        .map(p => p.toString())
        .findIndex(
            p =>
                p.startsWith('function String()') ||
                p.startsWith('function Object()')
        );

    if (argStart > -1) {
        Meta.set(Meta.prop(Meta.COMMAND_ARGSTART, property), argStart, target);
        Meta.push(
            Meta.prop(Meta.COMMAND_ARGS, property),
            getArguments(target[property]).slice(argStart),
            target
        );
    }
};

/**
 * Register this method as the main command of
 * the group. This will be executed if no subcommand
 * is specified in the message.
 */
export const maincmd = (description: string): MethodDecorator => {
    return (target, property) => {
        Meta.set(Meta.MAIN_COMMAND_METHOD, property, target);
        Meta.set(
            Meta.prop(Meta.COMMAND_DESCRIPTION, property),
            description,
            target
        );

        setArguments(target, property);
    };
};

/**
 * Register this method as a command.
 */
export const cmd = (name: string, description: string): MethodDecorator => {
    return (target, property) => {
        Meta.set(Meta.prop(Meta.COMMAND_NAME, property), name, target);
        Meta.set(
            Meta.prop(Meta.COMMAND_DESCRIPTION, property),
            description,
            target
        );
        Meta.push(Meta.SUB_COMMANDS, property, target);

        setArguments(target, property);
    };
};

/**
 * Put the command in phrase mode.
 *
 * Phrase mode: whether the command must match the entire
 * message term to be considered.
 */
export const phrase: MethodDecorator = (target, property) => {
    Meta.set(Meta.prop(Meta.COMMAND_IS_PHRASE, property), true, target);
};

/**
 * Put the command in partial mode.
 */
export const partial: MethodDecorator = (target, property) => {
    Meta.set(Meta.prop(Meta.COMMAND_IS_PARTIAL, property), true, target);
};

/**
 * Add one or more aliases that can be matched on the
 * second pass when resolving a command to run. If another
 * command has one of these aliases as it's keyword, it'll
 * always be preferred.
 */
export const aliases = (...aliases: string[]): MethodDecorator => {
    return (target, property) => {
        Meta.set(Meta.prop(Meta.COMMAND_ALIASES, property), aliases, target);
    };
};

/**
 * Hide the command from help text. It will still be executable
 * for all users.
 */
export const hidden: MethodDecorator = (target, property) => {
    Meta.set(Meta.prop(Meta.COMMAND_IS_HIDDEN, property), true, target);
};

/**
 * Make the command admin-only.
 */
export const admin: MethodDecorator = (target, property) => {
    Meta.set(Meta.prop(Meta.COMMAND_IS_ADMIN, property), true, target);
};

/**
 * Listen to a kwarg when this command is run
 */
export const kwarg = (key: Match, description: string): MethodDecorator => {
    return (target, property) => {
        Meta.push(
            Meta.prop(Meta.COMMAND_KWARGS, property),
            { key, description },
            target
        );
    };
};

/**
 * Listen to a flag when this command is run
 */
export const flag = (key: Match, description: string): MethodDecorator => {
    return (target, property) => {
        Meta.push(
            Meta.prop(Meta.COMMAND_FLAGS, property),
            { key, description },
            target
        );
    };
};
