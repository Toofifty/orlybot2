import bot from 'core/bot';
import { camel } from 'core/util';
import { ID } from 'core/model/types';
import DbModel from 'core/model/db-model';
import db from 'core/db';
import { loginfo } from 'core/log';

/**
 * Model for a channel or Slack conversation (group messages or instant message).
 */
export default class Channel extends DbModel {
    public id: ID;
    public name: string;
    public isChannel: boolean;
    public isGroup: boolean;
    public isIm: boolean;
    public isMember: boolean;
    public isPrivate: boolean;

    /**
     * Construct a channel model from the data given.
     */
    public static from(data: any) {
        return super.from(data) as Promise<Channel>;
    }

    /**
     * Look for a channel by ID.
     *
     * Will first try to load the channel information from the database,
     * and if not found will ask Slack for the data.
     */
    public static async find(id: ID, refetch?: boolean): Promise<Channel> {
        const dbChannel = await db.get(`channel:${id}`);
        if (refetch || !dbChannel) {
            loginfo('Fetching channel data for', id);
            const channel = await this.from(
                camel(await bot._fetchChannel({ channel: id }))
            );
            await db.put(channel.serialize());
            return channel;
        }
        return await this.from(dbChannel);
    }

    /**
     * Get a taggable name for the channel (will turn to a link in Slack).
     */
    public get tag(): string | undefined {
        return this.name && `#${this.name}`;
    }

    public serialize() {
        return {
            _id: `channel:${this.id}`,
            _rev: this._rev,
            name: this.name,
            isChannel: this.isChannel,
            isGroup: this.isGroup,
            isIm: this.isIm,
            isMember: this.isMember,
            isPrivate: this.isPrivate,
        };
    }

    /**
     * Send a regular message to the channel.
     */
    public message(text: string) {
        return bot._message({
            channel: this.id,
            as_user: true,
            text,
        });
    }

    /**
     * Send an ephemeral message to the channel and user.
     */
    public ephemeral(userId: string, text: string) {
        return bot._ephemeral({
            channel: this.id,
            user: userId,
            as_user: true,
            text,
        });
    }
}
