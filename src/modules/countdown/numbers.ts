import { Command, registry } from 'core/commands';
import { randint, choose, shuffle, tag, mention } from 'core/util';
import Message from 'core/model/message';
import User from 'core/model/user';

const BIGS = [25, 50, 75, 100];
const SMALLS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

// game duration (minutes)
const GAME_DURATION = 1;

const games: Record<string, boolean> = {};

const matchesDigits = (text: string, numbers: number[]) => {
    console.log('checking', text);
    const check = numbers.reduce((acc, n) => {
        // remove 1 instance of n from the string
        // numbers are sorted biggest to smallest, so
        // they shouldn't interfere with eachother
        return acc.replace(n.toString(), '');
    }, text);
    console.log('final', check);
    // if any digits left, they used too many
    return !check.match(/\d/);
};

const diffPoints = (diff: number) => {
    if (diff > 10) return 0;
    if (diff > 5) return 5;
    if (diff > 0) return 7;
    return 10;
};

export const numbers = Command.sub(
    'numbers',
    async (message, [bigs, smalls]) => {
        const nBigs = Number(bigs || 2);
        const nSmalls = Number(smalls || 6 - nBigs);

        if (nBigs > 4) {
            throw 'You can\'t have more than 4 bigs';
        }

        if (nBigs + nSmalls !== 6) {
            throw 'Invalid number of numbers';
        }

        if (games[message.channel.id]) {
            throw "There's already a game of Countdown Numbers running";
        }

        games[message.channel.id] = true;

        const target = randint(900) + 100;

        const bigsCopy = [...BIGS];
        const smallsCopy = [...SMALLS];

        const numbers = shuffle(
            Array(nBigs)
                .fill(0)
                .map(() => {
                    const chosen = choose(bigsCopy);
                    const index = bigsCopy.indexOf(chosen);
                    bigsCopy.splice(index, 1);
                    return chosen;
                })
        ).concat(
            shuffle(
                Array(nSmalls)
                    .fill(0)
                    .map(() => {
                        const chosen = choose(smallsCopy);
                        const index = smallsCopy.indexOf(chosen);
                        smallsCopy.splice(index, 1);
                        return chosen;
                    })
            )
        );
        const sortedNumbers = numbers.sort((a, b) => a - b).reverse();

        message.reply(
            `*Countdown Numbers* is starting! You have ${GAME_DURATION} minute to find an equation that arrives at the target number.\n` +
                `Given numbers: ${numbers
                    .map(tag)
                    .join(' ')}\nThe target is *${target}*`
        );

        const submissions: Record<string, string> = {};

        const submit = async (message: Message) => {
            // replace invalid
            const text = message.text.replace(/[^()\d\/*+-]/g, '');
            if (!matchesDigits(text, sortedNumbers)) {
                message.replyEphemeral("That doesn't look quite right");
                message.addReaction('x');
                return;
            }
            if (Object.values(submissions).some(sub => text === sub)) {
                message.replyEphemeral('Someone already submitted that');
                message.addReaction('x');
                return;
            }
            const result = eval(text);
            const diff = Math.abs(target - result);
            if (diff > 10) {
                message.replyEphemeral(`*${result}* is a bit too far off :/`);
                message.addReaction('x');
                return;
            }
            submissions[message.user.id] = text;
            message.replyEphemeral(
                `*${result}* - just *${diff}* away from the target`
            );
            if (diff > 5) {
                message.addReaction('five');
                return;
            }
            if (diff > 0) {
                message.addReaction('seven');
                return;
            }
            message.addReaction('tada');
        };

        // listen to any messages starting with '(' or one of the numbers
        ['(', ...numbers.map(n => n.toString())].forEach(n =>
            Command.create(n, submit)
                .hide()
                .isPhrase()
        );

        setTimeout(() => {
            games[message.channel.id] = false;
            ['(', ...numbers.map(n => n.toString())].forEach(n =>
                registry.unregister(n)
            );
            const players = Object.keys(submissions)
                .map(id => ({
                    id,
                    diff: Math.abs(target - eval(submissions[id])),
                }))
                .sort((a, b) => (a.diff > b.diff ? 1 : 0));
            if (players.length === 0) {
                message.reply('Nobody even tried? :(');
                return;
            }
            const best = players.shift();
            const firstMessage =
                best!.diff === 0
                    ? ` ${mention(
                          best!.id
                      )} got a correct solution, and gains *+10* points!`
                    : ` ${mention(
                          best!.id
                      )} got the closest, and gains *${diffPoints(
                          best!.diff
                      )}* points!`;
            message.reply(
                `Time's up!${firstMessage}${
                    players.length > 0
                        ? `Followed by ${players
                              .map(
                                  player =>
                                      `${mention(player.id)} (*+${diffPoints(
                                          player.diff
                                      )}*)`
                              )
                              .join(', ')}`
                        : ''
                }`
            );
            [best!, ...players].forEach(async ({ id, diff }) => {
                (await User.find(id)).meta(
                    'countdown_numbers_score',
                    (total?: number) => (total ?? 0) + diffPoints(diff)
                );
            });
        }, GAME_DURATION * 60 * 1000);
    }
)
    .arg({ name: 'bigs', def: '2' })
    .arg({ name: 'smalls', def: '4' })
    .desc('Start a game of Countdown Numbers');
