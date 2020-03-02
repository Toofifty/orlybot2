import { LunchOption } from './types';

export const findOption = (options: LunchOption[], name: string) =>
    options.find(option => option.name.toLowerCase() === name.toLowerCase());

export const findOptionIndex = (options: LunchOption[], name: string) =>
    options.findIndex(
        option => option.name.toLowerCase() === name.toLowerCase()
    );

export const print = ({ name, icon }: LunchOption) => `*${name}* ${icon}`;
