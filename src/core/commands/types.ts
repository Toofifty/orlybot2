import Message from 'core/model/message';
import { CommandController } from 'core/new';

export type CommandAction = (
    message: Message,
    args: string[]
) => unknown | Promise<unknown>;

export type Validator = (
    arg: string,
    index: number,
    ctx: { controller: CommandController; args: string[] }
) => true | string | Promise<true | string>;

export type CommandArgument = {
    name: string;
    required: boolean;
    def?: string;
    validators?: Validator[];
};
