import 'reflect-metadata';
import 'dotenv/config';

import 'core/bot';
import 'core/bootstrap';

import 'modules/articulate';
import 'modules/cleverbot';
import 'modules/countdown';
import 'modules/crossword';
import 'modules/dungeon';
import 'modules/inspirobot';
import JokesController from 'modules/jokes';
import 'modules/lunch';
import 'modules/meta';
import 'modules/misc';
import 'modules/simpsons';
import 'modules/stonks';
import TriviaController from 'modules/trivia';
import { logdebug, registry, register } from 'core';

register(JokesController);
register(TriviaController);

setTimeout(() => {
    logdebug(
        'Commands registered:',
        registry.all().map(cmd => cmd.commandName)
    );
}, 500);
