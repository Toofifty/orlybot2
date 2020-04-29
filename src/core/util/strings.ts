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
 * Get the emoji for a number (must be less than 10)
 */
export const numberEmoji = (n: number) =>
    ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][
        n - 1
    ] ?? 'x';
