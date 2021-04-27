import { injectable } from 'core';
import { Validator } from 'core/oop/types';
import TriviaStore from './trivia.store';
import TriviaService from './trivia.service';

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

    @injectable()
    validCategory(service: TriviaService): Validator {
        return async category =>
            !!(await service.fetchCategory(category)) || 'Unknown category';
    }

    @injectable()
    categoryIsEnabled(service: TriviaService, store: TriviaStore): Validator {
        return async category =>
            store.enabledCategories.includes(
                (await service.fetchCategory(category))?.id ?? -1
            ) || `Category *${category}* is not enabled`;
    }

    @injectable()
    categoryIsDisabled(service: TriviaService, store: TriviaStore): Validator {
        return async category =>
            !store.enabledCategories.includes(
                (await service.fetchCategory(category))?.id ?? -1
            ) || `Category *${category}* is already enabled`;
    }
}
