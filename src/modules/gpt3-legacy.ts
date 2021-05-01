import fetch from 'node-fetch';
import { Command } from 'core/commands';
import { pre } from 'core/util';

const OPENAI_COMPLETIONS =
    'https://api.openai.com/v1/engines/davinci/completions';

const PROMPT_LENGTH = 6;

type CompletionResponse = {
    choices: { text: string }[];
};

const parameters = {
    temperature: 0.9,
    max_tokens: 50,
    top_p: 1,
    frequency_penalty: 0.9,
    presence_penalty: 0.8,
    stop: ['\n', 'Human:', 'AI:'],
};

let discussion: string[] = [
    "Human: G'day, how's it goin'?",
    'AI: Not too bad mate.',
];

const getPrompt = () =>
    discussion.slice(discussion.length - PROMPT_LENGTH).join('\n');

const addToDiscussion = (human: string, ai: string) =>
    discussion.push(`Human: ${human}`, `AI:${ai}`);

const listify = (list: string[]) =>
    `["${list.join('", "').replace('\n', '\\n')}"]`;

const fetchCompletion = async (prompt: string) => {
    const res: CompletionResponse = await fetch(OPENAI_COMPLETIONS, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            ...parameters,
            prompt,
        }),
    }).then(res => res.json());

    return res.choices[0].text;
};

const fetchReply = async (message: string) => {
    const completion = await fetchCompletion(`${getPrompt()}\n${message}\nAI:`);
    addToDiscussion(message, completion);
    return completion;
};

if (process.env.OPENAI_API_KEY) {
    const viewLog = Command.sub('log')
        .desc('View discussion log')
        .do(async message => {
            message.reply(pre(discussion.join('\n')));
        });

    const viewPrompt = Command.sub('prompt')
        .desc('View most recent discussion prompt')
        .do(async message => {
            message.reply(pre(getPrompt()));
        });

    const viewParams = Command.sub('params')
        .desc('View parameters used for GPT-3 requests')
        .do(async message => {
            message.reply(
                pre(
                    Object.entries(parameters)
                        .map(
                            ([k, v]) =>
                                `${k}: ${Array.isArray(v) ? listify(v) : v}`
                        )
                        .join('\n')
                )
            );
        });

    const resetDiscussion = Command.sub('reset')
        .desc('Reset discussion')
        .do(async message => {
            discussion = [];
            message.addReaction('white_check_mark');
        });

    const addDiscussion = Command.sub('add')
        .desc('Manually add to the discussion')
        .do(async (message, args) => {
            discussion.push(...args);
            message.addReaction('white_check_mark');
            message.reply(pre(getPrompt()));
        });

    const completePrompt = Command.sub('complete')
        .arg({ name: '...prompt', required: true })
        .desc('Get GPT-3 to complete a prompt')
        .do(async (message, args) => {
            const prompt = args.join(' ');
            const completion = await fetchCompletion(prompt);
            message.reply(`${prompt}${completion}`);
        });

    const setParam = Command.sub('set')
        .arg({ name: 'parameter', required: true })
        .arg({ name: '...value', required: true })
        .desc('Set a parameter on GPT-3 requests')
        .do(async (message, [param, ...valueStr]) => {
            const keys = Object.keys(parameters);
            if (!keys.includes(param)) {
                throw new Error(
                    `Unknown parameter. Valid parameters are ${keys
                        .map(p => `\`${p}\``)
                        .join(', ')}.`
                );
            }

            if (param === 'stop') {
                const old = parameters.stop;
                parameters.stop = valueStr;

                message.reply(
                    `Parameter \`${param}\` has been set to \`${listify(
                        valueStr
                    )}\` (was \`${listify(old)}\`).`
                );
                return;
            }

            const value = parseFloat(valueStr[0]);
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
        .alias('g', 'gpt')
        .arg({ name: '...message', required: true })
        .desc('Talk to GPT-3!')
        .do(async (message, args) => {
            await message.addReaction('thinking_face');
            const reply = await fetchReply(args.join(' '));
            await message.reply(reply);
            message.removeReaction('thinking_face');
        })
        .nest(completePrompt)
        .nest(viewPrompt)
        .nest(setParam)
        .nest(viewParams)
        .nest(viewLog)
        .nest(resetDiscussion)
        .nest(addDiscussion);
}
