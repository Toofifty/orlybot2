import ScrabbleStore from './scrabble.store';
import { PlayerData, ScrabbleBoard } from './types';

type InitialisedScrabbleStore = ScrabbleStore & {
    board: ScrabbleBoard;
    tiles: string[];
    players: Record<string, PlayerData>;
    currentTurn: string;
};

export const isGameInitialised = (
    store: ScrabbleStore
): store is InitialisedScrabbleStore => !!store.board;
