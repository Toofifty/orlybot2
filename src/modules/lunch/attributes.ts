import { Command } from 'core/commands';
import { rollover, load, update } from './data';
import { findOption, print } from './util';

export const listAttributes = Command.sub(
    'attributes',
    async (message, [name]) => {
        await rollover(message.channel);
        const { options } = await load(message.channel);

        const option = findOption(options, name);
        if (!option) throw `Couldn't find lunch option *${name}*`;

        return `${print(option)} attributes: ${(option.attributes ?? []).join(
            ', '
        )}`;
    }
)
    .desc('List attributes for an option')
    .arg({ name: 'option-name', required: true })
    .alias('a', 'attrs');

export const addAttribute = Command.sub(
    'add-attribute',
    async (message, [name, attribute]) => {
        await rollover(message.channel);
        const { options } = await load(message.channel);

        if (!attribute) throw 'Invalid arguments';

        const option = findOption(options, name);
        if (!option) throw `Couldn't find lunch option *${name}*`;

        if (option.attributes?.includes(attribute.toLowerCase()))
            throw `${print(option)} already has that attribute.`;

        update(message.channel, store => ({
            ...store,
            options: [
                ...options.filter(o => o.name !== option.name),
                {
                    ...option,
                    attributes: [
                        ...(option.attributes ?? []),
                        attribute.toLowerCase(),
                    ],
                },
            ],
        }));

        return `Added attribute *${attribute}* to ${print(option)}`;
    }
)
    .desc('Add an attribute to a lunch option')
    .arg({ name: 'option-name', required: true })
    .arg({ name: 'attribute', required: true })
    .alias('aa');

export const removeAttribute = Command.sub(
    'remove-attribute',
    async (message, [name, attribute]) => {
        await rollover(message.channel);
        const { options } = await load(message.channel);

        if (!attribute) throw 'Invalid arguments';

        const option = findOption(options, name);
        if (!option) throw `Couldn't find lunch option *${name}*`;

        if (!option.attributes?.includes(attribute.toLowerCase()))
            throw `${print(option)} doesn't have that attribute.`;

        update(message.channel, store => ({
            ...store,
            options: [
                ...options.filter(o => o.name !== option.name),
                {
                    ...option,
                    attributes: [
                        ...(option.attributes ?? []).filter(
                            attr => attr !== attribute
                        ),
                    ],
                },
            ],
        }));

        return `Removed attribute *${attribute}* from ${print(option)}`;
    }
)
    .desc('Remove an attribute from a lunch option')
    .arg({ name: 'option-name', required: true })
    .arg({ name: 'attribute', required: true })
    .alias('ra');
