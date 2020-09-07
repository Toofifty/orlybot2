import { Command } from 'core/commands';
import CommandRunner from 'core/commands/runner';
import Instance, { findInstance } from './instance';
import { load, init, update } from './data';

/**
 * AIDungeon
 *
 * Runs an ai-dungeon-cli process for each user connected
 * Grabs output from the process, sends to Slack
 *
 * One dungeon (session) running per channel, saved to channel info
 * All users & usernames saved to channel
 * On reboot, reconnect all users to the session (try to avoid any login messages?)
 *
 * Capture do/say/story/remember actions as subcommands
 */

Command.create('dungeon', async (message, actionParts) => {
    const { sessionId, players } = await load(message.channel);

    if (!sessionId) {
        message.replyError(
            "There's no adventure running in this channel - use `dungeon help` for info on how to begin new adventures"
        );
        return;
    }

    const player = players.find(({ id }) => message.user.id === id);

    if (!player) {
        message.replyError(
            "You're not in the current adventure - you can join with `dungeon join`"
        );
        return;
    }

    let instance = findInstance(message.user);

    if (!instance) {
        instance = new Instance(sessionId, player.characterName, message);

        if (!instance.active) {
            message.replyError(
                "I couldn't resume your instance - pls ask @matho to fix"
            );
            return;
        }

        instance.begin();
        message.replyEphemeral('Resuming, one sec...');
    }

    instance.write(actionParts.join(' ') + '\n');
})
    .desc("Run a dungeon action, or manage the channel's dungeon")
    .arg({ required: true, name: 'action...' })
    .alias('d')
    .nest(
        Command.sub('init-data', async message => {
            try {
                await load(message.channel);
                message.replyError('Channel data is already initialised.');
            } catch {
                await init(message.channel);
                message.replyEphemeral('Channel data initialised.');
            }
        })
            .admin()
            .desc('Initialise channel data for this module')
    )
    .nest(
        Command.sub('do', message =>
            CommandRunner.run(`dungeon "/do ${message.text}"`, message)
        ).desc('Do something')
    )
    .nest(
        Command.sub('say', message =>
            CommandRunner.run(`dungeon "/say ${message.text}"`, message)
        ).desc('Say something')
    )
    .nest(
        Command.sub('story', message =>
            CommandRunner.run(`dungeon "/story ${message.text}"`, message)
        ).desc('Alter the story of the adventure')
    )
    .nest(
        Command.sub('remember', message =>
            CommandRunner.run(`dungeon "/remember ${message.text}"`, message)
        ).desc('Tell the DM to remember some information')
    )
    .nest(
        Command.sub(
            'new',
            async (message, [newSessionId, ...characterNameParts]) => {
                const { sessionId } = await load(message.channel);

                if (sessionId) {
                    message.replyError(
                        "There's already an adventure running in this channel. " +
                            'You can join it using `dungeon join <character-name>`'
                    );
                    return;
                }

                const characterName = characterNameParts.join(' ');

                const instance = new Instance(
                    newSessionId,
                    characterName,
                    message
                );

                if (!instance.active) {
                    message.replyError("You've already joined an adventure.");
                    return;
                }

                instance.begin();
                message.reply(
                    `${message.user} has created a new party! Join with \`dungeon join <character-name>\``
                );

                update(message.channel, data => ({
                    ...data,
                    sessionId: newSessionId,
                    players: [
                        {
                            id: message.user.id,
                            characterName,
                        },
                    ],
                }));
            }
        )
            .arg({
                required: true,
                name: 'session-id',
            })
            .arg({
                required: true,
                name: 'character-name',
            })
            .desc('Begin a new dungeon for this channel, and join the party')
    )
    .nest(
        Command.sub('join', async (message, characterNameParts) => {
            const { sessionId, players } = await load(message.channel);

            if (!sessionId) {
                message.replyError(
                    "There's no adventure running in this channel - use `dungeon help` for info on how to begin new adventures"
                );
                return;
            }

            if (players.find(({ id }) => message.user.id === id)) {
                message.replyError(
                    "You're already in the current adventure, stupid"
                );
                return;
            }

            const characterName = characterNameParts.join(' ');

            const instance = new Instance(sessionId, characterName, message);

            if (!instance.active) {
                message.replyError("You've already joined an adventure.");
                return;
            }

            instance.begin();
            message.reply(`${message.user} has joined the party!`);

            update(message.channel, data => ({
                ...data,
                players: [
                    ...data.players,
                    {
                        id: message.user.id,
                        characterName,
                    },
                ],
            }));
        })
            .arg({
                required: true,
                name: 'character-name',
            })
            .desc('Join the party')
    )
    .nest(
        Command.sub(
            'help',
            () =>
                '*AIDungeon help*\n\n' +
                '*What is this*\n' +
                "AIDungeon is an AI powered MUD - kind of like Dungeons and Dragons. Just like DnD - you can do pretty much whatever you want, the DM AI will (most of the time) be able to understand what you've said and do the action for your character. \n\n" +
                '*How to join the party*\n' +
                "You can join the channel's party at any time using the `dungeon join <character-name>` command. You won't be able to join if the character name is already in use. If no adventure is currently running in the channel, see below for how to begin one.\n\n" +
                '*How to play*\n' +
                "Once you've joined an adventure, you're free to do whatever you want. For certain types of actions, there are keywords `do`, `say`, `story` and `remember`. These can be executed by using the `dungeon` command followed by a keyword and a description of the action or phrase you'd like to say or do. Note: `do` is the default keyword - you can omit this for most actions.\n\n" +
                '*Beginning a new adventure*\n' +
                'To begin a new adventure, you must first create a multiplayer lobby via https://play.aidungeon.io/\n' +
                'Once the story begins, you will be able to "Invite Friends" via the menu in the top right of the page. The bottom link in this modal contains the session ID - it should look like this: `59e3700d-be5f-48ac-b319-f387cdf90154`. Copy that and use it in place of `<session-id>` in the `dungeon new <session-id> <character-name>` command.'
        ).desc('Get help')
    );
