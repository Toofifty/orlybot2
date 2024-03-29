import fetch from 'node-fetch';
import { Command } from 'core/commands';
import { pre, mention } from 'core/util';
import BotMessage from 'core/model/bot-message';
import Message from 'core/model/message';
import { load, update } from './data';
import { CrosswordData } from './types';
import { render, renderAcross, renderDown } from './render';

/**
 * Plan
 *
 * `crossword [day]` - begin a new crossword in the channel
 * `crossword print` - print current crossword
 * `crossword enable-reject` - reject incorrect answers
 * `crossword check` - validate solution
 * `crossword clear <n> <direction>` - clear a word
 * `crossword scoreboard` - get all-time scores
 *
 * - Player starts new game with `crossword`
 * - Players can guess with "<n> <direction> <word>" ("1 across red")
 * - Players score increases for correct word (+length?)
 * - If reject incorrect is enabled, any incorrect answers are immediately
 *   told they are wrong
 * - If not
 *   - Incorrect length words are immediately rejected
 *   - Correct length words are placed into the puzzle (even if wrong)
 * - A player uses `crossword check` to check if the solution is correct
 *   - If correct: game over, points awarded
 *   - If not: Tell the players which ones are not correct and clear them
 */

const printGame = async (
    message: Message,
    crossword: CrosswordData,
    complete?: {
        across: number[];
        down: number[];
    },
    filled?: string[]
) => {
    const game = await message.reply(pre(render(crossword, filled)));

    game.pin();
    const acrossClues = await game.replyInThread(
        renderAcross(
            crossword.clues.across,
            crossword.answers.across,
            complete?.across ?? []
        )
    );
    const downClues = await game.replyInThread(
        renderDown(
            crossword.clues.down,
            crossword.answers.down,
            complete?.down ?? []
        )
    );

    game.children = [acrossClues, downClues];
    await update(message.channel, () => ({
        gameMessage: game.serialize(),
    }));
};

Command.create('crossword', async (message, [n, dir, word]) => {
    const { crossword, complete } = await load(message.channel);

    if (n && (n.includes('a') || n.includes('d'))) {
        word = dir;
        dir = n.includes('a') ? 'across' : 'down';
        n = n.split(/a|d/)[0];
    }

    if (!n && !crossword) {
        throw 'This command is for submitting crossword answers - to begin a crossword, use `crossword nyt`.';
    }

    if (!crossword) {
        throw "There's no crossword running at the moment.";
    }

    if (!word || !['across', 'down', 'a', 'd'].includes(dir.toLowerCase())) {
        throw 'Example usage: `crossword 17 across steamtrain`';
    }

    const direction = dir.startsWith('a') ? 'across' : 'down';

    const answerIndex = crossword.clues[direction].findIndex(clue =>
        clue.startsWith(`${n}.`)
    );

    if (answerIndex === -1) {
        throw `Couldn't find a clue for ${n} ${direction}`;
    }

    const answer = crossword.answers[direction][answerIndex];

    if (word.length > answer.length) {
        throw 'Your word has too many letters';
    }

    if (word.length < answer.length) {
        throw 'Your word doesn\'t have enough letters';
    }

    if (answer.toLowerCase() !== word.toLowerCase()) {
        message.addReaction('x');
        return;
    }

    // TODO: check if word is already in the grid
    if (complete?.[direction].includes(answerIndex)) {
        message.addReaction('eyes');
        return;
    }

    // check
    message.addReaction('white_check_mark');

    // add points
    message.user.meta(
        'crossword_correct',
        (total?: number) => (total ?? 0) + 1
    );

    // add to game
    await update(message.channel, store => {
        // add to grid
        const { cols, rows } = store.crossword!.size;
        const grid = store.grid ?? Array(cols * rows).fill(' ');

        const start = store.crossword!.gridnums.indexOf(Number(n));
        if (direction === 'across') {
            word.toUpperCase()
                .split('')
                .forEach((c, i) => {
                    grid[start + i] = c;
                });
        } else {
            word.toUpperCase()
                .split('')
                .forEach((c, i) => {
                    grid[start + i * cols] = c;
                });
        }

        // add to completed list
        const complete = store.complete ?? { across: [], down: [] };
        const correct = store.contributors?.[message.user.id] ?? 0;

        return {
            grid,
            complete: {
                ...complete,
                [direction]: [...complete[direction], answerIndex],
            },
            contributors: {
                ...(store.contributors ?? {}),
                [message.user.id]: correct + 1,
            },
        };
    });

    // update crossword
    const {
        grid,
        gameMessage,
        crossword: updatedCrossword,
        contributors,
        complete: completed,
    } = await load(message.channel);
    const game = await BotMessage.from(gameMessage);
    game.edit(pre(render(updatedCrossword!, grid)));

    if (direction === 'across') {
        const acrossComment = await BotMessage.from(game.children[0]);
        acrossComment.edit(
            renderAcross(
                updatedCrossword!.clues.across,
                updatedCrossword!.answers.across,
                completed?.across ?? []
            )
        );
    }

    if (direction === 'down') {
        const downComment = await BotMessage.from(game.children[1]);
        downComment.edit(
            renderDown(
                updatedCrossword!.clues.down,
                updatedCrossword!.answers.down,
                completed?.down ?? []
            )
        );
    }

    // check for finish
    if (
        updatedCrossword!.grid.join('').replace(/\./g, '').length <=
        grid.join('').replace(/ /g, '').length
    ) {
        await message.reply('Game over! Well done to all who contributed!');
        const contributions = Object.keys(contributors ?? {})
            .map(ct => ({
                user: ct,
                score: contributors![ct],
            }))
            .sort((a, b) => (a.score < b.score ? 1 : 0));
        message.reply(
            `${contributions
                .map(c => `${mention(c.user)} (*+${c.score}*)`)
                .join('\n')}`
        );

        game.unpin();
        game.addReaction('white_check_mark');

        update(message.channel, () => ({
            crossword: undefined,
            contributors: undefined,
            complete: undefined,
            grid: undefined,
            gameMessage: undefined,
        }));
    }
})
    .desc('Submit a word in the crossword game')
    .alias('cw')
    .nest(
        Command.sub('nyt', async (message, [dow = 'monday']) => {
            const { crossword } = await load(message.channel);

            if (crossword) {
                message.replyEphemeral(
                    'There is already a crossword running. Use `crossword print` to print it out again.'
                );
                return;
            }

            message.replyEphemeral('Fetching NYT crossword, hold on...');

            const data: CrosswordData = await fetch(
                `https://www.xwordinfo.com/JSON/Data.ashx?format=text&date=random&dow=${dow}`,
                {
                    headers: {
                        Referer: 'https://www.xwordinfo.com/JSON/Sample2',
                    },
                }
            ).then(res => res.json());

            update(message.channel, () => ({ crossword: data }));

            const { complete } = await load(message.channel);

            await printGame(message, data, complete);
        })
            .desc('Start a crossword from The New York Times (hard)')
            .arg({ name: 'dow', def: 'monday' })
    )
    .nest(
        Command.sub('print', async message => {
            const { crossword, complete, gameMessage, grid } = await load(
                message.channel
            );

            if (!crossword) {
                throw "There's no crossword running at the moment.";
            }

            if (gameMessage) {
                const oldGame = await BotMessage.from(gameMessage);
                oldGame.unpin();
            }

            await printGame(message, crossword, complete, grid);
        }).desc('Post the latest crossword again')
    )
    .nest(
        Command.sub('status', async message => {
            const { crossword, grid } = await load(message.channel);
            const needed = crossword!.grid.join('').replace(/\./g, '').length;
            const solved = grid.join('').replace(/ /g, '').length;

            return `The crossword is ${((100 * solved) / needed).toFixed(
                0
            )}% complete.`;
        }).desc('Get completion status of the latest crossword')
    )
    .nest(
        Command.sub('cancel', async message => {
            await update(message.channel, () => ({
                crossword: undefined,
                contributors: undefined,
                complete: undefined,
                grid: undefined,
                gameMessage: undefined,
            }));
            return 'Crossword cancelled :(';
        }).desc('Cancel the current crossword puzzle')
    );
