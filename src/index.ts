import 'reflect-metadata';
import 'dotenv/config.js';

import 'core/bot.js';
import 'core/bootstrap';

import 'modules/articulate';
import 'modules/cleverbot';
import 'modules/countdown';
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
import WordleController from 'modules/wordle';
import SimpsonsController from 'modules/simpsons';
import ChatGPTController from 'modules/chatgpt';
import { register } from 'core';

register(JokesController);
register(TriviaController);
register(HelpController);

if (process.env.OPENAI_API_KEY) {
    register(Gpt3Controller);
}
register(WatchController);
register(WordleController);
register(SimpsonsController);

if (process.env.CHATGPT_SESSION_TOKEN) {
    register(ChatGPTController);
}
