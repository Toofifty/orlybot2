import 'reflect-metadata';
import 'dotenv/config';

import 'core/bot';
import 'core/bootstrap';

import 'modules/articulate';
import 'modules/cleverbot';
import CountdownController from 'modules/countdown';
import 'modules/crossword';
import 'modules/debug';
import 'modules/dungeon';
import 'modules/gpt3';
import 'modules/inspirobot';
import JokesController from 'modules/jokes';
import 'modules/lunch';
import 'modules/meta';
import 'modules/misc';
import 'modules/simpsons';
import 'modules/stonks';
import TriviaController from 'modules/trivia';
import HelpController from 'modules/help';
import Gpt3Controller from 'modules/gpt3';
import WatchController from 'modules/watch';
import { register } from 'core';

register(CountdownController);
register(JokesController);
register(TriviaController);
register(HelpController);

if (process.env.OPENAI_API_KEY) {
    register(Gpt3Controller);
}
register(WatchController);
