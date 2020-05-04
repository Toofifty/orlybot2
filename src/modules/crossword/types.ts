import { SavedBotMessage } from 'core/model/bot-message';

export interface CrosswordStore {
    crossword?: CrosswordData;
    complete?: {
        across: number[];
        down: number[];
    };
    grid: string[];
    contributors?: Record<string, number>;
    gameMessage?: SavedBotMessage;
}

export interface CrosswordData {
    answers: {
        across: string[];
        down: string[];
    };
    author: string;
    clues: {
        across: string[];
        down: string[];
    };
    copyright: string;
    date: string;
    dow: string;
    editor: string;
    // filled grid
    grid: string[];
    // ??
    gridnums: number[];
    publisher: string;
    size: {
        cols: number;
        rows: number;
    };
    title: string;
}
