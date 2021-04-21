import { logdebug } from 'core/log';

export const group = (value: string): ClassDecorator => {
    return target => {
        logdebug('DECORATOR "group"', target, value);
    };
};
