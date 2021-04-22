import { Controller } from './controller';
import { Constructable } from './di/container';
import { registry } from 'core/commands';
import { adapt } from './adapt';

export const register = <T extends Controller>(
    controller: Constructable<T>
) => {
    adapt(controller).forEach(cmd => registry.register(cmd));
};
