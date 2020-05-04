import { CrosswordData } from './types';

export const render = (
    { size, gridnums, grid }: CrosswordData,
    filled: string[] = []
) => {
    const box = (x: number, y: number) => {
        if (x < 0 || x > size.cols - 1 || y < 0 || y > size.rows - 1)
            return false;
        return grid[y * size.cols + x] !== '.';
    };
    let result = '';
    for (let y = 0; y < size.rows + 1; y++) {
        let lineNumbers = '';
        let lineLetters = '';
        for (let x = 0; x < size.cols + 1; x++) {
            // position in crossword array
            const pos = y * size.cols + x;
            if (!box(x, y)) {
                // blank
                // if prev not blank, cap it
                let c = ' ';
                let top = '   ';
                let l = ' ';
                if (box(x - 1, y)) {
                    c = '┐';
                    l = '│';
                    if (box(x - 1, y - 1)) {
                        c = '┤';
                    }
                    if (box(x, y - 1)) {
                        c = '┼';
                        top = '───';
                    }
                } else if (box(x, y - 1)) {
                    c = '└';
                    top = '───';
                    if (box(x - 1, y - 1)) {
                        c = '┴';
                    }
                } else {
                    if (box(x - 1, y - 1)) {
                        c = '┘';
                    }
                }
                lineNumbers += `${c}${top}`;
                lineLetters += `${l}   `;
            } else {
                // just letter - will always have one before it
                // check if x-0,1 y-1 is blank
                let c = '┌';
                if (box(x - 1, y)) {
                    c = '┬';
                    if (box(x, y - 1) || box(x - 1, y - 1)) {
                        c = '┼';
                    }
                } else {
                    // nothing to the left
                    // check directly above
                    if (box(x, y - 1)) {
                        c = '├';
                    }
                    // check above and to left
                    if (box(x - 1, y - 1)) {
                        c = '┼';
                    }
                }
                let top = gridnums[pos] ? gridnums[pos].toString() : '──';
                while (top.length < 3) top += '─';
                const char = filled[pos] || ' ';
                lineNumbers += `${c}${top}`;
                lineLetters += `| ${char} `;
            }
        }
        result += `${lineNumbers}\n${lineLetters}\n`;
    }
    return result;
};
