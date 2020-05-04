import { RTMClient } from '@slack/rtm-api';
import {
    WebClient,
    ChatPostMessageArguments,
    ChatPostEphemeralArguments,
    UsersInfoArguments,
    ConversationsInfoArguments,
    ReactionsAddArguments,
    ChatUpdateArguments,
    PinsAddArguments,
    PinsRemoveArguments,
} from '@slack/web-api';
import { loginfo, logdebug, logerror } from './log';
import User from 'core/model/user';
import { sleep, camel } from 'core/util';
import Message from './model/message';
import { ID } from './model/types';
import CommandRunner from './commands/runner';
import { AllEvents } from './event-types';

export type RTMEvent = 'reaction_added' | 'reaction_removed';

class Bot {
    public id: ID;
    public name: string;
    private web: WebClient;
    private rtm: RTMClient;
    private readyCallbacks: ((bot: Bot) => void)[] = [];
    private eventCallbacks: WeakMap<Function, Function> = new WeakMap();

    public constructor() {
        this.web = new WebClient(process.env.SLACK_TOKEN!);
        this.rtm = new RTMClient(process.env.SLACK_TOKEN!);
        // this.checkIn();
        this.registerMessageListener();
        this.rtm.start().then(({ self }: any) => {
            this.id = self.id;
            this.name = self.name;
            this.readyCallbacks.forEach(cb => cb(this));
            this.readyCallbacks = [];
        });
        loginfo('Connected to Slack');
    }

    public ready(cb: (bot: Bot) => void) {
        if (this.id) {
            cb(this);
        } else {
            this.readyCallbacks.push(cb);
        }
    }

    /**
     * Send a check-in message to the admins so they
     * know when the bot is started/restarted.
     */
    private async checkIn(): Promise<void> {
        await sleep(2000);
        process.env
            .SLACK_ADMINS!.split(',')
            .filter(Boolean)
            .forEach(async adminId => {
                const adminUser = await User.find(adminId);
                await adminUser.message('Checking in!');
                logdebug('Checked in with', adminUser.slackName);
            });
    }

    private async registerMessageListener(): Promise<void> {
        this.rtm.on('message', async data => {
            if (!data) return;
            const message = await Message.from(data);
            if (!message.isUserMessage) return;
            this.rtm.sendTyping(message.channel.id);
            loginfo(message.toString());

            CommandRunner.handle(message);
        });
    }

    /**
     * Send a message to a user or channel.
     *
     * Will attempt to use RTM if only text and channel are specified,
     * otherwise (and on error) it will fall back to the web client.
     */
    public async _message(options: ChatPostMessageArguments) {
        try {
            // attempt to use rtm if possible
            const { channel, as_user, text, ...nonRTM } = options;
            if (Object.keys(nonRTM).length === 0) {
                return await this.rtm.sendMessage(text, channel);
            }
        } catch {}
        return await this.web.chat.postMessage(options);
    }

    public _react(options: ReactionsAddArguments) {
        return this.web.reactions.add(options);
    }

    public _pin(options: PinsAddArguments) {
        return this.web.pins.add(options);
    }

    public _unpin(options: PinsRemoveArguments) {
        return this.web.pins.remove(options);
    }

    public _update(options: ChatUpdateArguments) {
        return this.web.chat.update(options);
    }

    /**
     * Send an ephemeral message to a user.
     */
    public _ephemeral(options: ChatPostEphemeralArguments) {
        return this.web.chat.postEphemeral(options);
    }

    /**
     * Fetch a user's information from Slack.
     */
    public async _fetchUser(options: UsersInfoArguments) {
        try {
            return ((await this.web.users.info(options)) as any).user;
        } catch (e) {
            logerror('Failed to fetch user', options);
            return undefined;
        }
    }

    /**
     * Fetch channel information from Slack.
     */
    public async _fetchChannel(options: ConversationsInfoArguments) {
        return ((await this.web.conversations.info(options)) as any).channel;
    }

    public on<T extends AllEvents>(
        event: T['type'],
        callback: (data: T) => void
    ) {
        const camelCallback = (data: any) => callback(camel(data));
        this.eventCallbacks.set(callback, camelCallback);
        this.rtm.on(event, camelCallback);
    }

    public once<T extends AllEvents>(
        event: T['type'],
        callback: (data: T) => void
    ) {
        const camelCallback = (data: any) => camel(data);
        this.eventCallbacks.set(callback, camelCallback);
        this.rtm.once(event, camelCallback);
    }

    public off<T extends AllEvents>(
        event: T['type'],
        callback?: (data: T) => void
    ) {
        if (callback) {
            const memoCallback = this.eventCallbacks.get(callback);
            if (memoCallback) {
                this.rtm.off(event, memoCallback as any);
            }
        }
        this.rtm.off(event);
    }
}

/**
 * Main bot instance.
 *
 * Not to be used outside of `core` :)
 *
 * @private
 */
const bot = new Bot();
export default bot;
