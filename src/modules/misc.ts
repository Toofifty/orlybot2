import fetch from 'node-fetch';
import Command from 'core/commands/command';
import registry from 'core/commands/registry';
import { pre, choose, randint, emoji, sleep } from 'core/util';

Command.create('say')
    .do((message, args) => {
        message.reply(args.join(' '));
    })
    .desc('Repeat after me')
    .arg({ name: '...text', required: true });

Command.create('help')
    .do((message, args) => {
        const search = args.join(' ');
        message.reply(
            pre(
                registry
                    .all()
                    .map(command => command.help)
                    .filter(
                        text => search.length === 0 || text.includes(search)
                    )
                    .sort((a, b) => (a > b ? 1 : -1))
                    .join('\n') || `Nothing found searching for "${search}"`
            )
        );
    })
    .desc('Get some help')
    .arg({ name: '...search' });

Command.create('roll')
    .do((message, [sides = '6']) => {
        const max = Number(sides);
        const result =
            max > 0 && max <= 9
                ? emoji(
                      [
                          'one',
                          'two',
                          'three',
                          'four',
                          'five',
                          'six',
                          'seven',
                          'eight',
                          'nine',
                      ][randint(max - 1)]
                  )
                : randint(max + 1);
        message.reply(`${message.user.tag} rolled a *${result}*`);
    })
    .arg({ name: 'sides', def: '6' })
    .desc('Roll a dice');

Command.create('joke')
    .do(async message => {
        const { setup, punchline } = await fetch(
            'https://official-joke-api.appspot.com/random_joke'
        ).then(body => body.json());
        message.reply(setup);
        await sleep(5000);
        message.reply(punchline);
    })
    .desc('Funny jokes');

Command.create('good bot')
    .do(message =>
        message.reply(
            choose(['Thanks :heart:', 'Cheers!', ':heart_eyes:', 'Thanks!'])
        )
    )
    .desc('Thank me');

Command.create('bad bot')
    .do(message =>
        message.reply(
            choose([
                "I'm doing the best I can :(",
                'bad human',
                "I'm sorry :cry:",
                "I'm trying my best! Please visit this link to provide feedback: https://l.matho.me/mathobot/",
            ])
        )
    )
    .desc('Boost your ego by yelling at a poor defenceless bot');

Command.create('stupid bot')
    .do(message =>
        message.reply(
            choose([
                "I'm trying my best! Please visit this link to provide feedback: https://l.matho.me/mathobot/",
                'stupid human',
                "I didn't understand that, can you please try again",
                'Says you',
            ])
        )
    )
    .desc("Pretend you're smarter than me");
