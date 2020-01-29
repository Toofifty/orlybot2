import { RTMClient } from '@slack/rtm-api';
import {
    WebClient,
    ChatPostMessageArguments,
    ChatPostEphemeralArguments,
    UsersInfoArguments,
    ConversationsInfoArguments,
} from '@slack/web-api';
import { loginfo, logdebug, logerror } from './log';
import User from 'core/model/user';
import { sleep } from 'core/util';
import Message from './model/message';
import { ID } from './model/types';
import CommandRunner from './commands/runner';

class Bot {
    public id: ID;
    public name: string;
    private web: WebClient;
    private rtm: RTMClient;

    public constructor() {
        this.web = new WebClient(process.env.SLACK_TOKEN);
        this.rtm = new RTMClient(process.env.SLACK_TOKEN);
        // this.checkIn();
        this.registerMessageListener();
        this.rtm.start().then(({ self }: any) => {
            this.id = self.id;
            this.name = self.name;
        });
        loginfo('Connected to Slack');
    }

    /**
     * Send a check-in message to the admins so they
     * know when the bot is started/restarted.
     */
    private async checkIn(): Promise<void> {
        await sleep(2000);
        process.env.SLACK_ADMINS.split(',')
            .filter(Boolean)
            .forEach(async adminId => {
                const adminUser = await User.find(adminId);
                await adminUser.message('Checking in!');
                logdebug('Checked in with', adminUser.slackName);
            });
    }

    private async registerMessageListener(): Promise<void> {
        this.rtm.on('message', async data => {
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
