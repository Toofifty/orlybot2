import {
    after,
    aliases,
    before,
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

    @maincmd(
        'Begin a conversation with ChatGPT. To continue the conversation, reply to @mathobot in a thread.'
    )
    @aliases('~')
    async message(
        message: Message,
        chatGPTService: ChatGPTService,
        ...text: string[]
    ) {
        const {
            sendMessageInConversation,
            response,
        } = await chatGPTService.sendMessage(text.join(' '));

        const botMessage = await message.reply(response);

        botMessage.onReply(async reply => {
            reply.addReaction('thinking_face');
            botMessage.replyInThread(
                await sendMessageInConversation(reply.text)
            );
            reply.removeReaction('thinking_face');
        });
    }
}
