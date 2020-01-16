export type CommandAction = () => void;

export type CommandArgument = {
    name: string;
    required: boolean;
    def?: string;
};
