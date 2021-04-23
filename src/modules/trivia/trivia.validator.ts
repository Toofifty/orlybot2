import { Validator } from 'core/oop/types';
import TriviaStore from './trivia.store';

export default class TriviaValidator {
    static validDifficulty(store: TriviaStore): Validator {
        return async difficulty =>
            ['hard', 'medium', 'easy'].includes(difficulty) ||
            'Invalid difficulty';
    }
}
