import { UserError } from 'core/commands';
import { tokenize } from 'core/util';

export type Match = [string, string]; //[full: string, short: string];
export type KwargDefinition = { key: Match; description: string };

/**
 * Contains bash-like keyword arguments used in the command.
 */
export default class Kwargs {
    constructor(
        private args: Record<string, string>,
        private flags: string[]
    ) {}

    /**
     * Remove kwargs from a string, and parse them into a Kwargs object
     */
    public static parse(
        message: string,
        keywords: Match[],
        flags: Match[]
    ): { kwargs: Kwargs; message: string } {
        const kwargs: Record<string, string> = {};
        const kwflags: string[] = [];

        const tokens = tokenize(message);

        for (let idx = 0; idx < tokens.length; idx++) {
            const token = tokens[idx];
            if (token.startsWith('--')) {
                // if flag, remove and continue
                const key = token.substring(2);
                const flag = flags.find(([full]) => key === full);
                if (flag) {
                    kwflags.push(flag[0]);
                    tokens.splice(idx, 1);
                    idx--;
                    continue;
                }

                const keyword = keywords.find(([full]) => key === full);
                if (keyword) {
                    if (idx < tokens.length) {
                        kwargs[keyword[0]] = tokens[idx + 1];
                    }
                    tokens.splice(idx, 2);
                    idx--;
                    continue;
                }

                throw new UserError(
                    `Unrecognised argument: ${key}. Valid arguments are: ${[
                        ...flags,
                        ...keywords,
                    ].join(', ')}`
                );
            } else if (token.startsWith('-')) {
                const shortKeys = token.substring(1).split('');

                for (let shortKey of shortKeys) {
                    const flag = flags.find(([, short]) => shortKey === short);
                    if (flag) {
                        kwflags.push(flag[0]);
                        continue;
                    }

                    const keyword = keywords.find(
                        ([, short]) => shortKey === short
                    );
                    if (keyword) {
                        if (idx < tokens.length) {
                            kwargs[keyword[0]] = tokens[idx + 1];
                            tokens.splice(idx + 1, 1);
                            idx--;
                        }
                        continue;
                    }

                    throw new UserError(`Unrecognised argument: ${shortKey}`);
                }

                tokens.splice(idx, 1);
            }
        }

        return {
            kwargs: new Kwargs(kwargs, kwflags),
            message: `"${tokens.join('" "')}"`,
        };
    }

    public empty() {
        return Object.keys(this.args).length === 0 && this.flags.length === 0;
    }

    /**
     * Get a keyword arg
     */
    public get(key: string): string | undefined {
        return this.args[key];
    }

    public getMany<T extends string>(...keys: T[]) {
        return keys.reduce(
            (prev, key) => ({ ...prev, [key]: this.get(key) }),
            {} as Record<T, string>
        );
    }

    /**
     * Check if a flag was provided
     */
    public has(key: string) {
        return this.flags.includes(key);
    }
}
