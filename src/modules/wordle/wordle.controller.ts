import {
    after,
    aliases,
    before,
    cmd,
    Controller,
    group,
    maincmd,
    Message,
} from 'core';
import WordleService from './wordle.service';

@group('wordle', [
    '*Wordle* - how to play',
    '> Use `wordle` to start a new game',
    '> Guess the WORDLE in 6 tries.',
    '> Each guess must be a valid 5 letter word. Use `wordle <word>` to submit a guess.',
    'Examples',
    '`W`   `E`   `A`   `R`   `Y`',
    ':large_green_square: :white_square: :white_square: :white_square: :white_square:',
    'The letter W is in the word and in the correct spot.',
    '`P`   `I`   `L`   `L`   `S`',
    ':white_square: :large_yellow_square: :white_square: :white_square: :white_square:',
    'The letter I is in the word but in the wrong spot.',
    '`V`   `A`   `G`   `U`   `E`',
    ':white_square: :white_square: :white_square: :black_square: :white_square:',
    'The letter U is not in the word in any spot.',
])
export default class WordleController extends Controller {
    @before
    before(message: Message) {
        message.addReaction('ok');
    }

    @after
    after(message: Message) {
        message.removeReaction('ok');
    }

    @maincmd('Guess a Wordle word')
    @aliases('w')
    async guess(message: Message, service: WordleService, guess: string) {
        await service.guess(message, guess);
    }

    @cmd('new', 'Start a new game of Wordle')
    async start(message: Message, service: WordleService) {
        await service.start(message);
    }

    @cmd('cancel', 'Cancel the current Wordle game')
    async cancel(message: Message, service: WordleService) {
        await service.cancel(message);
    }
}
