import {
    after,
    before,
    Controller,
    group,
    maincmd,
    Message,
    cmd,
    aliases,
    validate,
    kwargs,
    delegate,
    Kwargs,
    flag,
} from 'core';
import { pre } from 'core/util';
import Gpt3Store from './gpt3.store';
import Gpt3Service from './gpt3.service';
import Gpt3Validator from './gpt3.validator';
import Gpt3PromptController from './prompt.controller';
import { parameterKwargs } from './kwargs';
import Gpt3PromptService from './prompt.service';

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
    '> Use `help gpt3 -v` to see all valid parameters.',
    '> Custom parameters will only apply for the current completion.',
    '',
    '*Saving prompts (advanced)*',
    '> You can also save custom prompts to be re-used later in the `gpt3 complete` command.',
    '> To save a prompt, use the `gpt3 prompt save` command (usage below).',
    '> To use a prompt in a completion, pass it as a keyword argument with `--prompt|-Q [name of prompt]`. By default, the rest of the text in the command will be appended to the prompt before it is sent.',
    '> You can instead inject the text into the prompt, by adding placeholders $0, $1, $2 and so on into the prompt. Use $@ to inject the entire text.',
    '> e.g. `gpt3 prompt save test_prompt There was once a knight named $0, who lived in $1. He` -> `gpt3 complete -Q test_prompt "Sir Vyvin" "Falador castle"`',
    '> Request parameters provided in the `gpt3 prompt save` command will also always be applied to completions.',
])
@delegate(Gpt3PromptController)
export default class Gpt3Controller extends Controller {
    @before
    async before(message: Message) {
        await message.addReaction('thinking_face');
    }

    @after
    async after(message: Message) {
        await message.removeReaction('thinking_face');
    }

    @maincmd('Talk to GPT-3!')
    @aliases('g')
    @kwargs(...parameterKwargs)
    @validate(Gpt3Validator, 'validParameters')
    async chat(message: Message, service: Gpt3Service, ...text: string[]) {
        message.reply(await service.fetchReply(text.join(' ')));
    }

    @cmd('log', 'Print out the discussion log')
    log(message: Message, store: Gpt3Store) {
        message.reply(pre(store.discussion.join('\n')));
    }

    @cmd('undo', 'Undo the last message and response in the discussion')
    undo(message: Message, store: Gpt3Store) {
        store.discussion.pop();
        store.discussion.pop();
        store.save();
        message.addReaction('white_check_mark');
    }

    @cmd('reset', 'Reset the discussion')
    reset(message: Message, store: Gpt3Store) {
        store.discussion = store.initial.discussion;
        store.save();
        message.addReaction('white_check_mark');
    }

    @cmd('complete', 'Use GPT-3 to complete a prompt')
    @aliases('c')
    @kwargs(...parameterKwargs, {
        key: ['prompt', 'Q'],
        description: 'Name of prompt template',
    })
    @flag(['dry-run', 'd'], "Do a dry run (don't send to the API)")
    @validate(Gpt3Validator, 'validParameters')
    async complete(
        message: Message,
        kwargs: Kwargs,
        promptService: Gpt3PromptService,
        service: Gpt3Service,
        ...prompt: string[]
    ) {
        const savedPromptName = kwargs.get('prompt');

        if (savedPromptName) {
            const {
                prompt: preparedPrompt,
                parameters,
            } = await promptService.prepare(savedPromptName, prompt);

            if (kwargs.has('dry-run')) {
                return message.replyEphemeral(
                    `Would've sent this prompt:\n${pre(preparedPrompt)}`
                );
            }

            const completion = await service.fetchCompletion(
                preparedPrompt,
                parameters
            );
            return message.reply([`> ${prompt}`, completion]);
        }

        if (kwargs.has('dry-run')) return;

        const completion = await service.fetchCompletion(prompt.join(' '));
        return message.reply([`> ${prompt.join(' ')}`, completion]);
    }
}
