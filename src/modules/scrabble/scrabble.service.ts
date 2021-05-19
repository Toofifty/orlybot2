import {
    BotMessage,
    Channel,
    CommandRunner,
    injectable,
    Message,
    User,
} from 'core';
import { assert, choose, mention, shuffle } from 'core/util';
import { ALL_TILES, BOARD_SIZE, PREMIUM_SQUARES } from './engine/consts';
import { renderGame, renderPlayerScore, renderRack } from './engine/render';
import ScrabbleStore from './scrabble.store';
import { isGameInitialised } from './typeguards';
import { ScrabbleBoard, TurnRecord } from './types';

@injectable()
export default class ScrabbleService {
    constructor(private store: ScrabbleStore) {}

    /**
     * Create & save an empty game in the store, if
     * there's not already one in progress
     */
    async tryCreateGame() {
        if (!isGameInitialised(this.store)) {
            this.store.board = this.createBoard();
            this.store.tiles = shuffle(ALL_TILES);
            this.store.players = {};
            this.store.isFirstTurn = true;
            await this.store.save();
        }
    }

    /**
     * Add a player to the current game
     *
     * @returns new player count
     */
    async addPlayer(user: User) {
        assert(
            isGameInitialised(this.store),
            'Game not initialised when adding a player.'
        );

        this.store.players[user.id] = {
            id: user.id,
            rack: [],
            score: 0,
            records: [],
        };
        await this.store.save();

        return Object.keys(this.store.players).length;
    }

    /**
     * Begin the game
     *
     * Posts the board, portions tiles and begins turns
     */
    async beginGame(message: Message) {
        assert(
            isGameInitialised(this.store),
            'Game not initialised when attempting to begin.'
        );

        await this.portionTiles();
        this.store.currentTurn = choose(Object.keys(this.store.players));
        this.store.begin = new Date().getTime();
        await this.store.save();
        await this.print(message);

        await message.reply(
            `Hey ${mention(
                this.store.currentTurn
            )} - you start! Use \`scrabble place <xyd> <letters>\``
        );

        Object.keys(this.store.players).forEach(async userId => {
            const user = await User.find(userId);
            this.printTileRack(user, message.channel);
        });
    }

    /**
     * Move currentTurn to the next player
     */
    async startNextTurn() {
        assert(isGameInitialised(this.store));

        const playerIds = Object.keys(this.store.players);
        this.store.currentTurn =
            playerIds[
                (playerIds.indexOf(this.store.currentTurn) +
                    1 +
                    playerIds.length) %
                    playerIds.length
            ];

        await this.store.save();
    }

    /**
     * Move currentTurn to the next player without scoring
     */
    async skipTurn(message: Message) {
        await this.startNextTurn();
        await message.reply(
            `Turn skipped - you\'re up ${mention(this.store.currentTurn!)}`
        );
    }

    /**
     * Save player score and records after a turn is complete,
     * and move to the next turn
     */
    async finishTurn(message: Message, turn: TurnRecord, letters: string) {
        assert(isGameInitialised(this.store));

        const score = turn.words.reduce(
            (total, wordScore) => total + wordScore.score,
            0
        );

        const player = this.store.players[message.user.id];
        player.records = [...player.records, turn];
        player.score = player.score + score;
        player.rack = this.removeFromRack(player.rack, letters);
        await this.store.save();

        await this.print(message);
        await this.startNextTurn();
        await message.reply(
            `Nice! ${score} points. You're next, ${mention(
                this.store.currentTurn!
            )}!`
        );

        await this.portionTiles();
        await this.printTileRack(message);
    }

    /**
     * Print the game information and board
     *
     * If there's already an active game message, just edit it.
     * Deletes the currently active game message first if `reprint`
     * is given
     */
    async print(message: Message, reprint = false) {
        assert(isGameInitialised(this.store));

        if (reprint && this.store.gameMessage) {
            const oldMsg = await BotMessage.from(this.store.gameMessage);
            oldMsg.unpin();
            this.store.gameMessage = null;
        }

        if (this.store.gameMessage) {
            const msg = await BotMessage.from(this.store.gameMessage);
            await msg.edit(renderGame(this.store));
            console.log('edit::', renderGame(this.store));

            for (const player of Object.values(this.store.players)) {
                const playerMsg = await BotMessage.from(player.message);
                await playerMsg.edit(renderPlayerScore(player));
                console.log(renderPlayerScore(player));
            }

            return;
        }

        const msg = await message.reply(renderGame(this.store));
        msg.pin();

        for (const player of Object.values(this.store.players)) {
            const msgReply = await msg.replyInThread(renderPlayerScore(player));
            player.message = msgReply.serialize();
        }

        this.store.gameMessage = msg.serialize();
        await this.store.save();
    }

    /**
     * Send a user's tiles to them in an ephemeral message
     */
    async printTileRack(message: Message): Promise<void>;
    async printTileRack(user: User, channel: Channel): Promise<void>;
    async printTileRack(
        messageOrUser: Message | User,
        channel?: Channel
    ): Promise<void> {
        assert(isGameInitialised(this.store));

        if (messageOrUser instanceof User) {
            messageOrUser.ephemeral(
                renderRack(this.store.players[messageOrUser.id]),
                channel
            );
            return;
        }

        messageOrUser.replyEphemeral(
            renderRack(this.store.players[messageOrUser.user.id])
        );
    }

    /**
     * Tear down the current game
     */
    async destroyGame() {
        if (this.store.gameMessage) {
            const oldMsg = await BotMessage.from(this.store.gameMessage);
            oldMsg.unpin();
        }

        this.store.board = null;
        this.store.currentTurn = null;
        this.store.begin = null;
        this.store.gameMessage = null;
        this.store.isFirstTurn = true;
        this.store.players = null;
    }

    private async portionTiles() {
        assert(isGameInitialised(this.store));

        for (const player of Object.values(this.store.players)) {
            while (player.rack.length < 7 && this.store.tiles.length > 0) {
                player.rack.push(this.store.tiles.pop()!);
            }
        }
        await this.store.save();
    }

    private removeFromRack(rack: string[], letters: string) {
        letters
            .toUpperCase()
            .split('')
            .forEach(letter => rack.splice(rack.indexOf(letter), 1));
        return rack;
    }

    private createBoard(): ScrabbleBoard {
        return {
            tiles: new Array(BOARD_SIZE)
                .fill(null)
                .map(() => new Array(BOARD_SIZE).fill(null)),
            premiumSquares: [...PREMIUM_SQUARES],
        };
    }
}
