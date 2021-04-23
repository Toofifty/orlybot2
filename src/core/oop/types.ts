export type Validator = (
    arg: string,
    index: number,
    ctx: { args: string[] }
) => true | string | Promise<true | string>;

export type InjectableValidator = (...args: any[]) => Validator;
