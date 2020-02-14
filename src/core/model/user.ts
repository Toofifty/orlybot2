import bot from 'core/bot';
import { camel } from 'core/util';
import { ID } from 'core/model/types';
import DbModel from 'core/model/db-model';
import db from 'core/db';
import Message, { SavedMessage } from './message';

const USER_TAG_REGEX = /<@(\w{9})(?:\|\w+)?>*/;

export default class User extends DbModel {
    public id: ID;

    /**
     * _User_ name, not display name of the user. Usually
     * just the user's actual first name.
     */
    public name: string;
    public profile: {
        /**
         * The actual display name of the user that shows
         * up in messages
         */
        displayName: string;
    };

    /**
     * Whether this user is in the admin list
     */
    public isAdmin: boolean;

    /**
     * Complete message history for the user.
     */
    public messages?: SavedMessage[];

    private _meta: Record<string, any> = {};

    public static from(data: any) {
        return super.from(data) as Promise<User>;
    }

    protected async finalise(data: any) {
        this.isAdmin = process.env.SLACK_ADMINS!.split(',').includes(this.id);
        this._meta = data.meta ?? {};
        return this;
    }

    /**
     * Look for a user by ID.
     *
     * Will first try to load the user information from the database,
     * and if not found will ask Slack for the data.
     */
    public static async find(id: ID, refetch?: boolean): Promise<User> {
        if (USER_TAG_REGEX.test(id)) {
            id = id.match(USER_TAG_REGEX)![0];
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

    /**
     * Get a tag to mention the user.
     */
    public get tag() {
        return `<@${this.id}>`;
    }

    /**
     * Get a mock-Slackname for the user (what would show in Slack).
     */
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
            meta: this._meta,
        };
    }

    /**
     * Miscellaneous storage on the user - store any
     * key and any type of data here to persist it
     * to the database.
     *
     * If `data` is not passed (undefined), it will
     * return the current value of that meta data.
     *
     * If `data` is a function, that callback will
     * be passed the current meta value and it's
     * return value will be saved.
     *
     * Use `deleteMeta()` to set a meta value to
     * undefined.
     */
    public meta(key: string, data?: unknown): unknown {
        if (data !== undefined) {
            if (typeof data === 'function') {
                // set data via callback
                this._meta[key] = data(this._meta[key]);
            } else {
                // set data
                this._meta[key] = data;
            }
            this.save();
        }
        return this._meta[key];
    }

    /**
     * Delete (set to undefined) a meta value by key.
     */
    public deleteMeta(key: string) {
        this._meta[key] = undefined;
        this.save();
    }

    /**
     * Send a direct message to the user.
     */
    public message(text: string) {
        return bot._message({
            channel: this.id,
            as_user: true,
            text,
        });
    }

    /**
     * Send a direct ephemeral message to the user.
     */
    public ephemeral(text: string) {
        return bot._ephemeral({
            channel: this.id,
            user: this.id,
            as_user: true,
            text,
        });
    }

    /**
     * Log a message on the user.
     */
    public said(message: Message) {
        if (!this.messages) this.messages = [];
        this.messages.push(message.serialize());
        this.save();
    }

    public toString() {
        return this.tag;
    }
}
