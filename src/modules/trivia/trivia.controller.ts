import {
    Controller,
    group,
    maincmd,
    cmd,
    validate,
    before,
    Message,
    Channel,
    after,
    aliases,
    User,
    delegate,
} from 'core';
import TriviaStore from './trivia.store';
import TriviaValidator from './trivia.validator';
import TriviaService from './trivia.service';
import TriviaCategoriesController from './categories.controller';

@group('trivia')
@delegate(TriviaCategoriesController)
export default class TriviaController extends Controller {
    @before
    before(message: Message) {
        message.addReaction('books');
    }

    @after
    after(message: Message) {
        message.removeReaction('books');
    }

    @maincmd('Start a game of trivia!')
    @aliases('t')
    async start(
        message: Message,
        channel: Channel,
        store: TriviaStore,
        service: TriviaService,
        @validate(TriviaValidator, 'validDifficulty')
        difficulty = 'easy'
    ) {
        if (store.game) {
            service.destroyAnswerListeners(store);
            service.createAnswerListeners(channel, store);
            return service.printTrivia(message, store);
        }

        message.replyEphemeral('Fetching new trivia question, hold on...');

        const { enabledCategories } = store;
        const categories = await service.fetchCategories();

        const triviaData = await service.fetchTrivia(
            difficulty,
            categories
                .filter(cat => enabledCategories.includes(cat.id))
                .map(({ name }) => name)
        );

        store.game = { ...triviaData, difficulty };
        await store.save();

        service.printTrivia(message, store);
        service.createAnswerListeners(channel, store);
    }

    @cmd('cancel', 'Cancel broken trivia')
    @validate(TriviaValidator, 'gameRunning')
    async cancel(message: Message, store: TriviaStore, service: TriviaService) {
        service.endTrivia(store);
        message.reply('Trivia cancelled :(');
    }

    @cmd('score', "Get a user's trivia score")
    async score(message: Message, user = 'you') {
        const target = user !== 'you' ? await User.find(user) : message.user;

        const wins = target.meta('trivia_wins');
        const guesses = target.meta('trivia_bad_guesses');
        message.reply(
            `${target} has ${wins} wins and ${guesses} total incorrect guesses`
        );
    }

    @cmd('leaderboard', 'Check out the trivia leaderboard')
    @aliases('lb', 'l', 'scoreboard', 'sb', 's')
    async leaderboard(message: Message, service: TriviaService) {
        const userScores = (await service.getTriviaScores()).map(
            ({ user, score, ratio }, i) =>
                `${i + 1}. ${user} - ${score} points (${ratio}%)`
        );

        message.reply(`*Trivia Leaderboard*\n${userScores.join('\n')}`);
    }
}