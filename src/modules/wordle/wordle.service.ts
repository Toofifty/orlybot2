import fetch from 'node-fetch';
import { injectable, Message } from 'core';
import { emoji } from 'core/util';
import WordleStore, { LetterResult } from './wordle.store';

type WordResponse = {
    word: string;
    results: { definition: string; examples: string[] }[];
};

type InvalidResponse = {
    success: false;
    message: string;
};

const isInvalid = (data: any): data is InvalidResponse => {
    return data.success === false || data.word === undefined;
};

@injectable()
export default class WordleService {
    constructor(private store: WordleStore) {}

    public async start(message: Message) {
        if (this.store.game) {
            message.replyEphemeral("There's already a Wordle game running");
            return;
        }

        const solution = await this.fetchRandomWord();

        if (!solution) {
            message.replyEphemeral("I couldn't find a word, try again later");
            return;
        }

        this.store.game = {
            solution,
            guesses: [],
        };
        this.store.save();

        this.printGame(message);
    }

    public async guess(message: Message, word: string) {
        if (!this.store.game) {
            message.replyEphemeral("There's no Wordle game running");
            return;
        }

        if (!(await this.isValidWord(word))) {
            message.replyEphemeral('Invalid word!');
            message.addReaction('x');
            return;
        }

        const { solution } = this.store.game;
        let solutionTemp = solution;
        const result = word.split('').map((letter, index) => {
            if (letter === solutionTemp[index]) {
                solutionTemp = solutionTemp.replace(letter, '_');
                return LetterResult.Correct;
            }
            if (solutionTemp.includes(letter)) {
                return LetterResult.WrongPosition;
            }
            return LetterResult.WrongLetter;
        });

        this.store.game.guesses.push({
            guess: word,
            result,
        });
        await this.store.save();

        await this.printGame(message);

        if (result.every(r => r === LetterResult.Correct)) {
            message.reply(`You got it!`);
            this.store.game = null;
            this.store.save();
            return;
        }

        if (this.store.game.guesses.length >= 6) {
            message.reply(`Game over! The word was ${solution}`);
            this.store.game = null;
            this.store.save();
        }
    }

    public async cancel(message: Message) {
        if (!this.store.game) {
            message.replyEphemeral("There's no Wordle game running");
            return;
        }

        this.store.game = null;
        this.store.save();

        message.reply('The Wordle game has been cancelled.');
    }

    async printGame(message: Message) {
        const lines = [...this.store.game!.guesses];

        while (lines.length < 6) {
            lines.push({
                guess: '',
                result: Array(5).fill(LetterResult.Empty),
            });
        }

        const text = lines
            .map(({ guess, result }) => {
                return `${this.formatGuess(guess)}\n${result
                    .map(emoji)
                    .join(' ')}`;
            })
            .join('\n\n');

        await message.reply(text);
    }

    formatGuess(guess: string): string {
        if (!guess) return '';
        return `\`${guess.split('').join('`   `')}\``;
    }

    async fetchRandomWord(): Promise<string | undefined> {
        const data: WordResponse | InvalidResponse = await fetch(
            'https://wordsapiv1.p.rapidapi.com/words/?random=true&letters=5&frequencyMin=3&hasDetails=derivation',
            {
                headers: {
                    'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com',
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
                },
            }
        ).then(res => res.json());

        if (isInvalid(data)) {
            return undefined;
        }

        return data.word;
    }

    async isValidWord(word: string): Promise<boolean> {
        if (word.length !== 5) return false;

        const data: WordResponse | InvalidResponse = await fetch(
            `https://wordsapiv1.p.rapidapi.com/words/${word}`,
            {
                headers: {
                    'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com',
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
                },
            }
        ).then(res => res.json());

        return !isInvalid(data);
    }
}
