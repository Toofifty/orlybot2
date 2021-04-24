import { Controller } from './controller';
import { Constructable } from './di/container';
import { registry } from 'core/commands';
import { adapt } from './adapt';
import { loginfo } from 'core/log';

export const register = async <T extends Controller>(
    controller: Constructable<T>
) => {
    (await adapt(controller)).forEach(cmd => {
        registry.register(cmd);
        loginfo(cmd.helpWithAliases);
    });
};
