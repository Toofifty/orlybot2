import { promisify } from 'util';
import * as fs from 'fs';

export const readfile = promisify(fs.readFile);
export const writefile = promisify(fs.writeFile);
export const fileExists = promisify(fs.exists);
export const mkdir = promisify(fs.mkdir);
