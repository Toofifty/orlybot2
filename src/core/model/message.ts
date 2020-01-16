import BaseModel from 'core/model/base-model';
import User from 'core/model/user';
import Channel from 'core/model/channel';
import bot from 'core/bot';

enum MessageType {
    MESSAGE = 'message',
}

enum MessageSubtype {
    GROUP_JOIN = 'group_join',
}

export default class Message extends BaseModel {
    public type: MessageType;
    public subtype?: MessageSubtype;
    public text: string;
    public user: User;
    public channel: Channel;
    public time: Date;

    public static from(data: any) {
        return super.from(data) as Promise<Message>;
    }

    public async finalise(data: any) {
        this.user = await User.find(data.user);
        this.channel = await Channel.find(data.channel);
        this.time = new Date(data.ts.split('.')[0]);
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
        return this.channel.message(text);
    }

    public replyEphemeral(text: string) {
        return this.channel.ephemeral(this.user.id, text);
    }

    public replyPrivately(text: string) {
        return this.user.message(text);
    }
}
