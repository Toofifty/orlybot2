import fetch from 'node-fetch';
import { Command } from 'core/commands';
import { sleep, choose } from 'core/util';

Command.create('joke', async message => {
    const { setup, punchline } = await fetch(
        'https://official-joke-api.appspot.com/random_joke'
    ).then(body => body.json());
    message.reply(setup);
    await sleep(5000);
    message.reply(punchline);
}).desc('Tell me a joke');

Command.create('dadjoke', async () => {
    const { joke } = await fetch('https://icanhazdadjoke.com/', {
        headers: { Accept: 'application/json' },
    }).then(body => body.json());
    return joke;
}).desc('Tell me a dad joke');

Command.create('good bot', () =>
    choose(['Thanks :heart:', 'Cheers!', ':heart_eyes:', 'Thanks!'])
)
    .desc('Thank me')
    .isPhrase();
