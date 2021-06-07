import { nanoid } from 'nanoid';
import { injectable, Kwargs, Message } from 'core';
import bot from 'core/bot';
import WatchStore, { Watcher } from './watch.store';
import { extractId, pre } from 'core/util';

const listeners: Record<string, (message: Message) => void> = {};

@injectable()
export default class WatchService {
    constructor(private store: WatchStore) {}

    startWatcher(watcher: Watcher) {
        const listener = (message: Message) => {
            if (this.matchesMessage(message, watcher)) {
                this.alert(message, watcher);

                if (watcher.once) {
                    this.removeWatcher(watcher);
                    return;
                }

                const storedWatcher = this.store.watchers.find(
                    w => w.id === watcher.id
                );

                if (storedWatcher) {
                    storedWatcher.matches++;
                    this.store.save();
                }
            }
        };

        bot.onMessage(listener);
        listeners[watcher.id] = listener;
    }

    async createWatcher(
        message: Message,
        channel: string,
        search: string,
        kwargs: Kwargs
    ) {
        const watcher: Watcher = {
            id: nanoid(8),
            owner: message.user.id,
            channel: channel,
            commandMessage: message.serialize(),
            matches: 0,
            search,
            once: kwargs.has('once'),
            mention: kwargs.get('mention'),
        };

        this.store.watchers.push(watcher);
        await this.store.save();

        this.startWatcher(watcher);

        return watcher;
    }

    async removeWatcher(watcher: Watcher) {
        if (listeners[watcher.id]) {
            bot.offMessage(listeners[watcher.id]);
        }

        this.store.watchers = this.store.watchers.filter(
            w => w.id !== watcher.id
        );
        await this.store.save();
    }

    renderWatcherList(watchers: Watcher[]) {
        if (watchers.length === 0) return 'No watchers found.';

        return pre(
            watchers
                .map(
                    ({ id, channel, search, matches }) =>
                        `${id} | ${channel} | "${search}" | hits: ${matches}`
                )
                .join('\n')
        );
    }

    private isRegex(text: string) {
        return /^\/.+\/(?:\w+)?$/.test(text);
    }

    private async alert(message: Message, watcher: Watcher) {
        if (watcher.mention) {
            await message.replyInThread(watcher.mention);
            return;
        }

        const commandMessage = await Message.from(watcher.commandMessage);
        const permalink = await message.getPermalink();

        commandMessage.reply([
            `I found a match for \`${watcher.search}\` in ${watcher.channel}`,
            permalink,
        ]);
    }

    private matchesMessage({ text, channel }: Message, watcher: Watcher) {
        if (channel.id !== extractId(watcher.channel)) return;

        if (this.isRegex(watcher.search)) {
            const [, pattern, flags] = watcher.search.split('/');
            return new RegExp(pattern, flags).test(text);
        }

        return text.toLowerCase().includes(watcher.search.toLowerCase());
    }
}
