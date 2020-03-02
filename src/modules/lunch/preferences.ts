import { Command } from 'core/commands';
import { omit } from 'core/util';
import { rollover, load, update } from './data';

export const listPreferences = Command.sub('preferences', async message => {
    await rollover(message.channel);
    const { userPreferences } = await load(message.channel);

    if (!userPreferences[message.user.id]) {
        message.replyEphemeral("You don't have any preferences set.");
        return;
    }

    const preferences = userPreferences[message.user.id];

    message.replyEphemeral(
        `Your lunch preferences: ${Object.keys(preferences)
            .map(pref => `${pref}${preferences[pref] ? ' (required)' : ''}`)
            .join(', ')}`
    );
})
    .desc('List your preferences')
    .alias('prefs', 'p');

export const addPreference = Command.sub(
    'add-preference',
    async (message, [preference, required]) => {
        await rollover(message.channel);
        const { userPreferences } = await load(message.channel);

        if (!preference) throw 'Preference not specified';

        const isRequired = !!required && required.toLowerCase() !== 'false';

        update(message.channel, store => ({
            ...store,
            userPreferences: {
                ...store.userPreferences,
                [message.user.id]: {
                    ...(userPreferences[message.user.id] ?? {}),
                    [preference]: isRequired,
                },
            },
        }));

        message.replyEphemeral(
            `Added preference: ${preference}${isRequired ? ' (required)' : ''}`
        );
    }
)
    .desc('Save a personal preference for lunch')
    .arg({ name: 'preference', required: true })
    .arg({ name: 'required', def: 'false' })
    .alias('add-pref', 'ap', 'preferences:add');

export const removePreference = Command.sub(
    'remove-preference',
    async (message, [preference]) => {
        await rollover(message.channel);
        const { userPreferences } = await load(message.channel);

        if (!preference) throw 'Preference not specified';

        const preferences = userPreferences[message.user.id];

        if (!preferences) throw "You don't have any preferences saved";

        update(message.channel, store => ({
            ...store,
            userPreferences: {
                ...store.userPreferences,
                [message.user.id]: omit(preferences, preference),
            },
        }));
    }
)
    .desc('Remove a preference')
    .arg({ name: 'preference', required: true })
    .alias('rem-pref', 'rp', 'preferences:remove');
