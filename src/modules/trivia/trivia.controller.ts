import {
    Controller,
    group,
    maincmd,
    cmd,
    validate,
    before,
    Message,
    Channel,
} from 'core';
import TriviaStore from './trivia.store';
import TriviaValidator from './trivia.validator';
import { assert } from 'core/util';
import TriviaService from './trivia.service';

@group('trivia')
export default class TriviaController extends Controller {
    @before
    before() {}

    @maincmd('Start a game of trivia!')
    async start(
        message: Message,
        channel: Channel,
        store: TriviaStore,
        service: TriviaService,
        @validate(TriviaValidator, 'validDifficulty')
        difficulty = 'easy'
    ) {
        if (store.game) {
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
        store.save();

        service.printTrivia(message, store);
        service.createAnswerListeners(channel, store);
    }

    @cmd('cancel', 'Cancel broken trivia')
    async cancel() {}

    @cmd('score', "Get a user's trivia score")
    async score() {}

    @cmd('leaderboard', 'Check out the trivia leaderboard')
    async leaderboard() {}
}
