import { Validator } from 'core/oop/types';
import TriviaStore from './trivia.store';

export default class TriviaValidator {
    static validDifficulty(store: TriviaStore): Validator {
        return async difficulty => {
            console.log(difficulty);
            return (
                ['hard', 'medium', 'easy'].includes(difficulty) ||
                'Invalid difficulty'
            );
        };
    }
}
