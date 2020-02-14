import { Command } from 'core/commands';
import { dateTZ } from 'core/util';
import db from 'core/db';
import Channel from 'core/model/channel';
import { LunchStore, LunchRecord } from './types';
import { decide } from './decide';

const defaultToday = (): LunchRecord => ({
    option: null,
    date: dateTZ().toDateString(),
    participants: [],
    successful: true,
});

const defaultData = (): LunchStore => ({
    today: defaultToday(),
    history: [],
    options: [],
    categories: [],
});

const load = async (channel: Channel) => {
    const data = await db.get<LunchStore>(`lunch:${channel.id}`);
    if (!data) throw new Error('Failed to load channel lunch data :(');
    return data;
};

const update = (channel: Channel, callback: (data: LunchStore) => LunchStore) =>
    db.update(`lunch:${channel.id}`, callback);

const rollover = (channel: Channel) =>
    update(channel, store => {
        const { today, history } = store ?? defaultData();
        if (today.date !== dateTZ().toDateString()) {
            if (!today.option) today.successful = false;
            store.history = [...history, today];
            store.today = defaultToday();
        }
        return store;
    });

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
    update(message.channel, store => ({
        ...store,
        today: {
            ...store.today,
            option: decision,
        },
    }));
})
    .desc("What's for lunch?")
    .alias('l', 'i', "what's for lunch?", 'whats for lunch?')
    .isPhrase();
