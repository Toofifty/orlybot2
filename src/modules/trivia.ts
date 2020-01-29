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
    message.user.meta.triviaWins = (message.user.meta.triviaWins ?? 0) + 1;
    message.user.save();
    message.reply(
        `You got it ${message.user}! You've won ${message.user.meta.triviaWins} trivias.`
    );
    teardown(message.channel.id);
};

const incorrect = (channel: string) => (message: Message) => {
    if (message.channel.id !== channel) return;
    message.user.meta.triviaBadGuesses =
        (message.user.meta.triviaBadGuesses ?? 0) + 1;
    message.user.save();
    message.reply(
        choose([
            `I don't think that's right ${message.user} :/`,
            `Not even close ${message.user}!`,
            `${message.user} - nope.`,
            `${message.user} - nada.`,
            `${message.user} - no bueno.`,
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

    currentTrivias[channel] = undefined;
};

Command.create('trivia', async (message, [diff = 'easy']) => {
    if (currentTrivias[message.channel.id]) {
        return currentTrivias[message.channel.id].question;
    }

    const data = await fetch(
        `https://opentdb.com/api.php?amount=1&difficulty=${diff}`
    ).then(res => res.json());

    const {
        category,
        question,
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
        Command.sub('score', async (message, [user]) => {
            const target = user ? await User.find(user) : message.user;

            const { triviaWins, triviaBadGuesses } = target.meta;
            return `${target} has ${triviaWins} wins and ${triviaBadGuesses} total incorrect guesses`;
        })
            .desc("Get a user's trivia score")
            .arg({ name: 'user', def: 'you' })
    );
