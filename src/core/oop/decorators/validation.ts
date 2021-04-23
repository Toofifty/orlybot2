import { Meta } from '../meta';

export const validate = <T extends Object>(
    validatorClass: T,
    ...validators: Exclude<keyof T, 'prototype'>[]
) => {
    console.log(validators);
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
        }
    };
};
