import { Cleverbot } from 'clevertype';
import bot from 'core/bot';
import { Command } from 'core/commands';

if (process.env.CLEVERBOT_KEY) {
    const cleverbot = new Cleverbot(process.env.CLEVERBOT_KEY);

    bot.ready(({ id }) => {
        console.log('create command', `<@${id}>`);
        Command.create(`<@${id}>`, message => {
            const msg = message.text.replace(`<@${id}>`, 'Botty');
            return cleverbot.say(msg);
        })
            .desc('Mention me to have a conversation')
            .isPhrase();
    });
}
