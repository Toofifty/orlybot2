import {
    after,
    before,
    Controller,
    group,
    kwarg,
    maincmd,
    Message,
    Kwargs,
    cmd,
    aliases,
    validate,
} from 'core';
import Gpt3Store from './gpt3.store';
import Gpt3Service from './gpt3.service';
import Gpt3Validator from './gpt3.validator';

@group('gpt3', [
    '*GPT-3* - deep learning text completion',
    '> GPT-3 is a cutting edge language model that uses machine learning to generate text based off of a prompt.',
    '> To send a simple message to it in a "chatbot" context, you can just use `gpt3 <your message here>`. You can also use the alias of just `g`.',
    '> You can check the chat log using `gpt3 log`, and clear it with `gpt3 reset`.',
    '',
    '*Usage guidelines*',
    "> 1. Please don't swear in your prompts. The model will actually pick up on this and most likely swear back. If it does, the owners of the AI will flag the response and may reconsider my access :/",
    '> 2. Same goes for political or other controversial topics. Please avoid mentioning real people.',
    "> 3. If the model does respond inappropriately, you can run `gpt3 reset` so it doesn't do it again.",
    "> 4. Try to avoid long prompts, and don't spam requests. Our usage is very limited and won't last forever.",
    '',
    '*Changing parameters (advanced)*',
    '> You can change the parameters sent in the request using keyword arguments in your command.',
    '> For example; `g --temperature 0.2 How was your day today?`',
    '> Valid parameters include: `--temperature|-t [0 to 1]`, `--max_tokens|-m int`, `--top_p|-P [0 to 1]`, `--frequency_penalty|-f [0 to 1]`, `--presence_penalty|-p [0 to 1]`, and `--stop|-s "string1 string2"`.',
    '> Custom parameters will only apply for the current completion.',
    '',
    '*Saving prompts (advanced)*',
    '> You can also save custom prompts to be re-used later in the `gpt3 complete` command.',
    '> To save a prompt, use the `gpt3 save` command (usage below).',
    '> To use a prompt in a completion, pass it as a keyword argument with `--prompt|-Q [name of prompt]`. By default, the rest of the text in the command will be appended to the prompt before it is sent.',
    '> You can instead inject the text into the prompt, by adding placeholders $1, $2, $3 and so on into the prompt. Use $@ to inject the entire text.',
    '> e.g. `gpt3 save test_prompt There was once a knight named $1, who lived in $2. He` -> `gpt3 complete -Q test_prompt "Sir Vyvin" "Falador castle"`',
    '> Request parameters provided in the `gpt3 save` command will also always be applied to completions.',
])
export default class Gpt3Controller extends Controller {
    @before
    before(message: Message) {
        message.addReaction('thinking_face');
    }

    @after
    after(message: Message) {
        message.removeReaction('thinking_face');
    }

    @maincmd('Talk to GPT-3!')
    @aliases('g')
    @kwarg(
        ['stop', 's'],
        'Text to look for to end the response. Default ["\\n", "Human:", "AI:"]'
    )
    @kwarg(
        ['presence_penalty', 'p'],
        'Penalise words already used to prevent them from appearing again. Default 0.8'
    )
    @kwarg(
        ['frequency_penalty', 'f'],
        'Penalise frequently used words/phrases. Default 0.9'
    )
    @kwarg(['top_p', 'P'], ':shrug: Default 1')
    @kwarg(
        ['max_tokens', 'm'],
        'Max amount of tokens in the prompt + response. Do not set this too high. Default 50'
    )
    @kwarg(['temperature', 't'], 'How varied the completions are. Default 0.9')
    @validate(Gpt3Validator, 'validParameters')
    chat(message: Message, kwargs: Kwargs, ...text: string[]) {
        console.log(kwargs);
    }

    @cmd('log', 'Print out the chat log')
    log(message: Message) {
        console.log('woo');
    }
}
