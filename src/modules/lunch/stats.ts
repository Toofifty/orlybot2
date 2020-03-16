import { Command } from 'core/commands';
import { rollover, load } from './data';
import { findOption, print } from './util';
import { weight } from './decide';
import { WeightBreakdown, LunchOption } from './types';
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
        `Breakdown for ${print(option)} (${w.toFixed(2)} points):\n` +
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

export const lunchHistory = Command.sub('history', async (message, [name]) => {
    await rollover(message.channel);
    const { today, history, options } = await load(message.channel);
    let response = '*Recent lunch :sandwich: history*\n';
    const opt: LunchOption | undefined = name
        ? findOption(options, name)
        : undefined;

    if (today.option && (!opt || opt.name === today.option.name)) {
        response += `Today - *${today.option.name}* ${today.option.icon}\n`;
    }

    response += history
        .filter(
            visit => visit.option && (!opt || opt.name === visit.option.name)
        )
        .map(
            visit =>
                `${visit.successful ? '' : '~'}${visit.date} - *${
                    visit.option!.name
                }* ${visit.option!.icon || ''}${visit.successful ? '' : '~'}` +
                (visit.successful
                    ? ` (${visit.participants.length} participants)`
                    : ` (${visit.rerollVoters?.length} votes to reroll)`)
        )
        .join('\n');

    return response;
})
    .desc('Get the lunch history')
    .arg({ name: 'option-name', required: false });
