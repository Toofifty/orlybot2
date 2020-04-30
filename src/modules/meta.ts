import { Command, registry } from 'core/commands';
import { tag } from 'core/util';
import { exec } from 'child_process';

Command.create('cmd')
    .alias('commands')
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
    )
    .admin()
    .hide();

Command.create('reboot', message => {
    message.reply('Rebooting!');
    exec('pm2 restart mathobot');
})
    .admin()
    .hide();
