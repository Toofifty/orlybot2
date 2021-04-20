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
    def,
} from 'core/new';
import TriviaCategories from './categories.controller';
import v from './trivia.validators';
import TriviaStore, { ITriviaStore } from './trivia.store';

@keyword('trivia')
class Trivia extends CommandController<ITriviaStore> {
    async before() {
        await this.message.addReaction('eyes');
        this.setStore(TriviaStore.make(this));
    }

    async after() {
        this.message.removeReaction('eyes');
    }

    @main('Start a game of trivia!')
    @alias('t')
    async main(
        @arg('difficulty')
        @def('easy')
        @validate(v.ValidDifficulty)
        difficulty = 'easy'
    ) {
        this.store.this.message.reply('I guess it works??');
    }

    @sub('Cancel broken trivia')
    cancel() {}

    @sub("Get a user's trivia score")
    score(
        @arg('user')
        @def('@me')
        @validate(v.UserExists)
        user = this.message.user.id
    ) {}

    @sub('Check out the trivia leaderboard')
    leaderboard() {}

    @delegate(TriviaCategories)
    categories() {}
}

new Trivia()._register();
