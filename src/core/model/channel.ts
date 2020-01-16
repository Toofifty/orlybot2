import bot from 'core/bot';
import { camel } from 'core/util';
import BaseModel from 'core/model/base-model';
import { ID } from 'core/model/types';
import Store from 'core/store';

const store = Store.create('channels', {} as Record<ID, Partial<Channel>>);

export default class Channel extends BaseModel {
    public id: ID;
    public name: string;
    public isChannel: boolean;
    public isGroup: boolean;
    public isIm: boolean;
    public isMember: boolean;
    public isPrivate: boolean;

    public static from(data: any) {
        return super.from(data) as Promise<Channel>;
    }

    public static async find(id: ID, refetch?: boolean): Promise<Channel> {
        if (refetch || !store.get([id])) {
            const channel = await this.from(
                camel(await bot._fetchChannel({ channel: id }))
            );
            store.commit([id], channel.serialize());
            return channel;
        }
        return await this.from(store.get([id]));
    }

    public get tag() {
        return `#${this.name}`;
    }

    public serialize() {
        return {
            id: this.id,
            name: this.name,
            isChannel: this.isChannel,
            isGroup: this.isGroup,
            isIm: this.isIm,
            isMember: this.isMember,
            isPrivate: this.isPrivate,
        };
    }

    public message(text: string) {
        return bot._message({
            channel: this.id,
            as_user: true,
            text,
        });
    }

    public ephemeral(userId: string, text: string) {
        return bot._ephemeral({
            channel: this.id,
            user: userId,
            as_user: true,
            text,
        });
    }
}
