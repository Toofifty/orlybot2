import { ID } from './types';
import BaseModel from './base-model';
import bot from 'core/bot';
import { camel } from 'core/util/case';

export default class User extends BaseModel {
    id: ID;
    name: string;
    profile: { displayName: string };

    static async from(data: any) {
        return super.from(data) as Promise<User>;
    }

    static async find(key: string) {
        return this.from(camel(await bot._fetchUser({ user: key })));
    }

    public get tag() {
        return `<@${this.id}>`;
    }

    public get slackName() {
        return `@${this.profile.displayName}`;
    }

    public message(text: string) {
        return bot._message({
            channel: this.id,
            as_user: true,
            text,
        });
    }

    public ephemeral(text: string) {
        return bot._ephemeral({
            channel: this.id,
            user: this.id,
            as_user: true,
            text,
        });
    }
}
