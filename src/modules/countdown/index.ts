import User from 'core/model/user';
import { Command } from 'core/commands';
import { randint } from 'core/util';
import CommandRunner from 'core/commands/runner';
import { letters } from './letters';
import { numbers } from './numbers';

Command.create('countdown', async message => {
    if (randint(1)) {
        return CommandRunner.run('countdown numbers', message);
    }
    return CommandRunner.run('countdown letters', message);
})
    .desc('Start a game of Countdown (randomly picks letters or numbers)')
    .alias('cd', 'c')
    .nest(
        Command.sub(
            'help',
            () =>
                '*Countdown Numbers*\n' +
                'Use the six numbers given to solve for the target number. ' +
                'You can use addition `+`, subtraction `-`, division `/` and multiplication `*`. ' +
                'The closer you are to the target, the more points you score. Your final answer ' +
                'before the timer runs out determines your score.\nYou can specify the amount of ' +
                '"big" and "small" numbers in the command: `countdown numbers [big] [small]`\n' +
                '*Countdown Letters*\n' +
                'Create the longest word possible using the 9 given letters. Your final answer ' +
                'before the timer runs out determines your score.\nYou can specify the amount of ' +
                'vowels and consonants in the command: `countdown letters [vowels] [consonants]`'
        ).desc('Print out the rules of Countdown Numbers and Letters')
    )
    .nest(
        Command.sub('leaderboard', async () => {
            const users = await User.all();

            console.log(
                users.map(user => ({
                    name: user.slackName,
                    score:
                        (user.meta<number>('countdown_letters_score') ?? 0) +
                        (user.meta<number>('countdown_numbers_score') ?? 0),
                    letters: user.meta<number>('countdown_numbers_score') ?? 0,
                    numbers: user.meta<number>('countdown_letters_score') ?? 0,
                }))
            );

            const active = users
                .map(user => ({
                    user,
                    score:
                        (user.meta<number>('countdown_letters_score') ?? 0) +
                        (user.meta<number>('countdown_numbers_score') ?? 0),
                    letters: user.meta<number>('countdown_numbers_score') ?? 0,
                    numbers: user.meta<number>('countdown_letters_score') ?? 0,
                }))
                .filter(({ score }) => score > 0)
                .sort((a, b) => (a.score < b.score ? 1 : 0));

            return `*Countdown Leaderboard*\n${active
                .map(
                    ({ user, score, numbers, letters }, i) =>
                        `${i +
                            1}. ${user} - ${score} points (L: ${letters}, N: ${numbers})`
                )
                .join('\n')}`;
        })
            .alias('lb', 'scoreboard', 'sb', 's')
            .desc('Check out the Countdown leaderboard')
    )
    .nest(letters)
    .nest(numbers);
