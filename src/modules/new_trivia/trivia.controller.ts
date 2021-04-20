import {
    CommandController,
    keyword,
    main,
    alias,
    arg,
    sub,
    required,
    validate,
    delegate,
} from 'core/new';
import TriviaCategories from './categories.controller';
import v from './trivia.validators';

@keyword('trivia')
class Trivia extends CommandController {
    async before() {
        await this.message.addReaction('eyes');
    }

    async after() {
        this.message.removeReaction('eyes');
    }

    @main('Start a game of trivia!')
    @alias('t')
    async main(
        @arg('difficulty')
        @validate(v.ValidDifficulty)
        @required
        difficulty = 'easy'
    ) {
        this.message.reply('I guess it works??');
    }

    @sub('Cancel broken trivia')
    cancel() {}

    @sub("Get a user's trivia score")
    score() {}

    @sub('Check out the trivia leaderboard')
    leaderboard() {}

    @delegate(TriviaCategories)
    categories() {}
}

new Trivia()._register();
