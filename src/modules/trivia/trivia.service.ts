import he from 'he';
import fetch from 'node-fetch';

import { Message, Channel, registry, Command, User, CommandRunner } from 'core';
import { assert, shuffle, choose } from 'core/util';
import TriviaStore from './trivia.store';
import { Category } from './types';

const FETCH_AMOUNT = 10;

interface ApiQuestion {
    category: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

export default class TriviaService {
    /**
     * Fetch trivia category list from the API
     */
    async fetchCategories(): Promise<Category[]> {
        const data = await fetch(
            `https://opentdb.com/api_category.php`
        ).then(res => res.json());

        return data.trivia_categories;
    }

    async fetchCategory(category: string): Promise<Category | undefined> {
        return (await this.fetchCategories()).find(cat =>
            cat.name.toLowerCase().includes(category.toLowerCase())
        );
    }

    /**
     * Fetch a single trivia question (& answers) from the API,
     * with the specified difficulty and from the specified
     * categories
     */
    async fetchTrivia(difficulty: string, categories: string[]) {
        let accepted: ApiQuestion[] = [];
        while (accepted.length === 0) {
            accepted = (await this.fetchQuestions(difficulty)).filter(
                this.isAcceptableQuestion(categories)
            );
        }
        return this.clean(accepted[0]);
    }

    /**
     * Print the current trivia question in reply to the message
     */
    async printTrivia(message: Message, store: TriviaStore) {
        const { game } = store;
        assert(game);

        message.reply(
            `${game.category} (${game.difficulty}): *${game.question}*`
        );

        setTimeout(() => {
            message.reply(
                game.options.map((a, i) => `${i + 1}. *${a}*`).join('\n')
            );
        }, 5000);
    }

    /**
     * Register listeners for the current game
     */
    async createAnswerListeners(channel: Channel, store: TriviaStore) {
        store.game?.options.forEach(option => {
            Command.create(option.toLowerCase(), async message => {
                if (message.channel.id !== channel.id) return;

                if (option.toLowerCase() === store.game?.answer.toLowerCase()) {
                    this.onCorrect(store, message);
                } else {
                    this.onIncorrect(store, message);
                }
            })
                .isPhrase()
                .hide();
        });
    }

    /**
     * De-register listeners
     */
    async destroyAnswerListeners(store: TriviaStore) {
        store.game?.options.forEach(option => {
            registry.unregister(option.toLowerCase());
        });
    }

    /**
     * De-register listeners and remove game data from the store
     */
    async endTrivia(message: Message, store: TriviaStore) {
        this.destroyAnswerListeners(store);
        const { difficulty } = store.game ?? {};

        store.game = null;
        store.save();

        if (store.autostart) {
            CommandRunner.run(`trivia ${difficulty}`, message);
        }
    }

    /**
     * Get trivia score information for all users with trivia wins
     * (not channel specific)
     */
    async getTriviaScores() {
        return (await User.all())
            .filter(user => user.meta<number>('trivia_wins') > 0)
            .map(user => ({
                user,
                score:
                    user.meta<number>('trivia_wins') -
                    (user.meta<number>('trivia_bad_guesses') ?? 0),
                ratio: (
                    (user.meta<number>('trivia_wins') /
                        ((user.meta<number>('trivia_bad_guesses') ?? 0) +
                            user.meta<number>('trivia_wins') || 1)) *
                    100
                ).toFixed(0),
            }))
            .sort((a, b) => a.score - b.score);
    }

    private async onCorrect(store: TriviaStore, message: Message) {
        const wins = message.user.meta(
            'trivia_wins',
            (w: number) => (w ?? 0) + 1
        );
        if (!store.noReply) {
            message.reply(
                choose([
                    `Well hot dog! We have a weiner! You win ${message.user}! You're on ${wins} wins.`,
                    `You got it ${message.user}! You've won ${wins} trivias.`,
                    `Good stuff ${message.user}! That's ${wins} wins so far.`,
                    `You're on fire ${message.user}! ${wins} total wins!`,
                    `Slow down ${message.user} and let other people have a chance! You're on ${wins} wins.`,
                    `Amazing! ${message.user} got it! You're on ${wins} wins.`,
                    `lol grats ${message.user} ur now on ${wins} dubs`,
                    `Ding ding ding ding! ${message.user} is on ${wins} wins.`,
                    `👌😎 good 😠🤣😂 stuff 😍🎁 ${message.user} 👏👏 win 💸🤑 #${wins} 💵💰`,
                ])
            );
        }
        message.addReaction('white_check_mark');
        this.endTrivia(message, store);
    }

    private async onIncorrect(store: TriviaStore, message: Message) {
        message.user.meta('trivia_bad_guesses', (g: number) => (g ?? 0) + 1);
        if (!store.noReply) {
            message.reply(
                choose([
                    `I don't think that's right ${message.user} :/`,
                    `Not even close ${message.user}!`,
                    `Wayyy off ${message.user}`,
                    `${message.user} - nope.`,
                    `${message.user} - nada.`,
                    `${message.user} - no bueno.`,
                    `HA! Yeah right, ${message.user}`,
                    `Well done ${message.user}! You got it completely wrong!`,
                    `Serious ${message.user}? That's your answer?`,
                    `Try again ${message.user}.`,
                    `Better luck next time ${message.user}!`,
                    `Pfft. Try a bit harder ${message.user}.`,
                    `${message.user}...\nno.`,
                    `lol no ${message.user} u noob`,
                ])
            );
        }
        message.addReaction('x');
    }

    private async fetchQuestions(difficulty: string): Promise<ApiQuestion[]> {
        const data = await fetch(
            `https://opentdb.com/api.php?amount=${FETCH_AMOUNT}&difficulty=${difficulty}`
        ).then(res => res.json());

        return data.results;
    }

    private isAcceptableQuestion(categories: string[]) {
        return ({ category }: ApiQuestion) => {
            return categories.length === 0 || categories.includes(category);
        };
    }

    private clean(result: ApiQuestion) {
        return {
            question: he.decode(result.question),
            category: he.decode(result.category),
            options: shuffle([
                ...result.incorrect_answers.map(answer =>
                    he.decode(answer).trim()
                ),
                he.decode(result.correct_answer).trim(),
            ]),
            answer: he.decode(result.correct_answer).trim(),
        };
    }
}
