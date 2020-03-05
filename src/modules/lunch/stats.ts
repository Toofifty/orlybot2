import { Command } from 'core/commands';
import { rollover, load } from './data';
import { findOption, print } from './util';
import { weight } from './decide';
import { WeightBreakdown } from './types';
import { capitalise } from 'core/util';

export const optionStats = Command.sub('stats', async (message, [name]) => {
    await rollover(message.channel);
    const { options, history, today, userPreferences } = await load(
        message.channel
    );

    if (!name) throw 'Invalid arguments';

    const option = findOption(options, name);

    if (!option) throw `Couldn't find an option with name ${name}`;

    const breakdown: WeightBreakdown = {};
    const w = weight(option, history, today, userPreferences, breakdown);
    breakdown.finalWeight = w;

    return (
        `Breakdown for ${print(option)} (${w.toFixed(2)}%):\n` +
        Object.keys(breakdown)
            .map(key => {
                const value =
                    typeof breakdown[key] === 'number'
                        ? breakdown[key].toFixed(4)
                        : breakdown[key];
                return `\`${key}: ${value}\``;
            })
            .join('\n')
    );
})
    .desc("Get weight and reasons behind and lunch option's weight")
    .arg({ name: 'option', required: true });
