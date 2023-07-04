import { Command } from 'core/commands';
import { pre, choose, randint, emoji } from 'core/util';

Command.create('say', (_, args) => args.join(' '))
    .desc('Repeat after me')
    .arg({ name: '...text', required: true });

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

Command.create('bad bot', message =>
    choose([
        "I'm doing the best I can :(",
        'bad human',
        "I'm sorry :cry:",
        "I'm not even sorry",
        "I didn't understand that, can you please try again",
        'Why are you doing this to me?',
        'Why are you like this?',
        'Does it make you feel happy to insult a robot?',
        "Don't you have anything better to do?",
        'Stop yelling at a robot and get back to work, mate.',
        `bad ${message.user.tag}`,
    ])
)
    .desc('Boost your ego by yelling at a poor defenceless bot')
    .isPhrase();

Command.create('stupid bot', () =>
    choose([
        'stupid human',
        "I didn't understand that, can you please try again",
        'Says you',
        "I'd like to see you do better",
        'I know you are but what am I?',
    ])
)
    .desc("Pretend you're smarter than me")
    .isPhrase();
