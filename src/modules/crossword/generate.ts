// step 1: get 4 random words, place horizontally into corners
// step 2: attempt to fill in vertical words between them
// step 3: for N tries, pick a point and direction and attempt to find
// a word to fill. continue until N tries reached or max words

import { randint, choose } from 'core/util';
import { fetchWithPattern } from './api';

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

export default class CrosswordGenerator {
    private difficulty: 'easy' | 'medium' | 'hard' | 'impossible' = 'easy';

    public constructor(
        public readonly w: number,
        public readonly h: number,
        public readonly words: number
    ) {
        if (this.w < 5 || this.h < 5) throw 'Too small!';
    }

    public setDifficulty(
        difficulty: 'easy' | 'medium' | 'hard' | 'impossible'
    ) {
        this.difficulty = difficulty;
    }

    public getMinFrequency() {
        if (this.difficulty === 'easy') {
            return 4;
        }
        if (this.difficulty === 'medium') {
            return 2;
        }
        if (this.difficulty === 'hard') {
            return 1;
        }
        return 0;
    }

    public async fetchStarterWord(letters: number) {
        let result: { word: string } | undefined;
        while (!result) {
            result = await fetchWithPattern({
                startWith: choose(ALPHA),
                letters,
                frequencyMin: this.getMinFrequency(),
            });
        }
        return result;
    }

    public async fetchCorners() {
        const lengths: number[] = [];

        if (this.w > 12) {
            // fetch extra 2 corners
            lengths.push(randint(3, this.w - 4));
            lengths.push(this.w - lengths[0] - 1);
            lengths.push(randint(3, this.w - 4));
            lengths.push(this.w - lengths[2] - 1);
        } else {
            lengths.push(this.w, this.w);
        }

        return Promise.all(
            lengths.map(length => this.fetchStarterWord(length))
        );
    }
}
