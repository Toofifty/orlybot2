import { Store, Channel, injectable, SavedBotMessage } from 'core';
import { PlayerData, ScrabbleBoard } from './types';

export interface IScrabbleStore {
    board: ScrabbleBoard | null;

    /**
     * Tiles left in the bag
     */
    tiles: string[] | null;
    players: Record<string, PlayerData> | null;

    /**
     * ID of the player who has the current turn
     */
    currentTurn: string | null;

    /**
     * Active message to edit on change
     */
    gameMessage: SavedBotMessage | null;
    isFirstTurn: boolean | null;

    /**
     * Start time of game
     */
    begin: number | null;
}

interface ScrabbleStore extends IScrabbleStore {}

@injectable()
class ScrabbleStore extends Store<IScrabbleStore> {
    initial = {
        board: null,
        tiles: null,
        players: null,
        currentTurn: null,
        gameMessage: null,
        isFirstTurn: null,
        begin: null,
    };

    constructor(channel: Channel) {
        super(`scrabble:${channel.id}`);
    }
}

export default ScrabbleStore;
