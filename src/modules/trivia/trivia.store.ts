import { Store, Channel, injectable } from 'core';

interface ITriviaStore {
    enabledCategories: number[];
    noReply: boolean;
    autostart: boolean;

    game: {
        question: string;
        options: string[];
        answer: string;
        difficulty: string;
    } | null;
}

interface TriviaStore extends ITriviaStore {}

@injectable()
class TriviaStore extends Store<ITriviaStore> {
    initial = {
        enabledCategories: [],
        noReply: true,
        autostart: false,
        game: null,
    };

    constructor(channel: Channel) {
        super(`trivia:${channel.id}`);
    }
}

export default TriviaStore;
