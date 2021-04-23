export type NoUndefined<T> = {
    [K in keyof T]: T[K] extends object
        ? Exclude<NoUndefined<T[K]>, undefined>
        : Exclude<T[K], undefined>;
};
