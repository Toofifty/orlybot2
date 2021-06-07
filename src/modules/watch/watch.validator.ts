import { injectable, User } from 'core';
import { ArgumentValidator } from 'core/oop/types';
import { extractId } from 'core/util';
import WatchStore from './watch.store';

export default class WatchValidator {
    isValidChannel(): ArgumentValidator {
        return async arg => {
            const channelId = extractId(arg);
            if (!channelId || channelId.length < 9 || channelId.length > 11) {
                return 'Invalid channel ID';
            }
            return true;
        };
    }

    @injectable()
    watcherExists(store: WatchStore): ArgumentValidator {
        return async arg =>
            store.watchers.some(watcher => watcher.id === arg) ||
            "Couldn't find a watcher with that ID";
    }

    @injectable()
    userCanRemoveWatcher(user: User, store: WatchStore): ArgumentValidator {
        return async arg => {
            const watcher = store.watchers.find(w => w.id === arg)!;
            return (
                user.isAdmin ||
                user.id === watcher.owner ||
                "You can't remove that watcher"
            );
        };
    }
}
