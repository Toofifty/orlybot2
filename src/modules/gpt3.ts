import fetch from 'node-fetch';
import { Command } from 'core/commands';

const OPENAI_COMPLETIONS =
    'https://api.openai.com/v1/engines/davinci/completions';

const parameters = {
    temperature: 0.9,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0.0,
    presence_penalty: 0.6,
};

const discussion = [
    'The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n',
    'Human: Hello, who are you?',
    'AI: I am an AI created by OpenAI. How can I be of service?',
    'Human: What year did The Simpsons start?',
    'AI: The Simpsons first aired on December 17, 1989.',
    'Human: Thanks!',
    'AI: No worries mate!',
];

const getPrompt = () => discussion.join('\n');
const addToDiscussion = (human: string, ai: string) =>
    discussion.push(`Human: ${human}`, `AI: ${ai}`);

const fetchCompletion = async (prompt: string, stop?: string[]) => {
    const res = await fetch(OPENAI_COMPLETIONS, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            ...parameters,
            prompt,
            stop,
        }),
    });

    console.log(res);

    return '???';
};

const fetchReply = async (message: string) => {
    const stop = ['\n', ' Human:', ' AI:'];
    const res = await fetchCompletion(`${getPrompt()}\n${message}\nAI:`, stop);

    console.log(res);

    return '???';
};

if (process.env.OPENAI_API_KEY) {
    const completePrompt = Command.sub('complete')
        .arg({ name: '...prompt', required: true })
        .desc('Get GPT-3 to complete a prompt.')
        .do(async (message, args) => {
            const completion = await fetchCompletion(args.join(' '));
            message.reply(completion);
        });

    const setParam = Command.sub('set')
        .arg({ name: 'parameter', required: true })
        .arg({ name: 'value', required: true })
        .desc('Set a parameter on GPT-3 requests')
        .do(async (message, [param, valueStr]) => {
            const keys = Object.keys(parameters);
            if (!keys.includes('param')) {
                throw new Error(
                    `Unknown parameter. Valid parameters are ${keys
                        .map(p => `\`${p}\``)
                        .join(', ')}.`
                );
            }

            const value = parseFloat(valueStr);
            if (isNaN(value)) {
                throw new Error('Parameter value must be numeric.');
            }

            const old = parameters[param];
            parameters[param] = value;

            message.reply(
                `Parameter \`${param}\` has been set to \`${value}\` (was \`${old}\`).`
            );
        });

    Command.create('gpt3')
        .alias('g')
        .arg({ name: '...message', required: true })
        .desc('Talk to GPT-3!')
        .do(async (message, args) => {
            const reply = await fetchReply(args.join(' '));
            message.reply(reply);
        })
        .nest(completePrompt)
        .nest(setParam);
}
