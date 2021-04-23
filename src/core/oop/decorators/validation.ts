import { InjectableValidator } from '../types';

export const validate = (...validators: InjectableValidator[]) => {
    return <T>(
        target: Object,
        property: string | symbol,
        index: TypedPropertyDescriptor<T> | number
    ) => {
        console.log(target[property].toString());
        if (typeof index === 'number') {
        } else {
        }
    };
};
