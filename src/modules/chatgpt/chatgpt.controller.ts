import {
    after,
    aliases,
    before,
    cmd,
    Controller,
    group,
    maincmd,
    Message,
} from 'core';
import { once } from 'core/util/once';
import ChatGPTService from './chatgpt.service';

@group('chatgpt', 'Talk to ChatGPT')
export default class ChatGPTController extends Controller {
    @before
    async before(message: Message) {
        await message.addReaction('thinking_face');
    }

    @after
    async after(message: Message) {
        await message.removeReaction('thinking_face');
    }

    @maincmd(
        'Begin a conversation with ChatGPT. To continue the conversation, reply to @mathobot in a thread.'
    )
    @aliases('~')
    async message(
        message: Message,
        chatGPTService: ChatGPTService,
        ...text: string[]
    ) {
        const response = await chatGPTService.sendMessage(
            message.user,
            text.join(' '),
            once(() => message.addReaction('robot_face'))
        );

        const botMessage = await message.reply(response);
    }

    @cmd('clear', 'Clear the conversation history')
    async clear(message: Message, chatGPTService: ChatGPTService) {
        await chatGPTService.clearConversation();
        await message.reply(':robot_face: Conversation cleared');
    }
}
