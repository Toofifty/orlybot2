const keys = {
    DESIGN_PARAMTYPES: 'design:paramtypes',

    COMMAND_GROUP: 'bot:command_group',
    GROUP_BEFORE: 'bot:group_before',
    GROUP_AFTER: 'bot:group_after',
    GROUP_DELEGATES: 'bot:group_delegates',

    MAIN_COMMAND_METHOD: 'bot:main_command_method',
    SUB_COMMANDS: 'bot:sub_commands',

    COMMAND_DESCRIPTION: 'bot:command_description',
    COMMAND_NAME: 'bot:command_name',
    COMMAND_ALIASES: 'bot:command_aliases',
    COMMAND_IS_PHRASE: 'bot:command_is_phrase',
    COMMAND_IS_PARTIAL: 'bot:command_is_partial',
    COMMAND_IS_HIDDEN: 'bot:command_is_hidden',
    COMMAND_IS_ADMIN: 'bot:command_is_admin',
    COMMAND_ARGS: 'bot:command_args',
    COMMAND_ARGSTART: 'bot:command_argstart',
    COMMAND_KWARGS: 'bot:command_kwargs',
    COMMAND_FLAGS: 'bot:command_flags',

    COMMAND_VALIDATION: 'bot:command_validation',
    COMMAND_ARGS_VALIDATION: 'bot:command_args_validation',
} as const;

export type MetaKey = typeof keys[keyof typeof keys];
export type MetaKeyProp = string;

export const Meta = {
    ...keys,

    prop: (key: MetaKey, property: string | symbol): MetaKeyProp =>
        `${key}:${property.toString()}`,

    set: (key: MetaKey | MetaKeyProp, value: any, target: Object) =>
        Reflect.defineMetadata(key, value, target),

    get: <T>(
        key: MetaKey | MetaKeyProp,
        target: Object,
        property?: string | symbol
    ): T =>
        property
            ? Reflect.getMetadata(key, target, property)
            : Reflect.getMetadata(key, target),

    push: <T>(key: MetaKey | MetaKeyProp, item: T | T[], target: Object) => {
        const prev: T[] = Reflect.getMetadata(key, target) ?? [];
        if (!Array.isArray(item)) item = [item];
        Reflect.defineMetadata(key, [...prev, ...item], target);
    },

    mutate: () => {},
} as const;
