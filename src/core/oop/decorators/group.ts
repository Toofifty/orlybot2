import { Meta } from '../meta';

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
