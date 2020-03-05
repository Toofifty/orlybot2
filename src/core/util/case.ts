/**
 * Replace all keys in an object with the value of the original
 * key passed into the predicate `func`.
 */
const replaceKeys = (func: (value: string) => string) => <T>(obj: T) =>
    JSON.parse(
        JSON.stringify(obj ?? null).replace(
            /"(\w+)":/g,
            (_, m) => `"${func(m)}":`
        )
    );

/**
 * Replace all keys in an object with camelCase.
 */
export const camel = replaceKeys(str =>
    str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
);

export const capitalise = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
