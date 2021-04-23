const getParameters = (func: string): string[] => {
    return func
        .replace(/[/][/].*$/gm, '')
        .replace(/\s+/g, '')
        .replace(/[/][*][^/*]*[*][/]/g, '')
        .split('){', 1)[0]
        .replace(/^[^(]*[(]/, '')
        .split(',')
        .filter(Boolean);
};

export const args: ParameterDecorator = (target, property, index) => {
    const parameters = getParameters(target[property].toString());
    const [, arg, def] =
        parameters[index].match(/((?:\.\.\.)?\w+)(?:='(.*)')?/) ?? [];
    console.log(parameters, arg, def);
};
