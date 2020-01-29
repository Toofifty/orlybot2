import { last } from './array';

const TOKEN_DELIMETERS = ["'", '"', '`', '“', '“'];

/**
 * Tokenize a string, splitting on spaces but keeping
 * quoted items together. Don't ask how it works.
 */
const tokenize = (str: string): string[] =>
    Array.from(str.trim()).reduce(
        ({ quote, tokens, working }, letter, i) => {
            if (
                last(working) !== '\\' &&
                !quote &&
                TOKEN_DELIMETERS.includes(letter)
            ) {
                return { quote: letter, tokens, working };
            }
            if (last(working) !== '\\' && quote === letter) {
                if (i === str.length - 1) {
                    return { quote, tokens: [...tokens, working], working: '' };
                }
                return {
                    quote: null,
                    tokens: [...tokens, working],
                    working: '',
                };
            }
            if (i === str.length - 1) {
                return {
                    quote,
                    tokens: [...tokens, working + letter],
                    working: '',
                };
            }
            if (letter === ' ' && !quote && !working) {
                return { quote, tokens, working };
            }
            if (letter === ' ' && !quote) {
                return { quote, tokens: [...tokens, working], working: '' };
            }
            return { quote, tokens, working: working + letter };
        },
        { quote: null, tokens: [], working: '' }
    ).tokens;

export default tokenize;
