type LastFunction = {
    (arr: string): string;
    <T>(arr: T[]): T;
};

/**
 * Get last element in array or string.
 */
export const last: LastFunction = (arr: any) => arr[arr.length - 1];

/**
 * Split array by element.
 */
export const split = <T>(arr: T[], delim: T): T[][] =>
    arr
        .reduce(
            (result, item) => {
                if (item === delim) {
                    result.push([]);
                } else {
                    last(result).push(item);
                }
                return result;
            },
            [[]] as T[][]
        )
        .filter(arr => arr.length > 0);

/**
 * Flatten a 2D array.
 */
export const flat = <T>(arr: T[][]): T[] =>
    arr.reduce((result, item) => {
        if (Array.isArray(item)) {
            return [...result, ...item];
        }
        return [...result, item];
    }, []);
