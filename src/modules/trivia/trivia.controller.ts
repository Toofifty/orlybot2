import {
    Controller,
    group,
    maincmd,
    cmd,
    validate,
    before,
    Message,
} from 'core';
import TriviaValidator from './trivia.validator';

@group('trivia')
export default class TriviaController extends Controller {
    @before
    before() {}

    @maincmd('Start a game of trivia!')
    async start(
        message: Message,
        @validate(TriviaValidator, 'validDifficulty')
        difficulty = 'easy'
    ) {
        message.reply('Ran command');
    }

    @cmd('cancel', 'Cancel broken trivia')
    async cancel() {}

    @cmd('score', "Get a user's trivia score")
    async score() {}

    @cmd('leaderboard', 'Check out the trivia leaderboard')
    async leaderboard() {}
}
