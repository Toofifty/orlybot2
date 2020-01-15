import BaseModel from './base-model';
import User from './user';
import Channel from './channel';

export default class Message extends BaseModel {
    type: string;
    text: string;
    user: User;
    channel: Channel;
    time: Date;

    static async from(data: any) {
        return super.from(data) as Promise<Message>;
    }

    public async finalise(data: any) {
        this.user = await User.find(data.user);
        this.channel = await Channel.find(data.channel);
        this.time = new Date(data.ts);
        return this;
    }
}
