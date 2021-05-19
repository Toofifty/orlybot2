import { injectable, User } from 'core';
import { ArgumentValidator, CommandValidator } from 'core/oop/types';
import { assert } from 'core/util';
import ScrabbleStore from '../scrabble.store';
import { isGameInitialised } from '../typeguards';
import { placementChecks } from './placement-checks';
import ScrabblePlacementService from './placement.service';

export default class ScrabblePlacementValidator {
    @injectable()
    userHasCurrentTurn(user: User, store: ScrabbleStore): CommandValidator {
        return () => user.id === store.currentTurn || "It's not your turn!";
    }

    @injectable()
    validXYD(service: ScrabblePlacementService): ArgumentValidator {
        return xyd =>
            service.parsePosition(xyd) !== undefined ||
            "I couldn't figure out what position you meant. Try something like `g7d` (column H, row 8, down)";
    }

    @injectable()
    validLetters(
        user: User,
        service: ScrabblePlacementService
    ): ArgumentValidator {
        return letters =>
            service.userHasTiles(user, letters) ||
            "You don't have those tiles to place.";
    }

    @injectable()
    tilePlacementIsValid(
        store: ScrabbleStore,
        service: ScrabblePlacementService
    ): CommandValidator {
        return async ({ args }) => {
            assert(isGameInitialised(store));

            const position = service.parsePosition(args[0])!;
            const letters = args[1];

            const { mainWord, secondaryWords } = service.getPotentialWords(
                letters,
                position
            );
            const checkArgs = {
                board: store.board,
                letters,
                position,
                mainWord,
                secondaryWords,
                service,
            };

            for (let { fn, error } of placementChecks) {
                const result = await fn(checkArgs);
                if (result !== true) {
                    return typeof error === 'string'
                        ? error
                        : error(
                              checkArgs,
                              result === false ? undefined : result
                          );
                }
            }

            return true;
        };
    }
}
