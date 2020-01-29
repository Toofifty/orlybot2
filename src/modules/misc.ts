import { Command, registry } from 'core/commands';
import { pre, choose, randint, emoji } from 'core/util';
import { flat } from 'core/util/array';

Command.create('say', (message, args) => {
    message.reply(args.join(' '));
})
    .desc('Repeat after me')
    .arg({ name: '...text', required: true });

Command.create('help', (message, args) => {
    const search = args.join(' ');
    message.reply(
        pre(
            flat(registry.all().map(command => command.help))
                .filter(text => search.length === 0 || text.includes(search))
                .sort((a, b) => (a > b ? 1 : -1))
                .join('\n') || `Nothing found searching for "${search}"`
        )
    );
})
    .desc('Get some help')
    .arg({ name: '...search' })
    .alias('h');

Command.create('roll', (message, [sides = '6']) => {
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
    return `${message.user.tag} rolled a *${result}*`;
})
    .arg({ name: 'sides', def: '6' })
    .desc('Roll a dice');

Command.create('bad bot', () =>
    choose([
        "I'm doing the best I can :(",
        'bad human',
        "I'm sorry :cry:",
        "I'm trying my best! Please visit this link to provide feedback: https://l.matho.me/mathobot/",
    ])
)
    .desc('Boost your ego by yelling at a poor defenceless bot')
    .isPhrase();

Command.create('stupid bot', () =>
    choose([
        "I'm trying my best! Please visit this link to provide feedback: https://l.matho.me/mathobot/",
        'stupid human',
        "I didn't understand that, can you please try again",
        'Says you',
        "I'd like to see you do better",
    ])
)
    .desc("Pretend you're smarter than me")
    .isPhrase();
