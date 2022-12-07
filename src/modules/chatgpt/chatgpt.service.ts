import { ChatGPTAPI, ConversationResponseEvent } from 'chatgpt';
import { Channel } from 'core';
import { nanoid } from 'nanoid';

export default class ChatGPTService {
    private conversationIds: Record<string, string | undefined> = {};

    private api: ChatGPTAPI;
    private saveConversationId: any;

    constructor() {
        this.api = new ChatGPTAPI({
            sessionToken: process.env.CHATGPT_SESSION_TOKEN!,
        });
        this.saveConversationId = (channel: Channel) => (
            response: ConversationResponseEvent
        ) => {
            this.conversationIds[channel.id] = response.conversation_id;
        };
    }

    public singleMessage(channel: Channel, text: string) {
        this.conversationIds[channel.id] = nanoid();

        console.log(this.conversationIds);

        return this.api.sendMessage(text, {
            conversationId: this.conversationIds[channel.id],
        });
    }

    public conversationMessage(channel: Channel, text: string) {
        if (!this.conversationIds[channel.id]) {
            this.conversationIds[channel.id] = nanoid();
        }

        console.log(this.conversationIds);

        return this.api.sendMessage(text, {
            conversationId: this.conversationIds[channel.id],
        });
    }
}
