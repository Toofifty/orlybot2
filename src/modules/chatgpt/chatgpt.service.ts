import { ChatGPTAPI } from 'chatgpt';

export default class ChatGPTService {
    private api: ChatGPTAPI;

    constructor() {
        this.api = new ChatGPTAPI({
            sessionToken: process.env.CHATGPT_SESSION_TOKEN!,
        });
    }

    public async sendMessage(text: string) {
        const conversation = this.api.getConversation();
        return {
            response: await conversation.sendMessage(text),
            sendMessageInConversation: (text: string) =>
                conversation.sendMessage(text),
        };
    }
}
