import {
    admin,
    aliases,
    cmd,
    Controller,
    flag,
    group,
    hidden,
    kwarg,
    Kwargs,
    loginfo,
    maincmd,
    Message,
    setup,
    validate,
} from 'core';
import WatchStore from './watch.store';
import WatchService from './watch.service';
import WatchValidator from './watch.validator';

@group('watch', [
    '*Watch* - watch channels and alert on matching messages',
    '*General usage*',
    "> Use the `watch` command to begin a watcher. When I see a message that contains your search terms, I'll make a post with a link to it and tag you.",
    "> To privately watch something, send me a direct message and I'll send responses there.",
    '> Regexes can also be used - just surround your search term with `/`s.',
    "> *Note*: I can only watch channels I've been added to. Use `/invite @mathobot` to add me to a channel.",
    '*Extra flags*',
    "> If you'd instead like me to reply to the original message and mention someone, pass `-m|--mention` and a space-separated list of users to mention.",
    '> If you only want to be alerted once for a match, pass `-1|--once`',
    '*Example usage*',
    '> Watch #dev for a sub-task created by @matho - `watch #dev @matho created a sub-task`',
    '> Mention @matho and @ben on the next production deployment - `watch --once --mention "@matho @ben" #production-deployments 👍👍 Sidekicker (master)`',
    '> Watch #dev-ds for comments on a pull request - `watch #dev-ds /new comment by .+ on pull request #83/i`',
])
export default class WatchController extends Controller {
    @setup
    setup(store: WatchStore, service: WatchService) {
        loginfo('Starting up', store.watchers.length, 'watchers');
        store.watchers.forEach(watcher => {
            service.startWatcher(watcher);
        });
    }

    @maincmd('Send alerts when a matching message is found')
    @kwarg(
        ['mention', 'm'],
        'Mention users as a reply to the matched message, rather than make a new post'
    )
    @flag(['once', '1'], 'Only alert once on match')
    async watch(
        message: Message,
        kwargs: Kwargs,
        service: WatchService,
        @validate(WatchValidator, 'isValidChannel')
        channel: string,
        ...search: string[]
    ) {
        const watcher = await service.createWatcher(
            message,
            channel,
            search.join(' '),
            kwargs
        );
        await message.addReaction('eyes');
        await message.replyEphemeral(
            `Added new watcher with ID \`${watcher.id}\``
        );
    }

    @cmd('list', 'List all of your current watchers')
    async list(message: Message, store: WatchStore, service: WatchService) {
        const watchers = store.watchers.filter(
            watcher => watcher.owner === message.user.id
        );
        await message.replyEphemeral(service.renderWatcherList(watchers));
    }

    @cmd('list-all', 'Shh')
    @admin
    @hidden
    async listAll(message: Message, store: WatchStore, service: WatchService) {
        await message.replyEphemeral(service.renderWatcherList(store.watchers));
    }

    @cmd('unwatch', 'Remove a watcher by ID')
    @aliases('remove', 'stop')
    async remove(
        message: Message,
        store: WatchStore,
        service: WatchService,
        @validate(WatchValidator, 'watcherExists', 'userCanRemoveWatcher')
        id: string
    ) {
        const watcher = store.watchers.find(w => w.id === id)!;
        await service.removeWatcher(watcher);
        await message.addReaction('white_check_mark');
    }
}
