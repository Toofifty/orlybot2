import { KwargDefinition } from 'core/model/kwargs';

export const parameterKwargs: KwargDefinition[] = [
    {
        key: ['temperature', 't'],
        description: 'How varied the completions are. Default 0.9',
    },
    {
        key: ['max_tokens', 'm'],
        description:
            'Max amount of tokens in the prompt + response. Do not set this too high. Default 50',
    },
    {
        key: ['top_p', 'P'],
        description: ':shrug: Default 1',
    },
    {
        key: ['frequency_penalty', 'f'],
        description: 'Penalise frequently used words/phrases. Default 0.9',
    },
    {
        key: ['presence_penalty', 'p'],
        description:
            'Penalise words already used to prevent them from appearing again. Default 0.8',
    },
    {
        key: ['stop', 's'],
        description:
            'Text to look for to end the response. Default ["\\n", "Human:", "AI:"]',
    },
    {
        key: ['model', 'm'],
        description:
            'Completion model to use: "davinci" (default), "curie", "babbage", or "ada".',
    },
];
