const createLogger = (level: string) => (...message: any[]) =>
    (console[level] ?? console.log)(
        `[${new Date().toISOString()}][bot:${level}]`,
        ...message
    );

export const log = createLogger('info');
export const loginfo = log;
export const logdebug = createLogger('debug');
export const logwarn = createLogger('warn');
export const logerror = createLogger('error');
