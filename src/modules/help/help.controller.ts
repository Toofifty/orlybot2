import { aliases, cmd, Controller, Message } from 'core';
import { chunk, pre } from 'core/util';
import HelpService from './help.service';

const HELP_TAB_WIDTH = 2;
const HELP_COLUMNS = 4;

export default class HelpController extends Controller {
    @cmd('help', 'List commands')
    @aliases('h', 'list', 'list-commands')
    list(message: Message, service: HelpService) {
        const keywords = service.getCommandKeywords();

        const columnWidth = keywords.reduce(
            (max, kw) => Math.max(max, kw.length),
            0
        );

        const chunks = chunk(keywords, HELP_COLUMNS);
        message.reply([
            "Here's a list of commands you can run:",
            pre(chunks.map(chunk => chunk.join('')).join('\n')),
        ]);
    }
}
