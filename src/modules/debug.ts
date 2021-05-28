import { Command } from 'core/commands';
import db from 'core/db';
import { pre } from 'core/util';

Command.create('debug')
    .nest(
        Command.sub('message', async (message, [attr]) =>
            pre(JSON.stringify(attr ? message[attr] : message, null, 2))
        )
            .desc('Get message data')
            .arg({ name: 'attribute' })
    )
    .nest(
        Command.sub('db')
            .nest(
                Command.sub('read', async (message, [key, attr]) => {
                    key = key.replace('$channel', message.channel.id);
                    const data = await db.get<any>(key);
                    return pre(JSON.stringify(attr ? data[attr] : data));
                })
                    .arg({ name: 'storage-key', required: true })
                    .arg({ name: 'attr' })
                    .desc(
                        'Read value from the database. Current channel can be interpolated with $channel.'
                    )
            )
            .desc('Database debugging tools')
    )
    .admin()
    .desc('Debugging tools');
