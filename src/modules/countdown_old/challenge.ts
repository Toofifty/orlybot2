import { Command } from 'core';
import { shuffle } from 'core/util';
import { WordResponse, fetchRandom } from './api';

let word: WordResponse;

export const challenge = Command.sub('challenge', async message => {
    if (word) {
        return message.reply(
            `There\'s a challenge already running! The letters are:\n*${shuffle(
                word.word.toUpperCase().split('')
            ).join(' ')}*`
        );
    }

    word = await fetchRandom(9);

    message.reply(
        `*Countdown Challenge* has begun! Can you figure out what word these nine letters make?\n*${shuffle(
            word.word.toUpperCase().split('')
        ).join(' ')}* (${word.word})`
    );
})
    .nest(Command.sub('hint'))
    .nest(Command.sub('giveup'));
