import { Controller, group, maincmd, Message, validate } from 'core';
import ScrabbleService from '../scrabble.service';
import ScrabbleValidator from '../scrabble.validator';
import ScrabblePlacementService from './placement.service';
import ScrabblePlacementValidator from './placement.validator';

@group('place')
export default class ScrabblePlacementController extends Controller {
    @maincmd('Place letter tiles on the board')
    @validate(
        ScrabblePlacementValidator,
        'userHasCurrentTurn',
        'tilePlacementIsValid'
    )
    @validate(ScrabbleValidator, 'gameIsInProgress', 'userIsInGame')
    async place(
        message: Message,
        service: ScrabblePlacementService,
        scrabbleService: ScrabbleService,
        @validate(ScrabblePlacementValidator, 'validXYD')
        xyd: string,
        @validate(ScrabblePlacementValidator, 'validLetters')
        letters: string
    ) {
        message.addReaction('white_check_mark');

        const position = service.parsePosition(xyd)!;
        await service.placeTiles(letters, position);
        const turn = service.scoreMove(letters, position);
        await scrabbleService.finishTurn(message, turn, letters);
    }
}
