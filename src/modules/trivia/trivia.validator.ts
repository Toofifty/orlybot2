import { injectable } from 'core';
import { Validator } from 'core/oop/types';

export default class TriviaValidator {
    @injectable()
    validDifficulty(): Validator {
        return async difficulty =>
            !difficulty ||
            ['hard', 'medium', 'easy'].includes(difficulty) ||
            'Invalid difficulty';
    }
}
