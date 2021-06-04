import { MessageAttachment } from '@slack/web-api';
import BaseModel from 'core/model/base-model';
import User from 'core/model/user';
import Channel from 'core/model/channel';
import bot from 'core/bot';
import { tokenize, split } from 'core/util';
import BotMessage from './bot-message';
import { logerror } from 'core/log';
import Kwargs, { Match } from './kwargs';

const CHANNEL_ALIAS_REGEX = /^<#(\w{9,11})(?:\|[\w-]+)?>:\s*/;
const USER_ALIAS_REGEX = /^<@(\w{9})(?:\|[\w-]+)?>:\s*/;

enum MessageType {
    MESSAGE = 'message',
}

enum MessageSubtype {
    GROUP_JOIN = 'group_join',
}

/**
 * Serialised message for database storage.
 */
export type SavedMessage = {
    type: MessageType;
    subtype?: MessageSubtype;
    text: string;
    originalUser: string;
    originalChannel: string;
    aliasedUser?: string;
    aliasedChannel?: string;
    originalText: string;
    ts: string;
};

/**
 * Model for a user message received from Slack.
 */
export default class Message extends BaseModel {
    /**
     * Message type. For most user messages, it should
     * be 'message'.
     */
    public type: MessageType;

    /**
     * Message subtype. Not used for most user messages.
     */
    public subtype?: MessageSubtype;

    /**
     * Text to process. May not be the original message -
     * since user and channel aliases are removed.
     */
    public text: string;

    /**
     * Original user that send the message.
     */
    public originalUser: User;

    /**
     * Overridden user to run the message/command as.
     */
    public aliasedUser?: User;

    /**
     * Original channel the message was posted in.
     */
    public originalChannel: Channel;

    /**
     * Overridden channel to process the message/command under.
     */
    public aliasedChannel?: Channel;

    public time: Date;

    public ts: string;

    /**
     * Untouched text, even after aliased users/channels are
     * removed.
     */
    private originalText: string;

    public static from(data: any) {
        return super.from(data) as Promise<Message>;
    }

    protected async finalise(data: any) {
        if (!this.user) return this;
        // prevent re-finalising for sub-messages
        if (this.user.isModel)
            throw new Error('Tried to create model from another');

        this.user = await User.find(data.originalUser ?? data.user);
        this.channel = await Channel.find(data.originalChannel ?? data.channel);
        this.time = new Date(
            typeof data.ts === 'string' ? data.ts.split('.')[0] * 1000 : data.ts
        );
        this.originalText = this.text;

        if (CHANNEL_ALIAS_REGEX.test(this.originalText)) {
            if (!this.user.isAdmin) {
                this.replyError("You don't have permission to alias a channel");
                return this;
            }
            const [match, channelId] = this.text.match(CHANNEL_ALIAS_REGEX)!;
            this.aliasedChannel = await Channel.find(channelId);
            this.text = this.originalText.replace(match, '');
        }

        if (USER_ALIAS_REGEX.test(this.originalText)) {
            if (!this.user.isAdmin) {
                this.replyError("You don't have permission to alias a user");
                return this;
            }
            const [match, userId] = this.text.match(USER_ALIAS_REGEX)!;
            this.aliasedUser = await User.find(userId);
            this.text = this.text.replace(match, '');
        }

        return this;
    }

    /**
     * Parse kwargs and remove them from the message's text
     */
    public parseKwargs(keywords: Match[], flags: Match[]): Kwargs {
        const { kwargs, message } = Kwargs.parse(this.text, keywords, flags);
        this.text = message;
        return kwargs;
    }

    /**
     * Types that indicate the message was a user message.
     */
    private static userMessageTypes(): MessageType[] {
        return [MessageType.MESSAGE];
    }

    /**
     * Check if this message is a user message, meaning
     * it is the correct type and it was not posted by
     * this bot or Slackbot.
     */
    public get isUserMessage(): boolean {
        return (
            Message.userMessageTypes().includes(this.type) &&
            !this.subtype &&
            this.user.id !== 'USLACKBOT' &&
            this.user.id !== bot.id
        );
    }

    /**
     * Reply directly to the message - in whatever context
     * the message was originally in (IM or channel).
     */
    public async reply(
        text: string | string[],
        attachments?: MessageAttachment[]
    ) {
        if (Array.isArray(text)) {
            text = text.join('\n');
        }

        if (this.channel.isIm) return this.replyPrivately(text, attachments);
        return (
            await BotMessage.from(await this.channel.message(text, attachments))
        ).set({
            parent: this,
        });
    }

    /**
     * Reply ephemerally to the message.
     */
    public async replyEphemeral(text: string) {
        return (
            await BotMessage.from(
                await this.channel.ephemeral(this.user.id, text)
            )
        ).set({ parent: this });
    }

    /**
     * Reply to the message in an IM.
     */
    public async replyPrivately(
        text: string,
        attachments?: MessageAttachment[]
    ) {
        return (
            await BotMessage.from(await this.user.message(text, attachments))
        ).set({
            parent: this,
        });
    }

    public async replyInThread(text: string) {
        return (
            await BotMessage.from(
                await bot._message({
                    thread_ts: this.ts,
                    channel: this.channel.id,
                    text,
                })
            )
        ).set({
            parent: this,
        });
    }

    /**
     * Show a user error (ephemeral) to the user.
     */
    public replyError(text: string) {
        return this.replyEphemeral(`:exclamation: ${text}`);
    }

    /**
     * Show a system error (ephemeral) to the user.
     */
    public replySystemError(text: string) {
        return this.replyEphemeral(`:bangbang:  ${text}`);
    }

    public async addReaction(reaction: string) {
        try {
            await bot._react({
                name: reaction,
                channel: this.channel.id,
                timestamp: this.ts,
            });
        } catch (e) {
            logerror('addReaction error', (e as Error).message);
        }
    }

    public async removeReaction(reaction: string) {
        try {
            await bot._unreact({
                name: reaction,
                channel: this.channel.id,
                timestamp: this.ts,
            });
        } catch (e) {
            logerror('addReaction error', (e as Error).message);
        }
    }

    public async getPermalink() {
        try {
            return (
                await bot._getPermalink({
                    channel: this.channel.id,
                    message_ts: this.ts,
                })
            ).permalink as string;
        } catch (e) {
            logerror('getPermalink error', (e as Error).message);
            return '';
        }
    }

    /**
     * Get a single-line representation of the whole message
     * for logging.
     */
    public toString() {
        const channelName = this.aliasedChannel
            ? `${this.originalChannel.tag ?? 'direct message'} -> ${
                  this.channel.tag
              }`
            : this.channel.tag ?? 'direct message';
        const userName = this.aliasedUser
            ? `${this.originalUser.slackName} -> ${this.user.slackName}`
            : this.user.slackName;
        return `[${channelName}] ${userName}: ${this.text}`;
    }

    /**
     * Get the acting user (aliased if available, else original).
     */
    public get user() {
        return this.aliasedUser ?? this.originalUser;
    }

    /**
     * Set the original user.
     */
    public set user(user: User) {
        this.originalUser = user;
    }

    /**
     * Get the acting channel (aliased if available, else original).
     */
    public get channel() {
        return this.aliasedChannel ?? this.originalChannel;
    }

    /**
     * Set the original channel.
     */
    public set channel(channel: Channel) {
        this.originalChannel = channel;
    }

    /**
     * Get the contents of the message split into individual
     * tokens - just like command line arguments. Words inside
     * of matching quotes will be treated as a single token.
     */
    public get tokens() {
        return tokenize(this.text);
    }

    /**
     * Get the first token, which will indicate which command to run.
     */
    public get firstToken() {
        return this.tokens[0];
    }

    /**
     * Get all but the first token, these are the command's arguments.
     */
    public get lastTokens() {
        return this.tokens.slice(1);
    }

    /**
     * Get a split list of tokens by `&&`.
     */
    public get terms() {
        return split(this.tokens, '&amp;&amp;');
    }

    public clone() {
        return Message.from(this.serialize());
    }

    /**
     * Get all parsable messages inside this one message - if
     * there is only one term, then this message itself is
     * parsable. If there are more than one, create a "sub"
     * message for each as copies of this message.
     */
    public async all() {
        if (this.terms.length === 1) {
            return [this];
        }
        return await Promise.all(
            this.terms.map(async term =>
                (await Message.from(this.serialize())).set({
                    text: term.join(' '),
                })
            )
        );
    }

    /**
     * Serialize the message data for storage.
     */
    public serialize(): SavedMessage {
        return {
            type: this.type,
            subtype: this.subtype,
            text: this.text,
            originalUser: this.originalUser.id,
            originalChannel: this.originalChannel.id,
            aliasedUser: this.aliasedUser?.id,
            aliasedChannel: this.aliasedChannel?.id,
            originalText: this.originalText,
            ts: this.ts,
        };
    }
}
