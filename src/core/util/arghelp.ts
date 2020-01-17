import { CommandArgument } from 'core/commands/types';
/**
 * Stringify an argument for printing in the help command
 */
const arghelp = ({ required, name, def }: CommandArgument) =>
    `${required ? '<' : '['}` +
    `${name}${def !== undefined ? `=${JSON.stringify(def)}` : ''}` +
    `${required ? '>' : ']'}`;

export default arghelp;
