const replaceKeys = (func: (value: string) => string) => <T>(obj: T) =>
    JSON.parse(
        JSON.stringify(obj ?? null).replace(
            /"(\w+)":/g,
            (_, m) => `"${func(m)}":`
        )
    );

export const camel = replaceKeys(str =>
    str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
);
