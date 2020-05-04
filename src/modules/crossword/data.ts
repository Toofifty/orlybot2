import Channel from 'core/model/channel';
import db from 'core/db';
import { CrosswordStore } from './types';

export const load = async (channel: Channel): Promise<CrosswordStore> => {
    const data = await db.get<CrosswordStore>(`crossword:${channel.id}`);
    if (!data) {
        await update(channel, store => ({ crossword: undefined, ...store }));
        return load(channel);
    }
    return data;
};

export const update = (
    channel: Channel,
    callback: (data: CrosswordStore) => Partial<CrosswordStore>
) => db.update(`crossword:${channel.id}`, callback);
