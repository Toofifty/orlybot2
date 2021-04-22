import { Command } from 'core/commands';
import Container, { Constructable } from './di/container';
import { Controller } from './controller';
import { Meta, MetaKey } from './meta';

const getMetaFactory = (target: Object, property?: string) => <T>(
    key: MetaKey
): T => Meta.get(property ? Meta.prop(key, property) : key, target);

export const adapt = <T extends Controller>(
    controller: Constructable<T>
): Command[] => {
    const cls = Container.resolve(controller);
    const meta = getMetaFactory(cls);

    const group = meta<string>(Meta.COMMAND_GROUP);
    const main = meta<string>(Meta.MAIN_COMMAND);

    if (main && !group) {
        throw new Error(
            'Failed to construct commands from controller.' +
                ' If a @maincmd is specified, the class must have a @group.'
        );
    }

    const subcommands = (meta<string[]>(Meta.SUB_COMMANDS) ?? []).map(sub =>
        createCommand(cls, sub)
    );

    if (!group) return subcommands;

    const cmd = createCommand(cls, group, true);
    subcommands.forEach(sub => {
        cmd.nest(sub);
    });

    return [cmd];
};

// Instead of isGroup:
// const createCommand = (meta: MetaFactory, cls, sub) => {
// Also, rename sub to method?

const createCommand = (cls: Controller, sub: string, isGroup = false) => {
    const cmeta = getMetaFactory(cls);
    const meta = getMetaFactory(cls, sub);

    return Command.sub(
        isGroup ? cmeta(Meta.COMMAND_GROUP) : meta(Meta.COMMAND_NAME),
        createAction(cls, sub)
    )
        .desc(meta(Meta.COMMAND_DESCRIPTION))
        .alias(...(meta<string[]>(Meta.COMMAND_ALIASES) ?? []))
        .isPhrase(meta(Meta.COMMAND_IS_PHRASE) ?? false)
        .isPartial(meta(Meta.COMMAND_IS_PARTIAL) ?? false)
        .isAdmin(meta(Meta.COMMAND_IS_ADMIN) ?? false)
        .isHidden(meta(Meta.COMMAND_IS_HIDDEN) ?? false);
};

const createAction = (cls: Controller, sub: string) => {
    return async (_: any, args: string[]) => {
        await Container.execute(cls, sub, args);
    };
};
