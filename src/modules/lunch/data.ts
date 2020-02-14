import { dateTZ } from 'core/util';
import Channel from 'core/model/channel';
import db from 'core/db';
import { LunchRecord, LunchStore } from './types';

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

export const load = async (channel: Channel) => {
    const data = await db.get<LunchStore>(`lunch:${channel.id}`);
    if (!data) throw new Error('Failed to load channel lunch data :(');
    return data;
};

export const update = (
    channel: Channel,
    callback: (data: LunchStore) => LunchStore
) => db.update(`lunch:${channel.id}`, callback);

export const rollover = (channel: Channel) =>
    update(channel, store => {
        // initialise store
        if (!store.history || !store.options || !store.categories) {
            store = { ...store, ...defaultData() };
        }
        const { today, history } = store;
        if (today.date !== dateTZ().toDateString()) {
            if (!today.option) today.successful = false;
            store.history = [...history, today];
            store.today = defaultToday();
        }
        return store;
    });
