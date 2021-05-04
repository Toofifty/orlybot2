import { Meta } from '../meta';

export type Constructable<T> = new (...args: any[]) => T;

export const validate = <T extends Object>(
    validatorClass: Constructable<T>,
    ...validators: Exclude<keyof T, 'prototype'>[]
) => {
    return <T>(
        target: Object,
        property: string | symbol,
        index: TypedPropertyDescriptor<T> | number
    ) => {
        if (typeof index === 'number') {
            Meta.push(
                Meta.prop(Meta.COMMAND_ARGS_VALIDATION, property),
                validators.map(v => ({
                    property: v,
                    target: validatorClass,
                    index,
                })),
                target
            );
        } else {
            Meta.push(
                Meta.prop(Meta.COMMAND_VALIDATION, property),
                validators.map(v => ({
                    property: v,
                    target: validatorClass,
                    index,
                })),
                target
            );
        }
    };
};
