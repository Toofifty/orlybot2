import { Command } from 'core/commands';
import CrosswordGenerator from './generate';

/**
 * Modes:
 * - definition: clues are definitions
 * - synonyms: clues are a synonym
 * - members: clues are members of the word
 */

export const custom = Command.sub(
    'custom',
    async (message, [size = '10', mode = 'random']) => {}
).desc('Generate a custom ');

export const testCustom = Command.sub(
    't',
    async (message, [diff = 'easy', size = '10', _words = '10']) => {
        const width = Number(size.split('x')[0]);
        const height = Number(size.split('x')[1] ?? width);
        const words = Number(_words);
        const generator = new CrosswordGenerator(width, height, words);
        generator.setDifficulty(diff as any);
        const corners = await generator.fetchCorners();
        return corners.map(c => c?.word).join(', ');
    }
);
