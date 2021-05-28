import { Store, Channel, injectable } from 'core';
import { DEFAULT_PARAMETERS } from './consts';

export type SavedPrompt = {
    name: string;
    promptText: string;
    parameters: typeof DEFAULT_PARAMETERS;
};

export interface IGpt3Store {
    discussion: string[];
    savedPrompts: SavedPrompt[];
}

interface Gpt3Store extends IGpt3Store {}

@injectable()
class Gpt3Store extends Store<IGpt3Store> {
    initial = {
        discussion: [
            "Human: G'day mate, how's it goin'?",
            'AI: Not too bad mate.',
        ],
        savedPrompts: [],
    };

    constructor(channel: Channel) {
        super(`gpt3:${channel.id}`);
    }
}

export default Gpt3Store;
