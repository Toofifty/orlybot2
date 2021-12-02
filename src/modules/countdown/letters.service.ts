import { Channel, Command, injectable, Message, registry, User } from 'core';
import { assert, mention, numberEmoji } from 'core/util';
import { chooseWeighted, shuffle } from 'core/util/random';
import CountdownStore from './countdown.store';

const VOWELS_WEIGHTED = {
    a: 8.12,
    e: 12.02,
    i: 7.31,
    o: 7.68,
    u: 2.88,
};

const CONSONANTS_WEIGHTED = {
    b: 1.49,
    c: 2.71,
    d: 4.32,
    f: 2.3,
    g: 2.03,
    h: 5.92,
    j: 0.1,
    k: 0.69,
    l: 3.98,
    m: 2.61,
    n: 6.95,
    p: 1.82,
    q: 0.11,
    r: 6.02,
    s: 6.28,
    t: 9.1,
    v: 1.11,
    w: 2.09,
    x: 0.17,
    y: 2.11,
    z: 0.07,
};

export type WordResponse = {
    word: string;
    results: {
        definition: string;
        examples: string[];
        synonyms: string[];
        typeOf: string[];
    }[];
};

type InvalidResponse = {
    success: false;
    message: string;
};

const isInvalid = (data: any): data is InvalidResponse => {
    return data.success === false || data.word === undefined;
};

@injectable()
export default class LettersService {
    constructor(private store: CountdownStore) {}

    public gameIsRunning() {
        return !!this.store.game;
    }

    private async fetchWord(word: string): Promise<WordResponse | undefined> {
        const data: WordResponse | InvalidResponse = await fetch(
            `https://wordsapiv1.p.rapidapi.com/words/${word}`,
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

        return data;
    }

    private async fetchBest(letters: string) {
        const data: any = await fetch(
            `http://www.anagramica.com/best/${letters}`
        ).then(res => res.json());
        if (data.best) return data.best[0];
        return undefined;
    }

    public generateLetters(vowels: number, consonants: number): string[] {
        return shuffle([
            ...Array(vowels)
                .fill('')
                .map(() => chooseWeighted(VOWELS_WEIGHTED)),
            ...Array(consonants)
                .fill('')
                .map(() => chooseWeighted(CONSONANTS_WEIGHTED)),
        ]);
    }

    private matchesLetters(word: string): boolean {
        assert(this.store.game?.type === 'letters', 'Game is not letters');
        const letters = [...this.store.game.letters];
        for (let i = 0; i < word.length; i++) {
            const l = word[i];
            if (letters.includes(l)) {
                const index = letters.indexOf(l);
                letters.splice(index, 1);
            } else {
                return false;
            }
        }
        return true;
    }

    private wordAlreadySubmitted(word: string): boolean {
        assert(this.store.game?.type === 'letters', 'Game is not letters');
        return Object.values(this.store.game.submitted).includes(word);
    }

    private async onSubmit(message: Message) {
        assert(this.store.game?.type === 'letters', 'Game is not letters');

        const text = message.text.toLowerCase().replace(/\W/g, '');

        if (!this.matchesLetters(text)) return;

        if (this.wordAlreadySubmitted(text)) {
            message.replyEphemeral('Someone already submitted that word');
            message.addReaction('x');
            return;
        }

        if (!(await this.fetchWord(text))) {
            message.replyEphemeral("I don't think that's a real word");
            message.addReaction('x');
            return;
        }

        message.addReaction(numberEmoji(text.length));
        this.store.game.submitted[message.user.id] = text;
        await this.store.save();
    }

    public createWordListeners(channel: Channel) {
        assert(this.store.game?.type === 'letters', 'Game is not letters');

        this.store.game.letters.forEach(letter => {
            Command.create(letter, async message => {
                if (message.channel.id !== channel.id) return;
                await this.onSubmit(message);
            })
                .hide()
                .isPhrase();
        });
    }

    public async startGame(
        message: Message,
        vowels: number,
        consonants: number
    ) {
        const letters = this.generateLetters(vowels, consonants);

        this.store.game = {
            type: 'letters',
            letters,
            submitted: {},
        };
        await this.store.save();

        message.reply(
            `*Countdown Letters* is starting! You have 1 minute to find the longest word.\n` +
                `The letters are: *${shuffle(letters)
                    .join(' ')
                    .toUpperCase()}*`
        );
    }

    public async endGame(message: Message) {
        assert(this.store.game?.type === 'letters', 'Game is not letters');

        this.store.game.letters.forEach(letter => registry.unregister(letter));

        const players = Object.entries(this.store.game.submitted)
            .map(([id, word]) => ({
                id,
                score: word.length === 9 ? 18 : word.length,
            }))
            .sort((a, b) => b.score - a.score);

        if (players.length === 0) {
            message.reply('Nobody even tried? :(');
            return;
        }

        const best = players.shift();
        assert(best);
        message.reply(
            `Time's up! ${mention(best.id)} got the highest with *+${
                best.score
            }* points! ${
                players.length > 0
                    ? `Followed by ${players
                          .map(
                              player =>
                                  `${mention(player.id)} (*+${player.score}*)`
                          )
                          .join(', ')}`
                    : ''
            }`
        );

        [best, ...players].forEach(async ({ id, score }) => {
            (await User.find(id)).meta(
                'countdown_letters_score',
                (total?: number) => (total ?? 0) + score
            );
        });

        const bestWord = await this.fetchBest(
            this.store.game.letters.join('').toLowerCase()
        );

        if (bestWord) {
            message.reply(`The best I could come up with is *${bestWord}*`);
        }
    }
}
