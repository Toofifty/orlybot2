import { Command } from 'core/commands';
import CommandRunner from 'core/commands/runner';
import { decide } from './decide';
import { rollover, load, update, cancel } from './data';
import { listOptions, addOption, removeOption, editOption } from './options';
import {
    listCategories,
    addCategory,
    removeCategory,
    editCategory,
} from './categories';
import {
    listTrain,
    joinTrain,
    leaveTrain,
    kickTrain,
    depart,
    startTrain,
} from './train';
import {
    listPreferences,
    addPreference,
    removePreference,
} from './preferences';
import { listAttributes, addAttribute, removeAttribute } from './attributes';
import { optionStats } from './stats';

Command.create('lunch', async message => {
    await rollover(message.channel);
    const { today, options, history, userPreferences } = await load(
        message.channel
    );

    if (!today.participants.includes(message.user.id)) {
        throw new Error(
            "Only passengers of the lunch train can ask what's for lunch. Board the lunch train!"
        );
    }

    if (today.option) {
        return `I still think we should get ${
            today.option.icon ? `${today.option.icon} ` : ''
        }*${today.option.name}*.`;
    }

    if (options.length === 0) {
        throw new Error(
            "I don't have any lunch options! Add some with `lunch options:add <name> <category> [icon]`"
        );
    }

    const { weight, ...decision } = decide(
        options,
        history,
        today,
        userPreferences
    );
    await update(message.channel, store => ({
        ...store,
        today: {
            ...store.today,
            option: decision,
        },
    }));

    return `I think we should get ${decision.icon ? `${decision.icon} ` : ''}*${
        decision.name
    }*! (${weight}% chance)`;
})
    .desc("What's for lunch?")
    .alias('l', 'i', "what's for lunch?", 'whats for lunch?', 'lunch?')
    .isPhrase()
    .nest(
        Command.sub('reroll', async message => {
            await rollover(message.channel);
            let { today } = await load(message.channel);

            if (!today.participants.find(id => id === message.user.id)) {
                throw 'You have to join the lunch train to vote to reroll';
            }

            if (today.rerollVoters?.find(id => id === message.user.id)) {
                throw "You've already voted to reroll";
            }

            await update(message.channel, store => ({
                ...store,
                today: {
                    ...store.today,
                    rerollVoters: [
                        ...(today.rerollVoters ?? []),
                        message.user.id,
                    ],
                },
            }));
            ({ today } = await load(message.channel));

            message.reply(
                `${message.user} voted to reroll today's lunch ${
                    today.rerollVoters?.length
                }/${Math.ceil(today.participants.length / 2) + 1}`
            );

            if (
                (today.rerollVoters?.length ?? 0) >
                today.participants.length / 2
            ) {
                message.reply(
                    `Looks like we're not getting ${today.option?.name}, rerolling...`
                );

                await cancel(message.channel);
                CommandRunner.run('lunch', message);
            }
        }).desc("Vote to reroll today's chosen lunch")
    )
    .nest(
        Command.sub('override', async (message, args) => {
            await rollover(message.channel);
            const { options } = await load(message.channel);

            const name = args.join(' ');

            const option = options.find(option => option.name.includes(name));

            if (!option) {
                throw `I can't find a lunch option with that name \`${name}\``;
            }

            update(message.channel, store => ({
                ...store,
                today: {
                    ...store.today,
                    option,
                },
            }));

            message.reply(
                `Lunch overridden to ${option.icon} *${option.name}*!`
            );
        })
            .desc("Override today's lunch option")
            .arg({ name: 'option-name', required: true })
            .admin()
    )
    .nest(
        Command.sub('help', message => {
            CommandRunner.run('help lunch', message);
        }).desc('Get lunch help')
    )
    // options
    .nest(listOptions)
    .nest(addOption)
    .nest(removeOption)
    .nest(editOption)
    .nest(optionStats)
    // categories
    .nest(listCategories)
    .nest(addCategory)
    .nest(removeCategory)
    .nest(editCategory)
    // train
    .nest(startTrain)
    .nest(listTrain)
    .nest(joinTrain)
    .nest(leaveTrain)
    .nest(kickTrain)
    .nest(depart)
    // preferences
    .nest(listPreferences)
    .nest(addPreference)
    .nest(removePreference)
    // attributes
    .nest(listAttributes)
    .nest(addAttribute)
    .nest(removeAttribute);
