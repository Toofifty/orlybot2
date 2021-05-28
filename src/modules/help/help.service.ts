import { registry } from 'core';
import { flat, pre } from 'core/util';

export default class HelpService {
    getCommandKeywords() {
        return registry
            .all()
            .filter(cmd => !cmd.hidden)
            .map(({ keyword }) => keyword);
    }

    getHelpText(filter: string) {
        const matchingCommands = this.getCommands(filter);

        if (matchingCommands.length === 1) {
            const [cmd] = matchingCommands;
            let msg = pre(cmd.help.join('\n'));

            if (cmd.groupDescription) {
                msg = `${cmd.groupDescription}\n\n${msg}`;
            }

            if (cmd.kwargKeywords.length > 0 || cmd.kwargFlags.length > 1) {
                msg = `${msg}\n\nThis command contains keyword args or flags. Use \`help ${cmd.keyword} -v\` to see them.`;
            }

            return msg;
        }

        return pre(flat(matchingCommands.map(cmd => cmd.help)).join('\n'));
    }

    getVerboseHelpText(filter: string) {
        const [cmd] = this.getCommands(filter);

        if (!cmd) {
            throw new Error('Could not find command.');
        }

        return cmd.verboseHelp.map(h => pre(h)).join('\n\n');
    }

    private getCommands(filter: string) {
        return registry
            .all()
            .sort((a, b) => a.commandName.localeCompare(b.commandName))
            .filter(cmd => cmd.commandName.startsWith(filter) && !cmd.hidden);
    }
}
