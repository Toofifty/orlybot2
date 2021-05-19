import { Position } from '../types';
import { Coords } from './types';

export const isPosition = (pos: Position | Coords): pos is Position =>
    typeof pos.x === 'string';

export const isCoords = (pos: Position | Coords): pos is Coords =>
    typeof pos.x === 'number';
