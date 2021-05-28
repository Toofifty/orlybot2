import { injectable } from 'core';
import { ArgumentValidator } from 'core/oop/types';
import TriviaStore from './trivia.store';
import TriviaService from './trivia.service';

export default class TriviaValidator {
    @injectable()
    validDifficulty(): ArgumentValidator {
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
    validCategory(service: TriviaService): ArgumentValidator {
        return async category =>
            !!(await service.fetchCategory(category)) || 'Unknown category';
    }

    @injectable()
    categoryIsEnabled(
        service: TriviaService,
        store: TriviaStore
    ): ArgumentValidator {
        return async category =>
            store.enabledCategories.includes(
                (await service.fetchCategory(category))?.id ?? -1
            ) || `Category *${category}* is not enabled`;
    }

    @injectable()
    categoryIsDisabled(
        service: TriviaService,
        store: TriviaStore
    ): ArgumentValidator {
        return async category =>
            !store.enabledCategories.includes(
                (await service.fetchCategory(category))?.id ?? -1
            ) || `Category *${category}* is already enabled`;
    }
}
