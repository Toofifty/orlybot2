import { RTMClient } from '@slack/rtm-api';
import {
    WebClient,
    ChatPostMessageArguments,
    ChatPostEphemeralArguments,
    UsersInfoArguments,
    ConversationsInfoArguments,
} from '@slack/web-api';
import { loginfo, logdebug } from './log';
import User from './model/user';
import Message from './model/message';

class Bot {
    private web: WebClient;
    private rtm: RTMClient;

    public constructor() {
        this.web = new WebClient(process.env.SLACK_TOKEN);
        this.rtm = new RTMClient(process.env.SLACK_TOKEN);
        this.rtm.start();
        loginfo('Connected to Slack');
        this.checkIn();
        this.registerMessageListener();
    }

    private checkIn(): void {
        process.env.SLACK_ADMINS.split(',')
            .filter(Boolean)
            .forEach(async adminId => {
                const adminUser = await User.find(adminId);
                await adminUser.ephemeral('Checking in!');
                logdebug('Checked in with', adminUser.slackName);
            });
    }

    private async registerMessageListener(): Promise<void> {
        this.rtm.on('message', data => {
            console.log(Message.from(data));
        });
    }

    public _message(options: ChatPostMessageArguments) {
        return this.web.chat.postMessage(options);
    }

    public _ephemeral(options: ChatPostEphemeralArguments) {
        return this.web.chat.postEphemeral(options);
    }

    public async _fetchUser(options: UsersInfoArguments): Promise<any> {
        return ((await this.web.users.info(options)) as any).user;
    }

    public async _fetchChannel(options: ConversationsInfoArguments) {
        return ((await this.web.conversations.info(options)) as any).channel;
    }
}

const bot = new Bot();
export default bot;
