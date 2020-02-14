import { Command } from 'core/commands';
import { decide } from './decide';
import { rollover, load, update } from './data';
import { listOptions, addOption, removeOption, editOption } from './options';
import {
    listCategories,
    addCategory,
    removeCategory,
    editCategory,
} from './categories';
import { listTrain, joinTrain, leaveTrain, kickTrain } from './train';

Command.create('lunch', async message => {
    await rollover(message.channel);
    const { today, options, history } = await load(message.channel);

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

    const { weight, ...decision } = decide(options, history);
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
    .alias('l', 'i', "what's for lunch?", 'whats for lunch?')
    .isPhrase()
    .nest(
        Command.sub('override', async (message, [name]) => {
            await rollover(message.channel);
            const { today, options } = await load(message.channel);

            if (!today.participants.includes(message.user.id))
                throw "You've gotta be on the lunch train to override";

            if (!today.option) {
                throw "We haven't picked an option yet... why would you want to override?";
            }

            const lunch = options.find(
                option => option.name.toLowerCase() === name.toLowerCase()
            );

            if (!lunch) throw `Never heard of ${name} :man-shrugging:`;

            await update(message.channel, store => ({
                ...store,
                today: {
                    ...store.today,
                    option: lunch,
                },
            }));

            return `Lunch overridden to ${lunch.icon ? `${lunch.icon} ` : ''}*${
                lunch.name
            }*!`;
        })
            .desc("Override today's lunch option")
            .arg({ name: 'option-name', required: true })
            .admin()
    )
    .nest(listOptions)
    .nest(addOption)
    .nest(removeOption)
    .nest(editOption)
    .nest(listCategories)
    .nest(addCategory)
    .nest(removeCategory)
    .nest(editCategory)
    .nest(listTrain)
    .nest(joinTrain)
    .nest(leaveTrain)
    .nest(kickTrain);
