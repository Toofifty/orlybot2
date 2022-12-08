import { ChatGPTAPI } from 'chatgpt';
import { logdebug, loginfo } from 'core';

export default class ChatGPTService {
    private api: ChatGPTAPI;
    private sessionToken = process.env.CHATGPT_SESSION_TOKEN!;

    constructor() {
        this.connect();
    }

    private async connect() {
        this.api = new ChatGPTAPI({
            sessionToken: this.sessionToken,
        });
        await this.api.ensureAuth();
        loginfo('ChatGPT initialized');
    }

    public async sendMessage(text: string, onProgress?: () => void) {
        const conversation = this.api.getConversation();
        logdebug('ChatGPT message:', text);
        return {
            response: await conversation.sendMessage(text, { onProgress }),
            sendMessageInConversation: (
                text: string,
                onProgress?: () => void
            ) => {
                logdebug('ChatGPT conversation:', text);
                return conversation.sendMessage(text, { onProgress });
            },
        };
    }

    public async refreshToken(token: string) {
        this.sessionToken = token;
        await this.connect();
    }
}
