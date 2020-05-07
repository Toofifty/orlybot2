import bot from 'core/bot';
import {
    AllEvents,
    ReactionAddedData,
    ReactionRemovedData,
} from 'core/event-types';
import BaseModel from './base-model';
import Message, { SavedMessage } from './message';

/**
 * Serialised message for database storage.
 */
export type SavedBotMessage = {
    ts: string;
    text: string;
    ok: boolean;
    parent: SavedMessage;
    children: SavedBotMessage[];
};

export default class BotMessage extends BaseModel {
    public ts: string;
    public text: string;
    public ok: boolean;
    public parent: Message;
    public children: BotMessage[];

    public static from(data: any) {
        return super.from(data) as Promise<BotMessage>;
    }

    protected async finalise(data: any) {
        if (data.parent) {
            this.parent = await Message.from(data.parent);
        }

        return this;
    }

    private on<T extends AllEvents>(
        event: T['type'],
        callback: (data: T) => void
    ) {
        bot.on(event, callback);
    }

    private off<T extends AllEvents>(
        event: T['type'],
        callback?: (data: T) => void
    ) {
        bot.off(event, callback);
    }

    private once<T extends AllEvents>(
        event: T['type'],
        callback: (data: T) => void
    ) {
        bot.once(event, callback);
    }

    public onReactionAdded(
        reaction: string,
        callback: (data: ReactionAddedData) => void
    ) {
        this.on('reaction_added', data => {
            if (
                data.item.ts === this.ts &&
                data.type === 'reaction_added' &&
                data.reaction === reaction
            ) {
                callback(data);
            }
        });
    }

    public onReactionRemoved(
        reaction: string,
        callback: (data: ReactionRemovedData) => void
    ) {
        this.on('reaction_removed', data => {
            if (
                data.item.ts === this.ts &&
                data.type === 'reaction_removed' &&
                data.reaction === reaction
            ) {
                callback(data);
            }
        });
    }

    public async addReaction(reaction: string) {
        await bot._react({
            name: reaction,
            channel: this.parent.channel.id,
            timestamp: this.ts,
        });
    }

    public async edit(text: string) {
        await bot._update({
            ts: this.ts,
            channel: this.parent.channel.id,
            text,
        });
    }

    public async pin() {
        await bot._pin({
            timestamp: this.ts,
            channel: this.parent.channel.id,
        });
    }

    public async unpin() {
        await bot._unpin({
            timestamp: this.ts,
            channel: this.parent.channel.id,
        });
    }

    public async replyInThread(message: string) {
        return (
            await BotMessage.from(
                await bot._message({
                    thread_ts: this.ts,
                    channel: this.parent.channel.id,
                    text: message,
                })
            )
        ).set({
            parent: this.parent,
        });
    }

    public serialize(): SavedBotMessage {
        return {
            ts: this.ts,
            text: this.text,
            ok: this.ok,
            parent: this.parent.serialize(),
            children: (this.children ?? []).map(each => each.serialize()),
        };
    }
}
