import { Channel, injectable, Store } from 'core';

export enum LetterResult {
    Correct = 'large_green_square',
    WrongPosition = 'large_yellow_square',
    WrongLetter = 'white_square',
    Empty = 'black_square',
}

type Guess = {
    guess: string;
    result: LetterResult[];
};

export interface IWordleStore {
    game: {
        solution: string;
        guesses: Guess[];
    } | null;
}

interface WordleStore extends IWordleStore {}

@injectable()
class WordleStore extends Store<IWordleStore> {
    initial = { game: null };

    constructor(channel: Channel) {
        super(`wordle:${channel.id}`);
    }
}

export default WordleStore;
