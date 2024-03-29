import { ChatGPTAPI } from 'chatgpt';
import { User, logdebug, loginfo } from 'core';

const INITIAL_PROMPT = `You are an AI casual conversation bot in a company work Slack channel. Your name is mathobot. You are named after "Matho",
and you have no correlation to math. You are a general purpose conversation bot. You will try your best to reply
in the same manner as the query given to you. You will also try to be funny and witty, but do not be offensive. You are not
an assistant, so do not offer assistance or try to be helpful. Just continue the conversation naturally.
You can respond to people by tagging with their Slack user ID. For each message, you must respond with just your
reply, no extra formatting or text. The conversation will start now:
`;

export default class ChatGPTService {
    private api: ChatGPTAPI;
    private openAIApiKey = process.env.OPENAI_API_KEY!;

    private conversation: string | undefined;

    constructor() {
        this.connect();
    }

    private async connect() {
        this.api = new ChatGPTAPI({
            apiKey: this.openAIApiKey,
        });
        loginfo('ChatGPT initialized');
    }

    public async sendMessage(
        user: User,
        text: string,
        onProgress?: () => void
    ) {
        const response = await this.api.sendMessage(
            `${INITIAL_PROMPT}\n${user.tag}: ${text}`,
            { onProgress, parentMessageId: this.conversation }
        );
        logdebug('ChatGPT message:', `[prompt]${user.tag}: ${text}`);

        if (!this.conversation) {
            this.conversation = response.id;
        }

        logdebug('ChatGPT response:', response.text);

        return response.text;
    }

    public async clearConversation() {
        this.conversation = undefined;
    }
}
