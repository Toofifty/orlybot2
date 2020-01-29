import Message from 'core/model/message';

export type CommandAction = (
    message: Message,
    args: string[]
) => unknown | Promise<unknown>;

export type CommandArgument = {
    name: string;
    required: boolean;
    def?: string;
};
