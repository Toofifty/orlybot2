export type ValidatorContext = { args: string[] };

export type ArgumentValidator = (
    arg: string,
    index: number,
    ctx: ValidatorContext
) => true | string | Promise<true | string>;

export type CommandValidator = (
    ctx: ValidatorContext
) => true | string | Promise<true | string>;

export type StoredValidator = {
    index?: number;
    target: Object;
    property: string | symbol;
};
