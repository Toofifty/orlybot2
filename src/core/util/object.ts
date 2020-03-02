export const omit = (obj: object, key: string) =>
    Object.keys(obj).reduce((result, ckey) => {
        if (ckey !== key) {
            return { ...result, [key]: obj[key] };
        }
        return result;
    }, {});
