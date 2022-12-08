import {
    admin,
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
        const {
            sendMessageInConversation,
            response,
        } = await chatGPTService.sendMessage(
            text.join(' '),
            once(() => message.addReaction('robot_face'))
        );

        const botMessage = await message.reply(response);

        botMessage.onReply(async reply => {
            reply.addReaction('thinking_face');
            botMessage.replyInThread(
                await sendMessageInConversation(
                    reply.text,
                    once(() => reply.addReaction('robot_face'))
                )
            );
            reply.removeReaction('thinking_face');
        });
    }

    @cmd('refresh-token', 'Provide a new session token')
    @admin
    async refreshToken(
        message: Message,
        chatGPTService: ChatGPTService,
        token: string
    ) {
        try {
            await chatGPTService.refreshToken(token);
            message.replyEphemeral('Token updated');
        } catch {
            message.replyEphemeral('Failed to update token');
        }
    }
}
