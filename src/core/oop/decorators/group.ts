import { Meta } from '../meta';
import { Constructable } from '../di/container';

/**
 * Create an "umbrella" command for all the subcommands within.
 * If you'd still like to run an action on this command, use a
 * method decorated with `@maincmd`.
 */
export const group = (
    name: string,
    groupDescription?: string | string[]
): ClassDecorator => {
    return target => {
        Meta.set(Meta.COMMAND_GROUP, name, target.prototype);
        Meta.set(
            Meta.GROUP_DESCRIPTION,
            Array.isArray(groupDescription)
                ? groupDescription.join('\n')
                : groupDescription,
            target.prototype
        );
    };
};

/**
 * Register a method to be ran before any sub-command
 * is run.
 */
export const before: MethodDecorator = (target, property) => {
    Meta.set(Meta.GROUP_BEFORE, property, target);
};

/**
 * Register a method to be ran after any sub-command
 * is run.
 */
export const after: MethodDecorator = (target, property) => {
    Meta.set(Meta.GROUP_AFTER, property, target);
};

export const delegate = (
    ...delegates: Constructable<any>[]
): ClassDecorator => {
    return target => {
        Meta.set(Meta.GROUP_DELEGATES, delegates, target.prototype);
    };
};

/**
 * Run a method when the bot is initialised
 */
export const setup: MethodDecorator = (target, property) => {
    Meta.set(Meta.GROUP_SETUP, property, target);
};
