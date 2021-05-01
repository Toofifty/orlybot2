import { aliases, cmd, Controller, Message } from 'core';
import { chunk, pre, rpad } from 'core/util';
import HelpService from './help.service';

const HELP_PADDING = 3;
const HELP_COLUMNS = 4;

export default class HelpController extends Controller {
    @cmd('help', 'List commands and view command information')
    @aliases('h')
    list(message: Message, service: HelpService, search?: string) {
        if (search) {
            const helpText = service.getFilteredHelpText(search);

            if (helpText === pre('')) {
                return message.reply(`Nothing found searching for "${search}"`);
            }

            return message.reply(helpText);
        }

        const keywords = service.getCommandKeywords();

        const columnWidth =
            keywords.reduce((max, kw) => Math.max(max, kw.length), 0) +
            HELP_PADDING;

        const chunks = chunk(keywords, HELP_COLUMNS);
        message.reply([
            "Here's a list of commands I know:",
            pre(
                chunks
                    .map(chunk =>
                        chunk.map(kw => rpad(kw, columnWidth)).join('')
                    )
                    .join('\n')
            ),
            'You can see help for a specific command using `help <command>`',
        ]);
    }
}
