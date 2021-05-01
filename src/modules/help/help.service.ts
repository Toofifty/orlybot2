import { registry } from 'core';
import { flat, pre } from 'core/util';

export default class HelpService {
    getCommandKeywords() {
        return registry
            .all()
            .filter(cmd => !cmd.hidden)
            .map(({ keyword }) => keyword);
    }

    getFilteredHelpText(filter: string) {
        const matchingCommands = registry
            .all()
            .sort((a, b) => a.commandName.localeCompare(b.commandName))
            .filter(cmd => cmd.commandName.startsWith(filter) && !cmd.hidden);

        if (matchingCommands.length === 1) {
            const [cmd] = matchingCommands;

            if (cmd.groupDescription) {
                return `${cmd.groupDescription}\n\n${pre(cmd.help.join('\n'))}`;
            }
        }

        return pre(flat(matchingCommands.map(cmd => cmd.help)).join('\n'));
    }
}
