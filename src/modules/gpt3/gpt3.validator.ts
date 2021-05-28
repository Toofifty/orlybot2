import { injectable, Kwargs } from 'core';
import { CommandValidator } from 'core/oop/types';

export default class Gpt3Validator {
    @injectable()
    validParameters(kwargs: Kwargs): CommandValidator {
        return async () => {
            // 0-1 kwargs
            const args = [
                'temperature',
                'top_p',
                'frequency_penalty',
                'presence_penalty',
            ];
            for (const arg of args) {
                const value = kwargs.get(arg);
                if (value && (+value > 1 || +value < 0)) {
                    return `\`${arg}\` is out of range.`;
                }
            }

            const maxTokens = kwargs.get('max_tokens');
            if (maxTokens && (+maxTokens < 0 || +maxTokens > 100)) {
                return '`max_tokens` is out of range.';
            }

            return true as const;
        };
    }
}
