import { injectable, UserError } from 'core';
import Gpt3Service from './gpt3.service';
import Gpt3Store from './gpt3.store';

@injectable()
export default class Gpt3PromptService {
    constructor(private store: Gpt3Store, private gpt3Service: Gpt3Service) {}

    async getAll() {
        return this.store.savedPrompts;
    }

    async get(name: string) {
        const prompt = this.store.savedPrompts.find(
            prompt => prompt.name === name
        );
        if (!prompt) {
            throw new UserError("I couldn't find a prompt with that name");
        }
        return prompt;
    }

    async save(name: string, promptText: string) {
        this.store.savedPrompts.push({
            name,
            parameters: this.gpt3Service.getParameters(),
            promptText,
        });
        this.store.save();
    }

    async delete(name: string) {
        this.store.savedPrompts = this.store.savedPrompts.filter(
            prompt => prompt.name !== name
        );
        this.store.save();
    }

    async prepare(name: string, inputs: string[]) {
        const prompt = await this.get(name);

        let preparedText = prompt.promptText;

        if (preparedText.includes('$@')) {
            preparedText = preparedText.replace('$@', inputs.join(' '));
        } else {
            inputs.forEach((input, index) => {
                if (preparedText.includes(`$${index}`)) {
                    preparedText = preparedText.replace(
                        new RegExp(`\\$${index}`, 'g'),
                        input
                    );
                } else {
                    preparedText = `${preparedText} ${input}`;
                }
            });
        }

        return {
            prompt: preparedText,
            parameters: prompt.parameters,
        };
    }
}
