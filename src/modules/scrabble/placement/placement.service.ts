import { injectable, User } from 'core';
import { assert } from 'core/util';
import ScrabbleStore from '../scrabble.store';
import { isGameInitialised } from '../typeguards';
import { TurnRecord } from '../types';
import { placementChecks } from './placement-checks';
import { Coords, WordPosition } from './types';
import { toCoords } from './util';

@injectable()
export default class ScrabblePlacementService {
    constructor(private store: ScrabbleStore) {}

    /**
     * Create a word position struct from the command argument
     */
    parsePosition(xyd: string): WordPosition | undefined {
        const [, x, y, dir] =
            xyd.toUpperCase().match(/(\w)(\d{1,2})(d|a)/i) ?? [];
        if (!x || !y || !dir || !['D', 'A'].includes(dir)) {
            return undefined;
        }

        return {
            x,
            y: +y,
            dir: dir === 'D' ? 'down' : 'across',
        };
    }

    /**
     * Check if the user has all letters inside `letters`
     * in their rack
     */
    userHasTiles(user: User, letters: string) {
        assert(isGameInitialised(this.store));

        const player = this.store.players[user.id];

        const rack = [...player.rack];
        return letters
            .toUpperCase()
            .split('')
            .every(letter => {
                if (rack.includes(letter)) {
                    const idx = rack.indexOf(letter);
                    rack.splice(idx, 1);
                    return true;
                }
                if (rack.includes(' ')) {
                    const idx = rack.indexOf(' ');
                    rack.splice(idx, 1);
                    return true;
                }
                return false;
            });
    }

    /**
     * Get all words, valid or not, that are created
     * when the letters are placed onto the board at the
     * specified position
     */
    getPotentialWords(letters: string, { dir, ...position }: WordPosition) {
        const lettersInDir = (
            coords: Coords,
            dir: 'up' | 'down' | 'left' | 'right'
        ) => {};

        // main word
        // check in both directions along axis
        // append all letters found until an empty tile

        const coords = toCoords(position);
        const startOfWord = coords;
        // const endOfWord =

        // secondary words
        // for each letter in the new word:
        // check in both directions along opposite axis
        // append all letters found until an empty tile

        return {
            mainWord: '',
            secondaryWords: [''],
        };
    }

    /**
     * Calculate the score and words created from a tile
     * placement
     */
    scoreMove(letters: string, position: WordPosition): TurnRecord {
        // TODO
        return {
            mainWord: letters,
            words: [
                {
                    word: letters,
                    score: 2,
                },
            ],
        };
    }

    /**
     * Place letter tiles into the game board
     */
    async placeTiles(letters: string, { dir, ...position }: WordPosition) {
        assert(isGameInitialised(this.store));

        const { x, y } = toCoords(position);
        for (let i = 0; i < letters.length; i++) {
            this.store.board.tiles[dir === 'down' ? y + i : y][
                dir === 'across' ? x + i : x
            ] = letters[i].toUpperCase();
        }

        await this.store.save();
    }
}
