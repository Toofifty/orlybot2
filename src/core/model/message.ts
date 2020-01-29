import BaseModel from 'core/model/base-model';
import User from 'core/model/user';
import Channel from 'core/model/channel';
import bot from 'core/bot';
import { tokenize, split } from 'core/util';

const CHANNEL_ALIAS_REGEX = /^<#(\w{9})(?:\|\w+)?>:\s*/;
const USER_ALIAS_REGEX = /^<@(\w{9})(?:\|\w+)?>:\s*/;

enum MessageType {
    MESSAGE = 'message',
}

enum MessageSubtype {
    GROUP_JOIN = 'group_join',
}

export type SavedMessage = {
    type: MessageType;
    subtype?: MessageSubtype;
    text: string;
    originalUser: string;
    originalChannel: string;
    aliasedUser?: string;
    aliasedChannel?: string;
    originalText: string;
    ts: number;
};

export default class Message extends BaseModel {
    public type: MessageType;
    public subtype?: MessageSubtype;
    public text: string;
    public originalUser: User;
    public aliasedUser?: User;
    public originalChannel: Channel;
    public aliasedChannel?: Channel;
    public time: Date;

    private originalText: string;

    public static from(data: any) {
        return super.from(data) as Promise<Message>;
    }

    protected async finalise(data: any) {
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
            const [match, channelId] = this.text.match(CHANNEL_ALIAS_REGEX);
            this.aliasedChannel = await Channel.find(channelId);
            this.text = this.originalText.replace(match, '');
        }

        if (USER_ALIAS_REGEX.test(this.originalText)) {
            if (!this.user.isAdmin) {
                this.replyError("You don't have permission to alias a user");
                return this;
            }
            const [match, userId] = this.text.match(USER_ALIAS_REGEX);
            this.aliasedUser = await User.find(userId);
            this.text = this.text.replace(match, '');
        }

        this.user.said(this);

        return this;
    }

    private static userMessageTypes(): MessageType[] {
        return [MessageType.MESSAGE];
    }

    public get isUserMessage(): boolean {
        return (
            Message.userMessageTypes().includes(this.type) &&
            !this.subtype &&
            this.user.id !== 'USLACKBOT' &&
            this.user.id !== bot.id
        );
    }

    public reply(text: string) {
        if (this.channel.isIm) return this.replyPrivately(text);
        return this.channel.message(text);
    }

    public replyEphemeral(text: string) {
        return this.channel.ephemeral(this.user.id, text);
    }

    public replyPrivately(text: string) {
        return this.user.message(text);
    }

    public replyError(text: string) {
        return this.replyEphemeral(`:exclamation:\`${text}\``);
    }

    public replySystemError(text: string) {
        return this.replyEphemeral(`:bangbang: \`${text}\``);
    }

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

    public get user() {
        return this.aliasedUser ?? this.originalUser;
    }

    public set user(user: User) {
        this.originalUser = user;
    }

    public get channel() {
        return this.aliasedChannel ?? this.originalChannel;
    }

    public set channel(channel: Channel) {
        this.originalChannel = channel;
    }

    public get tokens() {
        return tokenize(this.text);
    }

    public get firstToken() {
        return this.tokens[0];
    }

    public get lastTokens() {
        return this.tokens.slice(1);
    }

    public get terms() {
        return split(this.tokens, '&amp;&amp;');
    }

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
            ts: Number(this.time),
        };
    }
}
