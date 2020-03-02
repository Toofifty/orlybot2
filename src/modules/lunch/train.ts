import dayjs from 'dayjs';
import { parseDate } from 'chrono-node';
import { Command } from 'core/commands';
import User from 'core/model/user';
import { rollover, load, update } from './data';
import { mention } from 'core/util/strings';

const LUNCH_TRAIN = ':steam_locomotive::railway_car::railway_car:';

export const listTrain = Command.sub('who', async message => {
    await rollover(message.channel);
    const { today } = await load(message.channel);

    if (today.participants.length === 0)
        return `Nobody has joined the lunch train ${LUNCH_TRAIN} yet :confused:. Join using \`lunch join\`!`;

    message.reply(
        `Choo choo! Here's how the lunch train is looking today: \n${LUNCH_TRAIN}${today.participants
            .map(mention)
            .join(':railway_car:')}:railway_car:`
    );

    if (!today.option) {
        message.reply(
            "Hmmm... we haven't picked a restaurant yet. Ask me `what's for lunch?` and I'll choose one."
        );
    }
})
    .desc('Check who is going to lunch today')
    .alias('whom');

export const joinTrain = Command.sub('join', async message => {
    await rollover(message.channel);
    const { today } = await load(message.channel);

    if (today.participants.includes(message.user.id))
        return `You're already on the lunch train! A bit eager today, aren't we ${message.user}?`;

    await update(message.channel, store => ({
        ...store,
        today: {
            ...today,
            participants: [...today.participants, message.user.id],
        },
    }));

    return `${message.user} joined the lunch train! ${LUNCH_TRAIN} Anyone else?`;
}).desc(`Join the lunchtrain! ${LUNCH_TRAIN}`);

export const leaveTrain = Command.sub('leave', async message => {
    await rollover(message.channel);
    const { today } = await load(message.channel);

    if (!today.participants.includes(message.user.id))
        throw `You're not on the lunch train ${message.user}`;

    await update(message.channel, store => ({
        ...store,
        today: {
            ...today,
            participants: today.participants.filter(p => p !== message.user.id),
        },
    }));

    return `${message.user} left the lunc train :cry:`;
}).desc('Leave the lunchtrain :(');

export const kickTrain = Command.sub('kick', async (message, [user]) => {
    await rollover(message.channel);
    const { today } = await load(message.channel);

    const target = await User.find(user);

    if (!target) throw "I can't find that user";
    if (!today.participants.includes(target.id))
        throw "They're not on the lunch train";

    await update(message.channel, store => ({
        ...store,
        today: {
            ...today,
            participants: today.participants.filter(p => p !== target.id),
        },
    }));

    return `${target} has been kicked off of the lunch train by ${message.user}`;
})
    .desc('Kick someone off the lunch train')
    .arg({ name: '@user', required: true });

export const depart = Command.sub('depart', async (message, [...time]) => {
    await rollover(message.channel);
    const { today } = await load(message.channel);

    if (!today.participants.find(id => id === message.user.id))
        throw "You can't tell the lunch train to depart if you're not in it :angry:";

    if (!today.option) throw "We haven't even picked where we're going...";

    const joinedTime = time.join(' ') || 'in 5 minutes';
    const departureTime = dayjs(parseDate(joinedTime));

    message.reply(
        `Noted! We'll leave at ${departureTime.toDate().toLocaleTimeString()}`
    );

    setTimeout(() => {
        `Choo choo! The lunch train is departing! \n${LUNCH_TRAIN}${today.participants
            .map(mention)
            .join(':railway_car:')}:railway_car:`;
    }, dayjs().diff(departureTime));
})
    .desc('Tell the lunch train to depart')
    .arg({ name: 'time', def: 'in 5 minutes' });
