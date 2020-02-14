import { Command, registry } from 'core/commands';
import { tag } from 'core/util';
import { exec } from 'child_process';

Command.create('commands')
    .alias('cmd')
    .desc('Manage commands')
    .nest(
        Command.sub('enable', (_, [keyword]) => {
            registry.enable(keyword);
            return `\`${keyword}\` enabled`;
        })
            .desc('Enable a command')
            .arg({ name: 'command', required: true })
            .admin()
    )
    .nest(
        Command.sub('disable', (_, [keyword]) => {
            registry.disable(keyword);
            return `\`${keyword}\` disabled`;
        })
            .desc('Disable a command')
            .arg({ name: 'command', required: true })
            .admin()
    )
    .nest(
        Command.sub(
            'show-disabled',
            () =>
                registry
                    .allDisabled()
                    .map(cmd => tag(cmd.keyword))
                    .join(',') || 'There are no disabled commands.'
        )
            .desc('Show all disabled commands')
            .admin()
    );

Command.create('dumpdb', () => {
    exec('');
}).hide();
