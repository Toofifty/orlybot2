import { Command, registry } from 'core/commands';
import fetch from 'node-fetch';
import { randint, choose } from 'core/util';
import Message from 'core/model/message';
import User from 'core/model/user';

interface Trivia {
    question: string;
    wrong: string[];
    answer: string;
    answerId: number;
}

interface ApiQuestion {
    category: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

const currentTrivias: Record<string, Trivia> = {};

const correct = (channel: string) => (message: Message) => {
    if (message.channel.id !== channel) return;
    const wins = message.user.meta('trivia_wins', (w: number) => (w ?? 0) + 1);
    message.reply(
        choose([
            `Well hot dog! We have a weiner! You win ${message.user}! You're on ${wins} wins.`,
            `You got it ${message.user}! You've won ${wins} trivias.`,
            `Good stuff ${message.user}! That's ${wins} wins so far.`,
            `You're on fire ${message.user}! ${wins} total wins!`,
            `Slow down ${message.user} and let other people have a chance! You're on ${wins} wins.`,
        ])
    );
    teardown(message.channel.id);
};

const incorrect = (channel: string) => (message: Message) => {
    if (message.channel.id !== channel) return;
    message.user.meta('trivia_bad_guesses', (g: number) => (g ?? 0) + 1);
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
        ])
    );
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

const teardown = (channel: string) => {
    const trivia = currentTrivias[channel];

    trivia.wrong.forEach(kw => registry.unregister(kw));
    registry.unregister(trivia.answer);

    delete currentTrivias[channel];
};

Command.create('trivia', async (message, [diff = 'easy']) => {
    if (currentTrivias[message.channel.id]) {
        return currentTrivias[message.channel.id].question;
    }

    let question: string = '';
    let data: any;

    while (!question || question.includes('&')) {
        data = await fetch(
            `https://opentdb.com/api.php?amount=1&difficulty=${diff}`
        ).then(res => res.json());
        question = data.results[0].question;
    }

    const {
        category,
        correct_answer: correctAnswer,
        incorrect_answers: incorrectAnswers,
    }: ApiQuestion = data.results[0];

    message.reply(`${category}: *${question}*`);

    const trivia = {
        answerId: randint(4),
        answer: correctAnswer.toLowerCase(),
        wrong: incorrectAnswers.map(v => v.toLowerCase()),
        question,
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
            teardown(message.channel.id);
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
            .alias('lb', 'l')
            .desc('Check out the trivia leaderboard')
    );
