import { injectable } from 'core';
import { Validator } from 'core/oop/types';
import TriviaStore from './trivia.store';

export default class TriviaValidator {
    @injectable()
    validDifficulty(): Validator {
        return async difficulty =>
            !difficulty ||
            ['hard', 'medium', 'easy'].includes(difficulty) ||
            'Invalid difficulty';
    }

    @injectable()
    gameRunning(store: TriviaStore) {
        return !!store.game;
    }
}
