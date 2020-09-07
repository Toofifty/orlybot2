import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import User from 'core/model/user';
import Channel from 'core/model/channel';
import Message from 'core/model/message';
import { pre } from 'core/util';

const activeInstances: Instance[] = [];

// hacky way to avoid junk messages :)
const isValidMessage = (text: string) =>
    text.match(/[abcdefgiklmnopqrstuvwxyz]/i);

export const findInstance = (user: User) =>
    activeInstances.find(instance => instance.owner.id === user.id);

export default class Instance {
    public adventure: string;
    public characterName: string;
    public owner: User;
    public channel: Channel;
    public active: boolean = false;

    private process: ChildProcessWithoutNullStreams;

    constructor(adventure: string, characterName: string, message: Message) {
        if (findInstance(message.user)) {
            return;
        }

        this.adventure = adventure;
        this.characterName = characterName;
        this.owner = message.user;
        this.channel = message.channel;

        this.process = spawn('ai-dungeon-cli', [
            '--adventure',
            this.adventure,
            '--name',
            this.characterName,
        ]);

        activeInstances.push(this);
        this.active = true;

        console.log('Instance for', this.owner.slackName, 'is ready');
    }

    public begin() {
        this.process.stdout.addListener('data', this.print);
    }

    public destroy() {
        this.process.stdout.removeListener('data', this.print);
    }

    public write(message: string) {
        this.process.stdin.write(message);
    }

    public print = (data: string) => {
        console.log(`"${data.toString()}"`);
        if (isValidMessage(data.toString())) {
            this.channel.message(
                `${this.characterName} (${this.owner}): ${pre(data)}`
            );
        }
    };
}
