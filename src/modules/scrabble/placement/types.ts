import { Position } from '../types';

/**
 * Word placement position - including the direction
 */
export interface WordPosition extends Position {
    dir: 'down' | 'across';
}

/**
 * Integer coordinates
 */
export interface Coords {
    x: number;
    y: number;
}
