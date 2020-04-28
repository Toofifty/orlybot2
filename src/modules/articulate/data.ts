import Channel from 'core/model/channel';
import db from 'core/db';

interface ArticulateStore {
    currentWord?: string;
    describer?: string;
    lastDescriber?: string;
    startTime?: number;
}

export const load = async (channel: Channel): Promise<ArticulateStore> => {
    const data = await db.get<ArticulateStore>(`articulate:${channel.id}`);
    if (!data) {
        update(channel, store => ({
            currentWord: undefined,
            describer: undefined,
            lastDescriber: undefined,
            startTime: undefined,
            ...store,
        }));
        return load(channel);
    }
    return data;
};

export const update = (
    channel: Channel,
    callback: (data: Partial<ArticulateStore>) => ArticulateStore
) => db.update(`articulate:${channel.id}`, callback);
