import { Store, Channel, injectable } from 'core';

type LettersGame = {
    type: 'letters';
    letters: string[];
    submitted: Record<string, string>;
};

type NumbersGame = {
    type: 'numbers';
    numbers: number[];
};

export interface ICountdownStore {
    autostart: boolean;
    game: LettersGame | NumbersGame | null;
}

interface CountdownStore extends ICountdownStore {}

@injectable()
class CountdownStore extends Store<ICountdownStore> {
    initial = {
        autostart: false,
        game: null,
    };

    constructor(channel: Channel) {
        super(`countdown:${channel.id}`);
    }
}

export default CountdownStore;
