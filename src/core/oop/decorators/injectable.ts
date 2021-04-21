import { logdebug } from 'core/log';

export const injectable = (target: Object, propertyName?: string) => {
    logdebug('DECORATOR "injectable"', target);
    logdebug(Reflect.getMetadata('design:paramtypes', target));
};

export const injectableMethod = (target: Object, propertyName: string) => {
    logdebug('DECORATOR "injectableMethod"', target);
    logdebug(Reflect.getMetadata('design:paramtypes', target, propertyName));
};
