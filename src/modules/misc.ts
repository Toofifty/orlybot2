import Command from 'core/commands/command';
import registry from 'core/commands/registry';
import { pre } from 'core/util';

Command.create('say')
    .do((message, args) => {
        message.reply(args.join(' '));
    })
    .desc('Repeat after me')
    .arg({ name: '...text', required: true });

Command.create('help')
    .do((message, args) => {
        const search = args.join(' ');
        const helpMessage =
            registry
                .all()
                .map(command => command.help)
                .filter(text => search.length === 0 || text.includes(search))
                .sort((a, b) => (a > b ? 1 : -1))
                .join('\n') || `Nothing found searching for "${search}"`;
        message.reply(pre(helpMessage));
    })
    .desc('Get some help')
    .arg({ name: '...search' });
