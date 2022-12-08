export const once = <T extends (...args: any[]) => any>(fn: T) => {
    let called = false;
    let result: ReturnType<T>;
    return (...args: Parameters<T>) => {
        if (!called) {
            result = fn(...args);
            called = true;
        }
        return result;
    };
};
