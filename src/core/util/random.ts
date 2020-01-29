/**
 * Generate a random integer between 0 and `max`.
 */
export const randint = (max: number): number => Math.floor(Math.random() * max);

/**
 * Choose a random item from an array.
 */
export const choose = <T>(arr: T[]): T => arr[randint(arr.length)];
