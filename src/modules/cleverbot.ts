import { Cleverbot } from 'clevertype';
import bot from 'core/bot';
import { Command } from 'core/commands';
import User from 'core/model/user';
import { loginfo } from 'core/log';

if (process.env.CLEVERBOT_KEY) {
    const cleverbot = new Cleverbot(process.env.CLEVERBOT_KEY);

    bot.ready(({ id }) => {
        Command.create(`<@${id}>`, async message => {
            let msg = message.text.replace(`<@${id}>`, 'Botty');
            // resolve users in text
            const userTags = msg.match(/<@.+?>/g) ?? [];

            const replaceUsers = await Promise.all(
                userTags.map(async tag => [tag, await User.find(tag)] as const)
            );

            msg = replaceUsers.reduce((carry, [tag, user]) => {
                return carry.replace(tag, user.profile.displayName);
            }, msg);

            loginfo('Resolved message:', msg);

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
