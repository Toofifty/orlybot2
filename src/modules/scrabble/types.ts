import { SavedBotMessage } from 'core';

export interface Position {
    /**
     * X coordinate, between A and O
     */
    x: string;
    /**
     * Y coordinate, between 1 and 15
     */
    y: number;
}

export interface PremiumSquare {
    position: Position;
    type: 'letter' | 'word';
    multiplier: 2 | 3;
}

export interface ScrabbleBoard {
    /**
     * State of the board's squares
     */
    tiles: (string | null)[][];
    /**
     * Unclaimed premium squares left on the board
     */
    premiumSquares: PremiumSquare[];
}

export interface WordScore {
    word: string;
    score: number;
}

export interface TurnRecord {
    mainWord: string;
    /**
     * All word scores (including main word) created when placing
     * the main word
     */
    words: WordScore[];
}

export interface PlayerData {
    id: string;
    rack: string[];
    score: number;
    /**
     * History of words added on a turn
     */
    records: TurnRecord[];
    message?: SavedBotMessage;
}
