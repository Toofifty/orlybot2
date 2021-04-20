import { Validator } from 'core/commands/types';

export const validators = <T extends Record<string, Validator>>(
    v: T
): Record<keyof T, Validator> => v;
