import { Command, registry } from 'core/commands';
import { mention } from 'core/util';
import User from 'core/model/user';
import { fetchWord } from './fetch';
import { load, update } from './data';

Command.create('articulate', async message => {
    const { currentWord, describer, lastDescriber } = await load(
        message.channel
    );

    if (currentWord) {
        message.replyEphemeral(
            `There's already an Articulate! game running. ${mention(
                describer!
            )} is the describer.`
        );
        return;
    }

    // check previous describer
    if (lastDescriber === message.user.id) {
        message.replyEphemeral(
            "You were the describer last game, now it's someone elses turn."
        );
        return;
    }

    const { category, word } = await fetchWord();

    await update(message.channel, () => ({
        startTime: +new Date(),
        currentWord: word,
        describer: message.user.id,
        lastDescriber: message.user.id,
    }));

    Command.create(word, async message => {
        const { startTime, describer } = await load(message.channel);
        if (!startTime) return;
        if (describer === message.user.id) {
            message.addReaction('angry');
            message.reply(
                `No cheating ${message.user}! You can't say the word. Round over.`
            );
        } else {
            message.addReaction('white_check_mark');
            const points = Math.floor(500000 / (+new Date() - startTime!));
            message.reply(
                `Got it! *+${points}* points to ${mention(describer!)} and ${
                    message.user
                }`
            );
            (await User.find(describer!)).meta(
                'articulate_score',
                (score?: number) => (score ?? 0) + points
            );
            message.user.meta(
                'articulate_score',
                (score?: number) => (score ?? 0) + points
            );
        }
        registry.unregister(word);
        update(message.channel, () => ({
            startTime: undefined,
            currentWord: undefined,
            describer: undefined,
        }));
    })
        .isPartial()
        .hide();

    message.reply(
        `The first to guess ${message.user}'s word (or phrase) wins!\n` +
            `The category is *${category}*.`
    );
    message.replyEphemeral(
        `Your word is *${word}*.\n` +
            'Remember, you need to describe the word without explicitly saying it.'
    );
})
    .desc('Play Articulate! with the channel')
    .alias('a!', 'articulate!')
    .nest(
        Command.sub(
            'help',
            async () =>
                'Articulate! is a game where one player (the describer) must describe the word ' +
                'they are given, and the rest of their team must guess it. In this version, the ' +
                'entire channel may guess the word and points are awarded to both the winner and ' +
                'describer based on the time taken to guess the correct word.\nMore categories ' +
                'are included than traditional Articulate!.\nThe person  who begins the game is ' +
                'the describer, and cannot be the describer in the next round.'
        ).desc('Print Articulate! rules')
    )
    .nest(
        Command.sub('cancel', async message => {
            const { currentWord } = await load(message.channel);

            if (!currentWord) {
                throw 'There is no game running';
            }

            update(message.channel, () => ({
                startTime: undefined,
                currentWord: undefined,
                describer: undefined,
            }));
            registry.unregister(currentWord);

            message.reply('Articulate! cancelled');
        }).desc('Cancel the current Articulate! game')
    )
    .nest(
        Command.sub('leaderboard', async () => {
            const users = await User.all();

            const active = users
                .filter(user => {
                    return user.meta<number>('articulate_score') > 0;
                })
                .map(user => ({
                    user,
                    score: user.meta<number>('articulate_score'),
                }))
                .sort((a, b) => (a.score < b.score ? 1 : 0));

            return `*Articulate! Leaderboard*\n${active
                .map(
                    ({ user, score }, i) =>
                        `${i + 1}. ${user} - ${score} points`
                )
                .join('\n')}`;
        })
            .alias('lb', 'l', 'scoreboard', 'sb', 's')
            .desc('Check out the Articulate! leaderboard')
    );
