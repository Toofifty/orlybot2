import {
    aliases,
    cmd,
    Controller,
    group,
    kwargs,
    Message,
    validate,
} from 'core';
import { columnise, pre } from 'core/util';
import Gpt3Validator from './gpt3.validator';
import Gpt3PromptService from './prompt.service';
import { parameterKwargs } from './kwargs';

@group('prompt', 'Manage saved prompts')
export default class Gpt3PromptController extends Controller {
    @cmd('list', 'List saved prompts')
    async list(message: Message, service: Gpt3PromptService) {
        const prompts = await service.getAll();

        if (prompts.length === 0) {
            return message.reply('No prompts saved.');
        }

        message.reply(
            '*Saved prompts*\n' +
                pre(columnise(prompts.map(prompt => prompt.name)))
        );
    }

    @cmd('view', 'View a prompt')
    async view(message: Message, service: Gpt3PromptService, name: string) {
        const prompt = await service.get(name);

        const formatSafe = (value: string | string[] | number) => {
            if (Array.isArray(value)) {
                return `["${value.join('", "').replace('\n', '\\n')}"]`;
            }
            return value;
        };

        message.reply([
            `Prompt name: \`${prompt.name}\``,
            `Prompt text:\n${pre(prompt.promptText)}`,
            `Parameters:\n${pre(
                Object.keys(prompt.parameters)
                    .map(
                        param =>
                            `${param}: ${formatSafe(prompt.parameters[param])}`
                    )
                    .join('\n')
            )}`,
        ]);
    }

    @cmd('save', 'Save a prompt to use later')
    @aliases('add')
    @kwargs(...parameterKwargs)
    @validate(Gpt3Validator, 'validParameters')
    async save(
        message: Message,
        service: Gpt3PromptService,
        name: string,
        ...prompt: string[]
    ) {
        await service.save(name, prompt.join(' '));
        message.addReaction('white_check_mark');
    }

    @cmd('delete', 'Delete a saved prompt')
    @aliases('remove')
    async delete(message: Message, service: Gpt3PromptService, name: string) {
        await service.delete(name);
        message.addReaction('white_check_mark');
    }
}
