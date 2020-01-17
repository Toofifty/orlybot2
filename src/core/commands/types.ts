import Message from 'core/model/message';

export type CommandAction = (message: Message, args: string[]) => any;

export type CommandArgument = {
    name: string;
    required: boolean;
    def?: string;
};
