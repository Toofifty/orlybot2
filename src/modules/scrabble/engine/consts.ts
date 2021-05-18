import { PremiumSquare } from '../types';

const rep = (letter: string, length: number) => letter.repeat(length).split('');

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// 15x15 board size doesn't fit into a message update :'(
export const BOARD_SIZE = 13;

export const MAX_PLAYERS = 4;

/**
 * "Bag" of all tiles used for a game
 */
export const ALL_TILES: string[] = [
    ...rep('A', 9),
    ...rep('B', 2),
    ...rep('C', 2),
    ...rep('D', 4),
    ...rep('E', 12),
    ...rep('F', 2),
    ...rep('G', 3),
    ...rep('H', 2),
    ...rep('I', 9),
    ...rep('J', 1),
    ...rep('K', 1),
    ...rep('L', 4),
    ...rep('M', 2),
    ...rep('N', 6),
    ...rep('O', 8),
    ...rep('P', 2),
    ...rep('Q', 1),
    ...rep('R', 6),
    ...rep('S', 4),
    ...rep('T', 6),
    ...rep('U', 4),
    ...rep('V', 2),
    ...rep('W', 2),
    ...rep('X', 1),
    ...rep('Y', 2),
    ...rep('Z', 1),
    ...rep(' ', 2),
];

/**
 * Point values for each letter tile
 */
export const TILE_SCORES = {
    A: 1,
    E: 1,
    I: 1,
    O: 1,
    U: 1,
    L: 1,
    N: 1,
    S: 1,
    T: 1,
    R: 1,
    D: 2,
    G: 2,
    B: 3,
    C: 3,
    M: 3,
    P: 3,
    F: 4,
    H: 4,
    V: 4,
    W: 4,
    Y: 4,
    K: 5,
    J: 8,
    X: 8,
    Q: 10,
    Z: 10,
    ' ': 0,
};

const ps = (
    x: string,
    y: number,
    type: PremiumSquare['type'],
    multiplier: PremiumSquare['multiplier']
): PremiumSquare => ({
    position: { x, y },
    type,
    multiplier,
});

/**
 * Premium square placements
 */
export const PREMIUM_SQUARES = [
    // triple word score (x8)
    ps('A', 1, 'word', 3),
    ps('G', 1, 'word', 3),
    ps('M', 1, 'word', 3),

    ps('A', 7, 'word', 3),
    ps('M', 7, 'word', 3),

    ps('A', 13, 'word', 3),
    ps('G', 13, 'word', 3),
    ps('M', 13, 'word', 3),

    // double word score (x17)
    ps('G', 7, 'word', 2),

    ps('B', 2, 'word', 2),
    ps('C', 3, 'word', 2),
    ps('D', 4, 'word', 2),

    ps('L', 2, 'word', 2),
    ps('K', 3, 'word', 2),
    ps('J', 4, 'word', 2),

    ps('D', 10, 'word', 2),
    ps('C', 11, 'word', 2),
    ps('B', 12, 'word', 2),

    ps('J', 10, 'word', 2),
    ps('K', 11, 'word', 2),
    ps('L', 12, 'word', 2),

    // triple letter score (x12)
    ps('E', 2, 'letter', 3),
    ps('I', 2, 'letter', 3),

    ps('B', 5, 'letter', 3),
    ps('E', 5, 'letter', 3),
    ps('I', 5, 'letter', 3),
    ps('L', 5, 'letter', 3),

    ps('B', 9, 'letter', 3),
    ps('E', 9, 'letter', 3),
    ps('I', 9, 'letter', 3),
    ps('L', 9, 'letter', 3),

    ps('E', 12, 'letter', 3),
    ps('I', 12, 'letter', 3),

    // // double letter score (x24)
    ps('F', 6, 'letter', 2),
    ps('H', 6, 'letter', 2),
    ps('F', 8, 'letter', 2),
    ps('H', 8, 'letter', 2),

    ps('D', 1, 'letter', 2),
    ps('F', 3, 'letter', 2),
    ps('G', 4, 'letter', 2),
    ps('H', 3, 'letter', 2),
    ps('J', 1, 'letter', 2),

    ps('A', 4, 'letter', 2),
    ps('C', 6, 'letter', 2),
    ps('D', 7, 'letter', 2),
    ps('C', 8, 'letter', 2),
    ps('A', 10, 'letter', 2),

    ps('M', 4, 'letter', 2),
    ps('K', 6, 'letter', 2),
    ps('J', 7, 'letter', 2),
    ps('K', 8, 'letter', 2),
    ps('M', 10, 'letter', 2),

    ps('D', 13, 'letter', 2),
    ps('F', 11, 'letter', 2),
    ps('G', 10, 'letter', 2),
    ps('H', 11, 'letter', 2),
    ps('J', 13, 'letter', 2),
];
