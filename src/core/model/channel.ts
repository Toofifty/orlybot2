import { camel } from 'core/util/case';
import bot from 'core/bot';
import BaseModel from './base-model';
import { ID } from './types';

export default class Channel extends BaseModel {
    id: ID;
    name: string;
    isChannel: boolean;
    isGroup: boolean;
    isIm: boolean;
    isMember: boolean;
    isPrivate: boolean;

    static async from(data: any) {
        return super.from(data) as Promise<Channel>;
    }

    static async find(key: string) {
        return this.from(camel(await bot._fetchChannel({ channel: key })));
    }
}
