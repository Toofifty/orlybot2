export const randint = (max: number): number => Math.floor(Math.random() * max);

export const choose = <T>(arr: T[]): T => arr[randint(arr.length)];
