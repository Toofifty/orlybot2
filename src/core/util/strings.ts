/**
 * Wrap a string in backticks.
 */
export const tag = (str: string) => `\`${str}\``;

/**
 * Wrap a string in pre tags (```).
 */
export const pre = (str: string) => tag(tag(tag(str)));

/**
 * Wrap a string in colons to make an :emoji:.
 */
export const emoji = (str: string) => `:${str}:`;
