import chalk from 'chalk';

const levelColor = {
    info: 'white',
    debug: 'blue',
    warn: 'yellow',
    error: 'red',
};

const time = () => `[${chalk.white(new Date().toISOString())}]`;
const type = (level: string) => `[${chalk[levelColor[level]](level)}]`;

const createLogger = (level: string) => (...message: any[]) =>
    (console[level] ?? console.log)(
        chalk.gray(`${time()}${type(level)}`),
        ...message
    );

export const log = createLogger('info');
export const loginfo = log;
export const logdebug = createLogger('debug');
export const logwarn = createLogger('warn');
export const logerror = createLogger('error');
