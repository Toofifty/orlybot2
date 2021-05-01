import { Store, Channel, injectable } from 'core';

export interface IGpt3Store {}

interface Gpt3Store extends IGpt3Store {}

@injectable()
class Gpt3Store extends Store<IGpt3Store> {
    initial = {};

    constructor(channel: Channel) {
        super(`gpt3:${channel.id}`);
    }
}

export default Gpt3Store;
