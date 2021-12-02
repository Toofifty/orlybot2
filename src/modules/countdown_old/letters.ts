import { Command, registry } from 'core/commands';
import { choose, shuffle } from 'core/util';
import Message from 'core/model/message';
import { numberEmoji, mention } from 'core/util/strings';
import User from 'core/model/user';
import { fetchWord, fetchBest } from './api';
import { chooseWeighted } from 'core/util/random';

const VOWELS_WEIGHTED = {
    a: 8.12,
    e: 12.02,
    i: 7.31,
    o: 7.68,
    u: 2.88,
};

const CONSONANTS_WEIGHTED = {
    b: 1.49,
    c: 2.71,
    d: 4.32,
    f: 2.3,
    g: 2.03,
    h: 5.92,
    j: 0.1,
    k: 0.69,
    l: 3.98,
    m: 2.61,
    n: 6.95,
    p: 1.82,
    q: 0.11,
    r: 6.02,
    s: 6.28,
    t: 9.1,
    v: 1.11,
    w: 2.09,
    x: 0.17,
    y: 2.11,
    z: 0.07,
};

// game duration (minutes)
const GAME_DURATION = 1;

const games: Record<string, boolean> = {};

const matchesLetters = (word: string, [...letters]: string[]) => {
    for (let i = 0; i < word.length; i++) {
        const l = word[i];
        if (letters.includes(l)) {
            const index = letters.indexOf(l);
            letters.splice(index, 1);
        } else {
            return false;
        }
    }
    return true;
};

export const letters = Command.sub(
    'letters',
    async (message, [vowels, consonants]) => {
        const nVowels = Number(vowels || 4);
        const nConsonants = Number(consonants || 9 - nVowels);

        if (nVowels + nConsonants !== 9) {
            throw 'Invalid number of letters';
        }

        if (nVowels < 3) throw 'Must have at least 3 vowels';
        if (nConsonants < 4) throw 'Must have at least 4 consonants';

        if (games[message.channel.id]) {
            throw "There's already a game of Countdown Letters running";
        }

        games[message.channel.id] = true;

        const letters = Array(nVowels)
            .fill('')
            .map(() => chooseWeighted(VOWELS_WEIGHTED))
            .concat(
                Array(nConsonants)
                    .fill('')
                    .map(() => chooseWeighted(CONSONANTS_WEIGHTED))
            );

        message.reply(
            `*Countdown Letters* is starting! You have ${GAME_DURATION} minute to find the longest word.\n` +
                `The letters are: *${shuffle(letters)
                    .join(' ')
                    .toUpperCase()}*`
        );

        const submissions: Record<string, string> = {};

        const submit = async (message: Message) => {
            const text = message.text.toLowerCase().replace(/\W/g, '');
            if (!matchesLetters(text, letters)) return;
            if (Object.values(submissions).some(word => text === word)) {
                message.replyEphemeral('Someone already submitted that word');
                message.addReaction('x');
                return;
            }
            if (!(await fetchWord(text))) {
                message.replyEphemeral("I don't think that's a real word");
                message.addReaction('x');
                return;
            }
            message.addReaction(numberEmoji(text.length));
            submissions[message.user.id] = text;
        };

        // create temp command
        letters.forEach(letter =>
            Command.create(letter, submit)
                .hide()
                .isPhrase()
        );

        setTimeout(async () => {
            games[message.channel.id] = false;
            letters.forEach(letter => registry.unregister(letter));
            const players = Object.keys(submissions)
                .map(id => ({
                    id,
                    score:
                        submissions[id].length === 9
                            ? 18
                            : submissions[id].length,
                }))
                .sort((a, b) => (a.score < b.score ? 1 : 0));
            if (players.length === 0) {
                message.reply('Nobody even tried? :(');
                return;
            }
            const best = players.shift();
            message.reply(
                `Time's up! ${mention(best!.id)} got the highest with *+${
                    best!.score
                }* points!${
                    players.length > 0
                        ? `Followed by ${players
                              .map(
                                  player =>
                                      `${mention(player.id)} (*+${
                                          player.score
                                      }*)`
                              )
                              .join(', ')}`
                        : ''
                }`
            );
            [best!, ...players].forEach(async ({ id, score }) => {
                (await User.find(id)).meta(
                    'countdown_letters_score',
                    (total?: number) => (total ?? 0) + score
                );
            });
            const bestWord = await fetchBest(letters.join('').toLowerCase());
            if (bestWord) {
                message.reply(`The best I could come up with is *${bestWord}*`);
            }
        }, GAME_DURATION * 60 * 1000);
    }
)
    .alias('l')
    .arg({ name: 'vowels', def: '4' })
    .arg({ name: 'consonants', def: '5' })
    .desc('Start a game of Countdown Letters');
