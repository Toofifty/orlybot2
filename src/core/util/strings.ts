export const tag = (str: string) => `\`${str}\``;

export const pre = (str: string) => tag(tag(tag(str)));
