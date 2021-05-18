import {
    after,
    aliases,
    before,
    cmd,
    Controller,
    group,
    maincmd,
    Message,
    User,
    validate,
} from 'core';
import ScrabbleValidator from './scrabble.validator';
import ScrabbleService from './scrabble.service';
import { MAX_PLAYERS } from './engine/consts';

@group('scrabble')
export default class ScrabbleController extends Controller {
    @before
    async before(message: Message) {
        await message.addReaction('a');
    }

    @after
    async after(message: Message) {
        await message.removeReaction('a');
    }

    @maincmd('Alias for "scrabble place"')
    @aliases('scr')
    async index(xyd: string, letters: string) {
        return this.place(xyd, letters);
    }

    @cmd('join', 'Join the scrabble game! Autostarts at 4 players')
    @validate(ScrabbleValidator, 'gameIsJoinable', 'userIsNotInGame')
    async join(user: User, message: Message, service: ScrabbleService) {
        service.tryCreateGame();
        const playerCount = await service.addPlayer(user);

        if (playerCount === MAX_PLAYERS) {
            await message.reply(
                `${user} has taken the last spot in Scrabble! The game is about to start...`
            );
            return await service.beginGame(message);
        }

        return message.reply(`${user} is ready to play Scrabble!`);
    }

    @cmd('start', 'Quickstart Scrabble with < 4 players')
    @validate(ScrabbleValidator, 'gameIsJoinable', 'userIsInGame')
    async quickstart(message: Message, service: ScrabbleService) {
        message.replyEphemeral('Quick-starting Scrabble!');
        service.beginGame(message);
    }

    @cmd('place', 'Place letter tiles on the board')
    @validate(ScrabbleValidator, 'gameIsInProgress', 'userIsInGame')
    async place(xyd: string, letters: string) {}

    @cmd('print', 'Print the current Scrabble game')
    @validate(ScrabbleValidator, 'gameIsInProgress')
    async print(message: Message, service: ScrabbleService) {
        await service.print(message);
    }

    @cmd('rack', 'Print the current Scrabble game')
    @validate(ScrabbleValidator, 'gameIsInProgress', 'userIsInGame')
    async printRack(message: Message, service: ScrabbleService) {
        await service.printTileRack(message);
    }

    @cmd('cancel', 'Cancel the current Scrabble game')
    @validate(ScrabbleValidator, 'gameIsInProgress', 'userIsInGame')
    async cancel(message: Message, service: ScrabbleService) {
        await service.destroyGame();
        message.reply('Scrabble cancelled :/');
    }
}
