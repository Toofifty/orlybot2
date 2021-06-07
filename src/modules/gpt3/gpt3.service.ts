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
    constructor(private kwargs: Kwargs, private store: Gpt3Store) {}

    async fetchCompletion(
        prompt: string,
        parameters?: typeof DEFAULT_PARAMETERS
    ) {
        const res: CompletionResponse = await fetch(OPENAI_COMPLETIONS, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                ...(parameters ?? this.getParameters()),
                prompt,
            }),
        }).then(res => res.json());

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
        const arg = (key: string) => this.kwargs.get(key) ?? '';

        return {
            ...DEFAULT_PARAMETERS,
            temperature: +arg('temperature') || DEFAULT_PARAMETERS.temperature,
            max_tokens: +arg('max_tokens') || DEFAULT_PARAMETERS.max_tokens,
            top_p: +arg('top_p') || DEFAULT_PARAMETERS.top_p,
            frequency_penalty:
                +arg('frequency_penalty') ||
                DEFAULT_PARAMETERS.frequency_penalty,
            presence_penalty:
                +arg('presence_penalty') ||
                DEFAULT_PARAMETERS.frequency_penalty,
            stop: arg('stop') ? tokenize(arg('stop')) : DEFAULT_PARAMETERS.stop,
        };
    }
}
