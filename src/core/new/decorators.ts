import { CommandArgument, Validator } from 'core/commands/types';
import { CommandController } from '.';
import { Meta } from './meta';

const addToMetaList = <T>(key: any, item: T | T[], target: Object) => {
    const prev: T[] = Reflect.getMetadata(key, target) ?? [];
    if (!Array.isArray(item)) {
        item = [item];
    }
    Reflect.defineMetadata(key, [...prev, ...item], target);
};

export const keyword = (keyword: string): ClassDecorator => {
    return target => {
        Reflect.defineMetadata(Meta.KEYWORD, keyword, target.prototype);
    };
};

/**
 * Define the main command
 */
export const main = (desc: string): MethodDecorator => {
    return (target, propertyKey) => {
        Reflect.defineMetadata(Meta.MAIN_COMMAND, propertyKey, target);
        Reflect.defineMetadata(Meta.DESCRIPTION, desc, target);
    };
};

export const sub = (desc: string): MethodDecorator => {
    return (target, cmd) => {
        addToMetaList(Meta.SUB_COMMANDS, cmd, target);
        Reflect.defineMetadata(
            `${cmd.toString()}/${Meta.DESCRIPTION}`,
            desc,
            target
        );
    };
};

export const delegate = (to: typeof CommandController): MethodDecorator => {
    return (target, cmd) => {
        addToMetaList(Meta.SUB_COMMANDS, cmd, target);
        Reflect.defineMetadata(
            `${cmd.toString()}/${Meta.DELEGATED}`,
            to,
            target
        );
    };
};

export const alias = (...aliases: string[]): MethodDecorator => {
    return (target, cmd) => {
        Reflect.defineMetadata(
            `${cmd.toString()}/${Meta.ALIASES}`,
            aliases,
            target
        );
    };
};

export const validate = (...validators: Validator[]) => {
    return <T>(
        target: Object,
        cmd: string | symbol,
        index: TypedPropertyDescriptor<T> | number
    ) => {
        if (typeof index === 'number') {
            // argument validator
            const args: Record<number, CommandArgument> =
                Reflect.getMetadata(`${cmd.toString()}/${Meta.ARGS}`, target) ??
                {};
            if (!args[index]) {
                args[index] = { name: 'unknown', required: true };
            }
            args[index].validators = validators;
            Reflect.defineMetadata(
                `${cmd.toString()}/${Meta.ARGS}`,
                args,
                target
            );
        } else {
            // command validator
            Reflect.defineMetadata(
                `${cmd.toString()}/${Meta.VALIDATION}`,
                validators,
                target
            );
        }
    };
};

export const arg = (name: string): ParameterDecorator => {
    return (target, cmd, index) => {
        const args: Record<number, CommandArgument> =
            Reflect.getMetadata(`${cmd.toString()}/${Meta.ARGS}`, target) ?? {};
        if (!args[index]) {
            args[index] = { name, required: false };
        }
        args[index].name = name;
        Reflect.defineMetadata(`${cmd.toString()}/${Meta.ARGS}`, args, target);
    };
};

export const required: ParameterDecorator = (target, cmd, index) => {
    const args: Record<number, CommandArgument> =
        Reflect.getMetadata(`${cmd.toString()}/${Meta.ARGS}`, target) ?? {};
    if (!args[index]) {
        args[index] = { name: 'unknown', required: true };
    }
    args[index].required = true;
    Reflect.defineMetadata(`${cmd.toString()}/${Meta.ARGS}`, args, target);
};
