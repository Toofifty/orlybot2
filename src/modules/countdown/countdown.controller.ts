import {
    after,
    aliases,
    before,
    Controller,
    group,
    maincmd,
    Message,
} from 'core';
import LettersService from './letters.service';
import NumbersService from './numbers.service';

@group('countdown')
export default class CountdownController extends Controller {
    @before
    before(message: Message) {
        message.addReaction(':stopwatch:');
    }

    @after
    after(message: Message) {
        message.removeReaction(':stopwatch:');
    }

    @maincmd('Start a game of Countdown! Letters')
    @aliases('cd')
    public async letters(
        message: Message,
        service: LettersService,
        vowels?: string,
        consonants?: string
    ) {
        const nVowels = Number(vowels || 4);
        const nConsonants = Number(consonants || 9 - nVowels);

        if (nVowels + nConsonants !== 9) {
            throw 'Invalid number of letters';
        }

        if (nVowels < 3) throw 'Must have at least 3 vowels';
        if (nConsonants < 4) throw 'Must have at least 4 consonants';

        if (service.gameIsRunning()) {
            throw "There's already a game of Countdown Letters running";
        }

        await service.startGame(message, nVowels, nConsonants);

        setTimeout(() => {
            service.endGame(message);
        }, 60000);
    }
}
