import { Meta } from '../meta';
import { loginfo } from 'core/log';

/**
 * Create an "umbrella" command for all the subcommands within.
 * If you'd still like to run an action on this command, use a
 * method decorated with `@maincmd`.
 */
export const group = (name: string): ClassDecorator => {
    return target => {
        Meta.set(Meta.COMMAND_GROUP, name, target.prototype);
    };
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
