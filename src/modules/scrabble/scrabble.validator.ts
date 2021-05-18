import { injectable, User } from 'core';
import { CommandValidator } from 'core/oop/types';
import ScrabbleStore from './scrabble.store';
import { isGameInitialised } from './typeguards';

export default class ScrabbleValidator {
    @injectable()
    gameIsJoinable(store: ScrabbleStore): CommandValidator {
        return async () =>
            !isGameInitialised(store) ||
            !store.currentTurn ||
            'A game of Scrabble is already running.';
    }

    @injectable()
    gameIsInProgress(store: ScrabbleStore): CommandValidator {
        return async () =>
            isGameInitialised(store) ||
            "There's no Scrabble game at the moment.";
    }

    @injectable()
    userIsNotInGame(user: User, store: ScrabbleStore): CommandValidator {
        return async () =>
            !(user.id in (store.players ?? {})) ||
            "You've already joined the game of Scrabble.";
    }

    @injectable()
    userIsInGame(user: User, store: ScrabbleStore): CommandValidator {
        return async () =>
            (isGameInitialised(store) && user.id in store.players) ||
            "You're not in this game of Scrabble.";
    }
}
