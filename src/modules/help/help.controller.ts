import { aliases, cmd, Controller, flag, Kwargs, Message } from 'core';
import { columnise, pre } from 'core/util';
import HelpService from './help.service';

export default class HelpController extends Controller {
    @cmd('help', 'List commands and view command information')
    @aliases('h')
    @flag(['verbose', 'v'], 'Print extra information about the command.')
    list(
        message: Message,
        service: HelpService,
        kwargs: Kwargs,
        search?: string
    ) {
        console.log(kwargs);

        if (search) {
            const helpText = kwargs.has('verbose')
                ? service.getVerboseHelpText(search)
                : service.getHelpText(search);

            if (helpText === pre('')) {
                return message.reply(`Nothing found searching for "${search}"`);
            }

            return message.reply(helpText);
        }

        const keywords = service.getCommandKeywords();

        message.reply([
            "Here's a list of commands I know:",
            pre(columnise(keywords)),
            'You can see help for a specific command using `help <command>`',
        ]);
    }
}
