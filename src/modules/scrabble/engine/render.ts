import { lpad, mention, pre, rpad } from 'core/util';
import ScrabbleStore from '../scrabble.store';
import { isGameInitialised } from '../typeguards';
import { PlayerData, ScrabbleBoard, WordScore } from '../types';
import { ALPHABET, BOARD_SIZE, TILE_SCORES } from './consts';

const COLUMNS = ALPHABET.slice(0, BOARD_SIZE).split('');
const ROW_FIRST = '\n   ┌' + '───┬'.repeat(BOARD_SIZE - 1) + '───┐\n';
const ROW_JOIN = '\n   ├' + '───┼'.repeat(BOARD_SIZE - 1) + '───┤\n';
const ROW_LAST = '\n   └' + '───┴'.repeat(BOARD_SIZE - 1) + '───┘\n';

export const renderGame = (store: ScrabbleStore) => {
    if (!isGameInitialised(store)) {
        throw new Error('Tried to render uninitialised game');
    }

    return (
        pre(renderBoard(store.board)) +
        '\n' +
        renderRules() +
        '\n' +
        `*Current turn*: ${mention(store.currentTurn)}` +
        '\n' +
        `*Tiles left*: ${store.tiles.length}`
    );
};

const renderRules = () =>
    `*Legend*\n${['word', 'letter']
        .map(type =>
            [2, 3]
                .map(
                    multiplier =>
                        `\`${premiumSquareIcon({
                            multiplier,
                            type,
                        })}\` = ${multiplier}x ${type} score`
                )
                .join('\n')
        )
        .join('\n')}`;

const premiumSquareIcon = ({
    multiplier,
    type,
}: {
    multiplier: number;
    type: string;
}) => {
    const id = `${multiplier}x${type.substr(0, 1).toUpperCase()}`;

    return (
        ' ' +
        {
            '3xW': '•',
            '2xW': '*',
            '3xL': '₃',
            '2xL': '₂',
        }[id] +
        ' '
    );
};

const renderTile = (
    board: ScrabbleBoard,
    x: number,
    y: number,
    tile: string | null
) => {
    const premiumSquare = board.premiumSquares.find(
        sq => sq.position.x === COLUMNS[x] && sq.position.y === y
    );

    if (!tile && premiumSquare) {
        return premiumSquareIcon(premiumSquare);
    }

    return ` ${tile ?? ' '} `;
};

export const renderBoard = (board: ScrabbleBoard) => {
    let y = 0;

    const rows = board.tiles.map(tileRow => {
        y++;
        const paddedY = y < 10 ? ` ${y}` : y;
        return `${paddedY} │${tileRow
            .map((tile, x) => renderTile(board, x, y, tile))
            .join('│')}│`;
    });

    return (
        '     ' +
        COLUMNS.join('   ') +
        ROW_FIRST +
        rows.join(ROW_JOIN) +
        ROW_LAST
    );
};

export const renderPlayerScore = (player: PlayerData) => {
    const scoredWords = player.records.reduce(
        (scored, record) => [
            ...scored,
            ...record.words.map(({ word, score }) => ({
                word: word !== record.mainWord ? `- ${word}` : word,
                score,
            })),
        ],
        [] as WordScore[]
    );

    // word column length
    const ww = scoredWords.reduce(
        (longest, { word }) => (word.length > longest.length ? word : longest),
        // must at least be longer than "total"
        'Total'
    ).length;
    // score column length
    const sw = 'Score'.length;

    const rows = [
        rpad('Word', ww) + ' | Score',
        '─'.repeat(ww) + '─┼─' + '─'.repeat(sw),
    ];

    scoredWords.forEach(({ score, word }) => {
        rows.push(`${rpad(word, ww)} | ${lpad(score.toString(), sw)}`);
    });

    rows.push('─'.repeat(ww) + '─┼─' + '─'.repeat(sw));
    rows.push(`${rpad('Total', ww)} | ${lpad(player.score.toString(), sw)}`);

    return `Scoresheet for ${mention(player.id)}` + '\n' + pre(rows.join('\n'));
};

const sub = (n: number) =>
    n >= 10
        ? n
              .toString()
              .split('')
              .map(sn => sub(+sn))
              .join('')
        : ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'][n];

const fmtTile = (tile: string) => (tile === ' ' ? '`_`' : `\`${tile}\``);

export const renderRack = (player: PlayerData) =>
    'Your current tiles:\n' +
    player.rack.map(tile => fmtTile(tile) + sub(TILE_SCORES[tile])).join(' | ');
