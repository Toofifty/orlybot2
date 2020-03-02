export type ReactionAddedData = {
    type: 'reaction_added';
    user: string;
    reaction: string;
    itemUser: string;
    item: {
        type: 'message';
        channel: string;
        ts: string;
    };
    eventTs: string;
};

export type ReactionRemovedData = {
    type: 'reaction_removed';
    user: string;
    reaction: string;
    itemUser: string;
    item: {
        type: 'message';
        channel: string;
        ts: string;
    };
    eventTs: string;
};

export type AllEvents = ReactionAddedData | ReactionRemovedData;
