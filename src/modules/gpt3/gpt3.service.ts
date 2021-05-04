import fetch from 'node-fetch';
import { injectable, Kwargs } from 'core';
import { tokenize } from 'core/util';
import Gpt3Store from './gpt3.store';
import {
    DEFAULT_PARAMETERS,
    OPENAI_COMPLETIONS,
    PROMPT_LENGTH,
} from './consts';

type CompletionResponse = {
    choices: { text: string }[];
};

@injectable()
export default class Gpt3Service {
    constructor(private kwargs: Kwargs, private store: Gpt3Store) {
        console.log('resolved', kwargs, store);
    }

    async fetchCompletion(prompt: string) {
        const res: CompletionResponse = await fetch(OPENAI_COMPLETIONS, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                ...this.getParameters(),
                prompt,
            }),
        }).then(res => res.json());

        console.log(res);

        return res.choices[0].text;
    }

    async fetchReply(message: string) {
        const prompt =
            this.store.discussion
                .slice(this.store.discussion.length - PROMPT_LENGTH)
                .join('\n') + `\n${message}\nAI:`;
        const completion = await this.fetchCompletion(prompt);

        this.store.discussion.push(`Human: ${message}`, `AI:${completion}`);
        this.store.save();

        return completion;
    }

    getParameters() {
        return {
            ...DEFAULT_PARAMETERS,
            temperature:
                +this.kwargs.get('temperature') ||
                DEFAULT_PARAMETERS.temperature,
            max_tokens:
                +this.kwargs.get('max_tokens') || DEFAULT_PARAMETERS.max_tokens,
            top_p: +this.kwargs.get('top_p') || DEFAULT_PARAMETERS.top_p,
            frequency_penalty:
                +this.kwargs.get('frequency_penalty') ||
                DEFAULT_PARAMETERS.frequency_penalty,
            presence_penalty:
                +this.kwargs.get('presence_penalty') ||
                DEFAULT_PARAMETERS.frequency_penalty,
            stop: this.kwargs.get('stop')
                ? tokenize(this.kwargs.get('stop'))
                : DEFAULT_PARAMETERS.stop,
        };
    }
}
