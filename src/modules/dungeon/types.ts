export interface ChannelDungeon {
    sessionId?: string;
    players: {
        id: string;
        characterName: string;
    }[];
}
