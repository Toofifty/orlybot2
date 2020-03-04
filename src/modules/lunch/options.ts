import { Command } from 'core/commands';
import { rollover, load, update } from './data';
import { weight } from './decide';
import { findOption, findOptionIndex } from './util';

export const listOptions = Command.sub('options', async message => {
    await rollover(message.channel);
    const { options, history, today, userPreferences } = await load(
        message.channel
    );

    if (options.length === 0) throw 'No bueno :confused:';

    const weightedOptions = options
        .map(option => ({
            ...option,
            weight: weight(option, history, today, userPreferences),
        }))
        .sort((a, b) => (a.weight > b.weight ? 1 : -1));

    const totalWeight = weightedOptions.reduce(
        (total, option) => total + option.weight,
        0
    );

    return `All options:\n ${weightedOptions
        .map(
            option =>
                `${option.icon}*${option.name}* (${(
                    (option.weight / totalWeight) *
                    100
                ).toFixed(2)}%) - ${option.category}${
                    option.attributes
                        ? ` (${option.attributes.join(', ')})`
                        : ''
                }`
        )
        .join('\n')}`;
})
    .desc('List all lunch options')
    .alias('o');

export const addOption = Command.sub(
    'add-option',
    async (message, [name, category, icon]) => {
        await rollover(message.channel);
        const { options, categories } = await load(message.channel);

        if (!icon) throw 'Invalid arguments';

        if (!categories.includes(category.toLowerCase()))
            throw `Couldn't find category ${category.toLowerCase()}`;

        if (findOption(options, name))
            throw 'That option already exists :confused:';

        await update(message.channel, store => ({
            ...store,
            options: [...store.options, { name, category, icon }],
        }));

        return `Added new _${category}_ lunch option: *${name}* ${icon}`;
    }
)
    .desc('Add a new lunch option')
    .alias('options:add', 'ao')
    .arg({ name: 'name', required: true })
    .arg({ name: 'category', required: true })
    .arg({ name: 'icon', required: true });

export const removeOption = Command.sub(
    'remove-option',
    async (message, [name]) => {
        await rollover(message.channel);
        const { options } = await load(message.channel);

        const index = findOptionIndex(options, name);
        if (index === -1) throw `Couldn't find lunch option *${name}*`;

        const option = options[index];
        options.splice(index, 1);
        await update(message.channel, store => ({
            ...store,
            options,
        }));

        return `Removed _${option.category}_ lunch option: *${option.name}`;
    }
)
    .desc('Remove a lunch option')
    .alias('options:remove', 'ro')
    .arg({ name: 'name', required: true });

export const editOption = Command.sub(
    'edit-option',
    async (message, [oldName, name, category, icon]) => {
        await rollover(message.channel);
        const { options } = await load(message.channel);

        if (!icon) throw 'Invalid arguments';

        const option = findOption(options, oldName);

        if (!option) throw `Couldn't find option ${oldName} to update`;

        const newOption = { name, category, icon };

        // update history
        await update(message.channel, store => ({
            ...store,
            history: store.history.map(item => ({
                ...item,
                option:
                    item.option?.name.toLowerCase() === oldName.toLowerCase()
                        ? newOption
                        : item.option,
            })),
            options: [
                ...store.options.filter(
                    ({ name }) =>
                        name.toLowerCase() !== option.name.toLowerCase()
                ),
                newOption,
            ],
        }));

        return `Updated option from *${option.name}* ${option.icon} (${option.category}) to *${name}* ${icon} (${category})`;
    }
)
    .desc('Edit an option without removing history')
    .arg({ name: 'old-name', required: true })
    .arg({ name: 'new-name', required: true })
    .arg({ name: 'new-category', required: true })
    .arg({ name: 'new-icon', required: true })
    .alias('options:edit', 'eo');
