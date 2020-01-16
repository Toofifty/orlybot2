import bot from 'core/bot';
import { camel } from 'core/util';
import { ID } from 'core/model/types';
import BaseModel from 'core/model/base-model';
import Store from 'core/store';

const store = Store.create('users', {} as Record<ID, Partial<User>>);

export default class User extends BaseModel {
    id: ID;
    name: string;
    profile: {
        displayName: string;
    };

    static from(data: any) {
        return super.from(data) as Promise<User>;
    }

    static async find(id: ID, refetch?: boolean): Promise<User> {
        if (refetch || !store.get([id])) {
            const user = await this.from(
                camel(await bot._fetchUser({ user: id }))
            );
            store.commit([id], user.serialize());
            return user;
        }
        return await this.from(store.get([id]));
    }

    public get tag() {
        return `<@${this.id}>`;
    }

    public get slackName() {
        return `@${this.profile.displayName}`;
    }

    public serialize() {
        return {
            id: this.id,
            name: this.name,
            profile: {
                displayName: this.profile.displayName,
            },
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
}
