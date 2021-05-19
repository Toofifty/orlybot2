import { BOARD_SIZE } from '../engine/consts';
import { ScrabbleBoard } from '../types';
import ScrabblePlacementService from './placement.service';
import { WordPosition } from './types';
import { getTileSet, toCoords } from './util';

type CheckArgs = {
    board: ScrabbleBoard;
    letters: string;
    position: WordPosition;
    secondaryWords: string[];
    mainWord: string;
    service: ScrabblePlacementService;
};

type CheckFn = (
    args: CheckArgs
) => boolean | string | Promise<boolean | string>;

type ErrorFn = (args: CheckArgs, result?: string) => string;
type Check = { fn: CheckFn; error: string | ErrorFn };

export const placementChecks: Check[] = [
    // position is on the board
    {
        fn: ({ position }) => {
            const { x, y } = toCoords(position);

            return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
        },
        error: "That's not a valid position.",
    },
    // word is entirely contained on the board
    {
        fn: ({ letters, position }) => {
            const { x, y } = toCoords(position);

            return position.dir === 'across'
                ? x + letters.length <= BOARD_SIZE
                : y + letters.length <= BOARD_SIZE;
        },
        error: ({ letters }) => `*${letters}* wouldn't fit at that position.`,
    },
    // doesn't conflict with existing tile
    {
        fn: ({ board, letters, position }) =>
            getTileSet(board, position, letters.length).every(
                tile => tile == null
            ),
        error: "You can't place your word over existing letters.",
    },
    // must touch existing tile OR G7
    {
        fn: () => true,
        error:
            "Your word needs to connect to the other tiles on the board in at least one place. If it's the first turn, your word must be placed over G7 and be at least two letters long.",
    },
    // main word is valid
    {
        fn: () => true,
        error: ({ mainWord }) => `*${mainWord}* isn't a valid word.`,
    },
    // all secondary words are valid
    {
        fn: () => true,
        error: ({ mainWord }, invalidWord) =>
            `*${mainWord}* is a valid word, but it would create an invalid word *${invalidWord}* when placed there.`,
    },
];
