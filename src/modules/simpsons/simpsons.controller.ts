import {
    after,
    aliases,
    before,
    cmd,
    Controller,
    group,
    kwarg,
    Kwargs,
    Message,
} from 'core';
import { lpad } from 'core/util';
import SimpsonsService, { isError } from './simpsons.service';

@group('simpsons')
export default class SimpsonsController extends Controller {
    @before
    before(message: Message) {
        try {
            message.addReaction('dohnut');
        } catch {}
    }

    @after
    after(message: Message) {
        try {
            message.removeReaction('dohnut');
        } catch {}
    }

    @cmd('snippet', 'Generate a GIF snippet of a Simpsons quote')
    @aliases('gif', 'g', 'snip')
    @kwarg(['term', 't'], 'Search term - use [...] to specify gaps')
    @kwarg(['type', 'f'], 'File type (gif, mp4, or webm)')
    @kwarg(['offset', 'o'], 'Shift quote timings (seconds)')
    @kwarg(['extend', 'e'], 'Extend end of snippet (seconds)')
    @kwarg(['resolution', 'r'], 'Snippet final resolution (pixels)')
    async snippet(
        message: Message,
        kwargs: Kwargs,
        service: SimpsonsService,
        ...term: string[]
    ) {
        try {
            const snippetData = await service.fetchSnippet({
                term: term.join(''),
                type: kwargs.get('type'),
                offset: Number(kwargs.get('offset')),
                extend: Number(kwargs.get('extend')),
                resolution: Number(kwargs.get('resolution')),
            });

            if (isError(snippetData)) {
                return message.replyEphemeral(snippetData.error);
            }

            const quoteData = await service.fetchQuote({
                term: term.join(''),
            });

            if (isError(quoteData)) {
                return message.replyEphemeral(quoteData.error);
            }

            const { meta } = quoteData.data;
            await message.reply(
                `*S${lpad(meta.seasonNumber.toString(), 2, '0')}E${lpad(
                    meta.episodeInSeason.toString(),
                    2,
                    '0'
                )}: ${meta.episodeTitle}*\n${snippetData.data.url}`
            );
        } catch (e) {
            console.error(e);
        }
    }

    @cmd('quote', 'Search Simpsons quotes')
    @aliases('q', 'search')
    @kwarg(['term', 't'], 'Search term - use [...] to specify gaps')
    @kwarg(['match', 'm'], 'Match number')
    @kwarg(['padding', 'p'], 'Extra lines to return before & after quote')
    async quote(
        message: Message,
        kwargs: Kwargs,
        service: SimpsonsService,
        ...term: string[]
    ) {
        const data = await service.fetchQuote({
            term: term.join(''),
            match: Number(kwargs.get('match')),
            padding: Number(kwargs.get('padding')),
        });

        if (isError(data)) {
            return message.replyEphemeral(data.error);
        }

        const {
            meta,
            matches: { before, lines, after },
        } = data.data;
        const excerpt = [
            ...before.map(q => q.text),
            ...lines.map(q => `*${q.text}*`),
            ...after.map(q => q.text),
        ];
        await message.reply(
            `*S${lpad(meta.seasonNumber.toString(), 2, '0')}E${lpad(
                meta.episodeInSeason.toString(),
                2,
                '0'
            )}: ${meta.episodeTitle}*\n${excerpt.join('\n')}`
        );
    }
}
