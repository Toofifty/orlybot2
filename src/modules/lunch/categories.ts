import { Command } from 'core/commands';
import { rollover, load, update } from './data';

export const listCategories = Command.sub('categories', async message => {
    await rollover(message.channel);
    const { categories } = await load(message.channel);

    if (categories.length === 0) return 'No categories found :confused:';

    return `All categories: ${categories.join(', ')}`;
})
    .desc('List all lunch categories')
    .alias('c');

export const addCategory = Command.sub(
    'add-category',
    async (message, [name]) => {
        await rollover(message.channel);
        const { categories } = await load(message.channel);

        if (!name) throw 'Category name not specified';

        if (categories.includes(name.toLowerCase()))
            throw `There\'s already a category with the name ${name.toLowerCase()}`;

        await update(message.channel, store => ({
            ...store,
            categories: [...categories, name.toLowerCase()],
        }));

        return `Added lunch category _${name}_`;
    }
)
    .desc('Add a lunch option category')
    .arg({ name: 'name', required: true })
    .alias('categories:add', 'ac');

export const removeCategory = Command.sub(
    'remove-category',
    async (message, [name]) => {
        await rollover(message.channel);
        const { categories } = await load(message.channel);

        if (!name) throw 'Category name not specified';

        if (!categories.includes(name.toLowerCase()))
            throw `I can't find a category named ${name.toLowerCase()}`;

        await update(message.channel, store => ({
            ...store,
            categories: categories.filter(cat => cat !== name.toLowerCase()),
        }));

        return `Removed lunch category _${name}_`;
    }
)
    .desc('Remove a lunch option category')
    .arg({ name: 'name', required: true })
    .alias('categories:remove', 'rc');

export const editCategory = Command.sub(
    'edit-category',
    async (message, [oldName, name]) => {
        await rollover(message.channel);
        const { categories } = await load(message.channel);

        if (!name) throw 'Invalid arguments';

        if (!categories.includes(oldName.toLowerCase()))
            throw `I can't find a category named ${oldName.toLowerCase()}`;

        await update(message.channel, store => ({
            ...store,
            history: store.history.map(item => ({
                ...item,
                option: item.option && {
                    ...item.option,
                    category:
                        item.option?.category === oldName.toLowerCase()
                            ? name.toLowerCase()
                            : item.option?.category,
                },
            })),
            categories: [
                ...categories.filter(cat => cat !== oldName.toLowerCase()),
                name.toLowerCase(),
            ],
        }));

        return `Renamed lunch category _${oldName}_ to _${name}_`;
    }
)
    .desc('Rename a lunch option category, preserving history')
    .arg({ name: 'name', required: true })
    .alias('categories:edit', 'ec');
