import { ChannelDungeon } from './types';
import Channel from 'core/model/channel';
import db from 'core/db';

const defaultData = (): ChannelDungeon => ({
    sessionId: undefined,
    players: [],
});

export const load = async (channel: Channel) => {
    const data = await db.get<ChannelDungeon>(`dungeon:${channel.id}`);
    if (!data) throw new Error('Failed to load channel dungeon data');
    return data;
};

export const update = (
    channel: Channel,
    callback: (data: ChannelDungeon) => Partial<ChannelDungeon>
) => db.update(`dungeon:${channel.id}`, callback);

export const init = (channel: Channel) => update(channel, defaultData);
