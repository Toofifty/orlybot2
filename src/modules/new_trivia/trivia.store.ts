import { CommandController, DbStore } from 'core/new';

export interface ITriviaStore {
    noreply: boolean;
    autostart: boolean;
    categories: string[];
}

export default class TriviaStore extends DbStore<ITriviaStore> {
    protected initial = {
        noreply: true,
        autostart: false,
        categories: [],
    };

    public static make(controller: CommandController) {
        return new this(`trivia:${controller.channel.id}`) as any;
    }
}
