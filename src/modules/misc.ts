import { Command, registry } from 'core/commands';
import { pre, choose, randint, emoji } from 'core/util';
import { flat } from 'core/util/array';

Command.create('say', (_, args) => args.join(' '))
    .desc('Repeat after me')
    .arg({ name: '...text', required: true });

Command.create('help', (_, args) => {
    const search = args.join(' ');
    return pre(
        flat(
            registry
                .all()
                .map(command => command.help)
                .sort((a, b) => (a[0] > b[0] ? 1 : -1))
                .filter(
                    text =>
                        search.length === 0 || text.join('').includes(search)
                )
        ).join('\n') || `Nothing found searching for "${search}"`
    );
})
    .desc('Get some help')
    .arg({ name: '...search' })
    .alias('h');

Command.create('help-aliases', (_, args) => {
    const search = args.join(' ');
    return pre(
        flat(
            registry
                .all()
                .map(command => command.helpWithAliases)
                .sort((a, b) => (a[0] > b[0] ? 1 : -1))
                .filter(
                    text =>
                        search.length === 0 || text.join('').includes(search)
                )
        ).join('\n') || `Nothing found searching for "${search}"`
    );
})
    .desc('Get some help, and show command aliases')
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

Command.create('good bot', () =>
    choose(['Thanks :heart:', 'Cheers!', ':heart_eyes:', 'Thanks!'])
)
    .desc('Thank me')
    .isPhrase();

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
