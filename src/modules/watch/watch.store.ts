import { Store, injectable, ID, SavedMessage } from 'core';

export type Watcher = {
    id: ID;
    owner: ID;
    channel: ID;
    commandMessage: SavedMessage;
    mention?: string;
    search: string;
    once: boolean;
    silent: boolean;
    matches: number;
};

export interface IWatchStore {
    watchers: Watcher[];
}

interface WatchStore extends IWatchStore {}

@injectable()
class WatchStore extends Store<IWatchStore> {
    initial = { watchers: [] };

    constructor() {
        super(`watch`);
    }
}

export default WatchStore;
