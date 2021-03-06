import { chunk } from './array';
import { randint } from './random';

/**
 * Wrap a string in backticks.
 */
export const tag = (str: string | number) => `\`${str}\``;

/**
 * Wrap a string in pre tags (```).
 */
export const pre = (str: string) => tag(tag(tag(str)));

/**
 * Wrap a string in colons to make an :emoji:.
 */
export const emoji = (str: string) => `:${str}:`;

/**
 * Mention a user if only an ID is available (otherwise use User.tag)
 */
export const mention = (userId: string) => `<@${userId}>`;

/**
 * Extract ID out of a channel or user mention
 */
export const extractId = (text: string) =>
    (text.match(/<[@#]([^|]+)(?:|\S+)?>/) ?? [])[1];

/**
 * Get the emoji for a number (must be less than 10)
 */
export const numberEmoji = (n: number) =>
    ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][
        n - 1
    ] ?? 'x';

export const rpad = (text: string, width: number, char: string = ' ') => {
    try {
        return `${text}${char.repeat(width - text.length)}`;
    } catch {
        console.log(text, width, char);
    }
};

export const lpad = (text: string, width: number, char: string = ' ') =>
    `${char.repeat(width - text.length)}${text}`;

export const mock = (text: string) =>
    text
        .split('')
        .map(c => (randint(2) ? c.toUpperCase() : c.toLowerCase()))
        .join('');

export const columnise = (list: string[], columns = 3, padding = 4) => {
    const columnWidth =
        list.reduce((max, kw) => Math.max(max, kw.length), 0) + padding;

    return chunk(list, columns)
        .map(chunk => chunk.map(kw => rpad(kw, columnWidth)).join(''))
        .join('\n');
};
