import bot from 'core/bot';
import { camel } from 'core/util';
import { ID } from 'core/model/types';
import DbModel from 'core/model/db-model';
import db from 'core/db';
import Message, { SavedMessage } from './message';

const USER_TAG_REGEX = /<@(\w{9})(?:\|\w+)?>*/;

export default class User extends DbModel {
    public id: ID;
    public name: string;
    public profile: {
        displayName: string;
    };
    public isAdmin: boolean;
    public messages?: SavedMessage[];
    public meta: Record<string, any> = {};

    public static from(data: any) {
        return super.from(data) as Promise<User>;
    }

    protected async finalise(data: any) {
        this.isAdmin = process.env.SLACK_ADMINS.split(',').includes(this.id);
        return this;
    }

    public static async find(id: ID, refetch?: boolean): Promise<User> {
        if (USER_TAG_REGEX.test(id)) {
            id = id.match(USER_TAG_REGEX)[0];
        }

        const dbUser = await db.get(`user:${id}`);
        if (refetch || !dbUser) {
            const user = await this.from(
                camel(await bot._fetchUser({ user: id }))
            );
            await db.put(user.serialize());
            return user;
        }
        return await this.from(dbUser);
    }

    public get tag() {
        return `<@${this.id}>`;
    }

    public get slackName() {
        return `@${this.profile.displayName}`;
    }

    public serialize() {
        return {
            _id: `user:${this.id}`,
            ...(this._rev ? { _rev: this._rev } : {}),
            name: this.name,
            profile: {
                displayName: this.profile.displayName,
            },
            messages: this.messages,
            meta: this.meta,
        };
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

    public said(message: Message) {
        if (!this.messages) this.messages = [];
        this.messages.push(message.serialize());
        this.save();
    }

    public toString() {
        return this.tag;
    }
}
