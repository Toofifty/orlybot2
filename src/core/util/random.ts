/**
 * Generate a random integer between 0 and `max`.
 */
export const randint = (max: number): number => Math.floor(Math.random() * max);

type ChooseFunc = {
    <T>(arr: T[]): T;
    (arr: string): string;
};

/**
 * Choose a random item from an array or string.
 */
export const choose: ChooseFunc = (arr: any): any => arr[randint(arr.length)];

/**
 * Shuffle an array
 */
export const shuffle = <T>(arr: T[]): T[] =>
    arr
        .map(a => ({ sort: Math.random(), value: a }))
        .sort((a, b) => a.sort - b.sort)
        .map(a => a.value);
