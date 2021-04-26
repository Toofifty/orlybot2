import he from 'he';
import fetch from 'node-fetch';

import { Message, Channel } from 'core';
import { assert, shuffle } from 'core/util';
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
    async fetchCategories(): Promise<Category[]> {
        const data = await fetch(
            `https://opentdb.com/api_category.php`
        ).then(res => res.json());

        return data.trivia_categories;
    }

    async fetchTrivia(difficulty: string, categories: string[]) {
        let accepted: ApiQuestion[] = [];
        while (accepted.length === 0) {
            accepted = (await this.fetchQuestions(difficulty)).filter(
                this.isAcceptableQuestion(categories)
            );
        }
        return this.clean(accepted[0]);
    }

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

    async createAnswerListeners(channel: Channel, store: TriviaStore) {}

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
