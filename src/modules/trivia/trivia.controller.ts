import { Controller } from 'core/oop';
import { group, maincmd, cmd, validate, arg } from 'core/oop/decorators';
import { Message } from 'core/model';
import TriviaValidator from './trivia.validator';

@group('trivia')
export default class TriviaController extends Controller {
    @maincmd('Start a game of trivia!')
    async start(
        message: Message,
        @arg
        @validate(TriviaValidator.validDifficulty)
        difficulty?: string
    ) {}

    @cmd('cancel', 'Cancel broken trivia')
    async cancel() {}

    @cmd('score', "Get a user's trivia score")
    async score() {}

    @cmd('leaderboard', 'Check out the trivia leaderboard')
    async leaderboard() {}
}
