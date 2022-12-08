import { MessageAttachment } from '@slack/types';

export type ID = string;

export type MessageOptions = {
    attachments?: MessageAttachment[];
    threadTs?: string;
};
