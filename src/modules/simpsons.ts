import fetch from 'node-fetch';
import { Command } from 'core/commands';

Command.create(
    'simpsons',
    () =>
        'Use `simpsons quote <term> [options]` to get a script excerpt, of `simpsons gif [term] [options]` to generate a gif'
)
    .alias('s')
    .desc('Simpsons API')
    .nest(
        Command.sub('quote', async (message, [term, ...args]) => {
            const data = await fetch(
                `https://simpsons-api.matho.me/quote?term=${term}&${args.join(
                    '&'
                )}`
            ).then(res => res.json());
            if (data.status !== 200) {
                throw `${data.status} error: ${data.error}`;
            }
            const { data: meta, lines, before, after } = data.data.best;
            const excerpt = [...before, ...lines, ...after];
            message.reply(
                `${meta.season} Episode ${meta.episode_in_season}: *${
                    meta.episode_title
                }*${meta.snap ? ` (${meta.snap})` : ''}`
            );
            message.replyEphemeral(
                `First: ${excerpt[0].id}, Target: ${lines[0].id}, Last: ${
                    excerpt[excerpt.length - 1].id
                }`
            );
            message.reply(excerpt.map(quote => quote.text).join('\n'));
        })
            .alias('q')
            .desc('Get a script excerpt matching the given search term')
            .arg({ name: 'term', required: true })
            .arg({ name: '...options' })
    )
    .nest(
        Command.sub('gif', async (message, args) => {
            if (args.length === 1) {
                args[0] = `term=${args[0]}`;
            }
            const data = await fetch(
                `https://simpsons-api.matho.me/gif?${args.join('&')}`
            ).then(res => res.json());
            if (data.status !== 200) {
                throw `${data.status} error: ${data.error}`;
            }
            message.reply(data.data.url);
        })
            .alias('g')
            .desc('Generate a gif snippet from the Simpsons')
            .arg({ name: 'term', required: false })
            .arg({ name: '...options' })
    );
