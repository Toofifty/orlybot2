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

        Command.create('set-emotion', (message, [amount]) => {
            cleverbot.setEmotion(Number(amount));
            return cleverbot.say("I've set your emotion to ${amount}");
        })
            .desc("Set @mathobot's emotion response value")
            .arg({ name: 'value', required: true });

        Command.create('set-engagement', (message, [amount]) => {
            cleverbot.setEngagement(Number(amount));
            return cleverbot.say("I've set your engagement to ${amount}");
        })
            .desc("Set @mathobot's engagement response value")
            .arg({ name: 'value', required: true });

        Command.create('set-regard', (message, [amount]) => {
            cleverbot.setRegard(Number(amount));
            return cleverbot.say("I've set your regard to ${amount}");
        })
            .desc("Set @mathobot's regard response value")
            .arg({ name: 'value', required: true });
    });
}
