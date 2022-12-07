import {
    after,
    aliases,
    before,
    Channel,
    cmd,
    Controller,
    group,
    maincmd,
    Message,
} from 'core';
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

    @maincmd('Begin a new conversation with ChatGPT')
    @aliases('~')
    async single(
        message: Message,
        channel: Channel,
        chatGPTService: ChatGPTService,
        ...text: string[]
    ) {
        message.reply(
            await chatGPTService.singleMessage(channel, text.join(' '))
        );
    }

    @cmd('conversation', 'Continue the latest conversation with ChatGPT')
    @aliases('&gt;')
    async conversation(
        message: Message,
        channel: Channel,
        chatGPTService: ChatGPTService,
        ...text: string[]
    ) {
        message.reply(
            await chatGPTService.conversationMessage(channel, text.join(' '))
        );
    }
}
