import { loginfo } from 'core';
import { ALPHABET } from '../engine/consts';
import { Position, ScrabbleBoard } from '../types';
import { isPosition } from './typeguards';
import { Coords, WordPosition } from './types';

/**
 * Convert alpha-numeric position to numeric-numeric
 * coordinates
 */
export const toCoords = (pos: Position): Coords => ({
    x: ALPHABET.indexOf(pos.x),
    y: pos.y - 1,
});

/**
 * Get the tile at the position on the board
 */
export const getTile = (board: ScrabbleBoard, pos: Position | Coords) => {
    if (isPosition(pos)) pos = toCoords(pos);
    return board.tiles[pos.y][pos.x];
};

/**
 * Get all the tiles within a region of the board,
 * starting at `pos`, moving in `pos.dir`, that is
 * `length` long
 */
export const getTileSet = (
    board: ScrabbleBoard,
    pos: WordPosition,
    length: number
) => {
    const res = Array(length)
        .fill('')
        .map((_, i) =>
            getTile(board, {
                x: pos.dir === 'across' ? pos.x + i : pos.x,
                y: pos.dir === 'down' ? pos.y + i : pos.y,
            })
        );
    loginfo('Found tileset', res);
    return res;
};
