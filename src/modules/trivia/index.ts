import { Command, registry } from 'core/commands';
import fetch from 'node-fetch';
import { randint, choose } from 'core/util';
import Message from 'core/model/message';
import User from 'core/model/user';
import db from 'core/db';
import Channel from 'core/model/channel';
import { fetchQuestion } from './fetch';
import CommandRunner from 'core/commands/runner';

interface Trivia {
    question: string;
    wrong: string[];
    answer: string;
    answerId: number;
    difficulty: string;
}

interface Category {
    id: number;
    name: string;
}

interface TriviaStore {
    enabledCategories: number[];
    noReply: boolean;
    autostart: boolean;
}

let categories: Category[] = [];

const currentTrivias: Record<string, Trivia> = {};

const correct = (channel: string) => async (message: Message) => {
    if (message.channel.id !== channel) return;
    const wins = message.user.meta('trivia_wins', (w: number) => (w ?? 0) + 1);
    const { noReply } = await load(message.channel);
    if (!noReply) {
        message.reply(
            choose([
                `Well hot dog! We have a weiner! You win ${message.user}! You're on ${wins} wins.`,
                `You got it ${message.user}! You've won ${wins} trivias.`,
                `Good stuff ${message.user}! That's ${wins} wins so far.`,
                `You're on fire ${message.user}! ${wins} total wins!`,
                `Slow down ${message.user} and let other people have a chance! You're on ${wins} wins.`,
                `Amazing! ${message.user} got it! You're on ${wins} wins.`,
                `lol grats ${message.user} ur now on ${wins} dubs`,
                `Ding ding ding ding! ${message.user} is on ${wins} wins.`,
                `👌😎 good 😠🤣😂 stuff 😍🎁 ${message.user} 👏👏 win 💸🤑 #${wins} 💵💰`,
            ])
        );
    }
    message.addReaction('white_check_mark');
    teardown(message);
};

const incorrect = (channel: string) => async (message: Message) => {
    if (message.channel.id !== channel) return;
    message.user.meta('trivia_bad_guesses', (g: number) => (g ?? 0) + 1);
    const { noReply } = await load(message.channel);
    if (!noReply) {
        message.reply(
            choose([
                `I don't think that's right ${message.user} :/`,
                `Not even close ${message.user}!`,
                `Wayyy off ${message.user}`,
                `${message.user} - nope.`,
                `${message.user} - nada.`,
                `${message.user} - no bueno.`,
                `HA! Yeah right, ${message.user}`,
                `Well done ${message.user}! You got it completely wrong!`,
                `Serious ${message.user}? That's your answer?`,
                `Try again ${message.user}.`,
                `Better luck next time ${message.user}!`,
                `Pfft. Try a bit harder ${message.user}.`,
                `${message.user}...\nno.`,
                `lol no ${message.user} u noob`,
            ])
        );
    }
    message.addReaction('x');
};

const setup = (channel: string, trivia: Trivia) => {
    currentTrivias[channel] = trivia;

    trivia.wrong.forEach(kw =>
        Command.create(kw, incorrect(channel))
            .desc('Trivia response')
            .isPhrase()
            .hide()
    );
    Command.create(trivia.answer, correct(channel))
        .desc('Trivia response')
        .isPhrase()
        .hide();
};

const teardown = async (message: Message) => {
    const trivia = currentTrivias[message.channel.id];

    trivia.wrong.forEach(kw => registry.unregister(kw));
    registry.unregister(trivia.answer);

    delete currentTrivias[message.channel.id];

    const { autostart } = await load(message.channel);
    if (autostart) {
        CommandRunner.run(`trivia ${trivia.difficulty}`, message);
    }
};

const allCategories = async () => {
    if (categories.length === 0) {
        const data = await fetch(
            `https://opentdb.com/api_category.php`
        ).then(res => res.json());

        categories = data.trivia_categories;
    }

    return categories;
};

export const load = async (channel: Channel): Promise<TriviaStore> => {
    const data = await db.get<TriviaStore>(`trivia:${channel.id}`);
    if (!data) {
        update(channel, store => ({
            enabledCategories: [],
            noReply: false,
            autostart: false,
            ...store,
        }));
        return load(channel);
    }
    return data;
};

export const update = (
    channel: Channel,
    callback: (data: TriviaStore) => Partial<TriviaStore>
) => db.update(`trivia:${channel.id}`, callback);

Command.create('trivia', async (message, [difficulty = 'easy']) => {
    if (!['hard', 'medium', 'easy'].includes(difficulty)) {
        throw 'Invalid difficulty';
    }

    if (currentTrivias[message.channel.id]) {
        return currentTrivias[message.channel.id].question;
    }

    message.replyEphemeral('Fetching new trivia question, hold on...');

    currentTrivias[message.channel.id] = {
        question: 'loading...',
        wrong: [],
        answer: 'loading...',
        answerId: -1,
        difficulty,
    };

    const { enabledCategories } = await load(message.channel);
    const categories = await allCategories();

    const {
        question,
        category,
        correctAnswer,
        incorrectAnswers,
    } = await fetchQuestion({
        categories: categories
            .filter(cat => enabledCategories.includes(cat.id))
            .map(({ name }) => name),
        difficulty,
    });

    message.reply(`${category} (${difficulty}): *${question}*`);

    const trivia = {
        answerId: randint(4),
        answer: correctAnswer.toLowerCase(),
        wrong: incorrectAnswers.map(v => v.toLowerCase()),
        question,
        difficulty,
    };

    const options = incorrectAnswers;
    options.splice(trivia.answerId, 0, correctAnswer);

    setTimeout(
        () =>
            message.reply(options.map((a, i) => `${i + 1}. *${a}*`).join('\n')),
        5000
    );

    setup(message.channel.id, trivia);
})
    .alias('t')
    .desc('Start a game of trivia!')
    .arg({ name: 'difficulty', def: 'easy' })
    .nest(
        Command.sub('cancel', async message => {
            await update(message.channel, store => ({
                ...store,
                autostart: false,
            }));
            await teardown(message);
            message.reply('Cancelled trivia');
        }).desc('Cancel broken trivia')
    )
    .nest(
        Command.sub('score', async (message, [user]) => {
            const target = user ? await User.find(user) : message.user;

            const wins = target.meta('trivia_wins');
            const guesses = target.meta('trivia_bad_guesses');
            return `${target} has ${wins} wins and ${guesses} total incorrect guesses`;
        })
            .desc("Get a user's trivia score")
            .arg({ name: 'user', def: 'you' })
    )
    .nest(
        Command.sub('leaderboard', async () => {
            const users = await User.all();

            const active = users
                .filter(user => user.meta<number>('trivia_wins') > 0)
                .map(user => ({
                    user,
                    score:
                        user.meta<number>('trivia_wins') -
                        (user.meta<number>('trivia_bad_guesses') ?? 0),
                    ratio: (
                        (user.meta<number>('trivia_wins') /
                            ((user.meta<number>('trivia_bad_guesses') ?? 0) +
                                user.meta<number>('trivia_wins') || 1)) *
                        100
                    ).toFixed(0),
                }))
                .sort((a, b) => (a.score < b.score ? 1 : 0));

            return `*Trivia Leaderboard*\n${active
                .map(
                    ({ user, score, ratio }, i) =>
                        `${i + 1}. ${user} - ${score} points (${ratio}%)`
                )
                .join('\n')}`;
        })
            .alias('lb', 'l', 'scoreboard', 'sb', 's')
            .desc('Check out the trivia leaderboard')
    )
    .nest(
        Command.sub('list-categories', async message => {
            const { enabledCategories } = await load(message.channel);
            return `Available trivia categories:\n${(await allCategories())
                .map(({ name }) => name)
                .join(', ')}${
                enabledCategories.length > 0
                    ? `\nEnabled:\n${(await allCategories())
                          .filter(cat => enabledCategories.includes(cat.id))
                          .map(({ name }) => `*${name}*`)
                          .join(', ')}`
                    : ''
            }`;
        })
            .alias('lc')
            .desc('List available trivia categories')
    )
    .nest(
        Command.sub('disable-category', async (message, [name]) => {
            const { enabledCategories } = await load(message.channel);
            const target = (await allCategories()).find(cat =>
                cat.name.toLowerCase().includes(name.toLowerCase())
            );

            if (!target) {
                throw 'Unknown category';
            }

            if (!enabledCategories.includes(target.id)) {
                throw 'Category is not enabled';
            }

            update(message.channel, store => ({
                enabledCategories: store.enabledCategories.filter(
                    cat => target.id !== cat
                ),
            }));

            return `Disabled category *${target.name}*`;
        })
            .alias('dc')
            .arg({ name: 'category', required: true })
            .desc('Disable a trivia category for the channel')
    )
    .nest(
        Command.sub('enable-category', async (message, [name]) => {
            const { enabledCategories } = await load(message.channel);
            const target = (await allCategories()).find(cat =>
                cat.name.toLowerCase().includes(name.toLowerCase())
            );

            if (!target) {
                throw 'Unknown category';
            }

            if (enabledCategories.includes(target.id)) {
                throw 'Category is already enabled';
            }

            update(message.channel, store => ({
                enabledCategories: [...store.enabledCategories, target.id],
            }));

            return `Enabled category *${target.name}*`;
        })
            .alias('ec')
            .arg({ name: 'category', required: true })
            .desc('Enable a trivia category for the channel')
    )
    .nest(
        Command.sub('disable-replies', async message => {
            update(message.channel, () => ({ noReply: true }));

            message.replyEphemeral('Disabled trivia replies');
        }).desc('Disable trivia replies')
    )
    .nest(
        Command.sub('enable-replies', async message => {
            update(message.channel, () => ({ noReply: false }));

            message.replyEphemeral('Enabled trivia replies');
        }).desc('Enable trivia replies')
    )
    .nest(
        Command.sub('enable-autostart', async message => {
            update(message.channel, () => ({ autostart: true }));
            message.replyEphemeral('Enabled autostart');
        }).desc(
            'Auto-start a new trivia question after the previous is answers'
        )
    )
    .nest(
        Command.sub('disable-autostart', async message => {
            update(message.channel, () => ({ autostart: false }));
            message.replyEphemeral('Disabled autostart');
        }).desc('Disable trivia autostart')
    );
