import fetch from 'node-fetch';

export type WordResponse = {
    word: string;
    results: {
        definition: string;
        examples: string[];
        synonyms: string[];
        typeOf: string[];
    }[];
};

type InvalidResponse = {
    success: false;
    message: string;
};

const isInvalid = (data: any): data is InvalidResponse => {
    return data.success === false || data.word === undefined;
};

export const fetchWord = async (word: string) => {
    const data: WordResponse | InvalidResponse = await fetch(
        `https://wordsapiv1.p.rapidapi.com/words/${word}`,
        {
            headers: {
                'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
            },
        }
    ).then(res => res.json());

    if (isInvalid(data)) {
        return undefined;
    }

    return data;
};

export const fetchBest = async (letters: string) => {
    const data: any = await fetch(
        `http://www.anagramica.com/best/${letters}`
    ).then(res => res.json());
    if (data.best) return data.best[0];
    return undefined;
};

export const fetchRandom = async (length: number): Promise<WordResponse> => {
    const data: WordResponse | InvalidResponse = await fetch(
        `https://wordsapiv1.p.rapidapi.com/words/?random=true&letterPattern=%5E%5Cw%2B%24&letters=${length}`,
        {
            headers: {
                'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
            },
        }
    ).then(res => res.json());

    if (isInvalid(data)) throw new Error('Failed to fetch random word');

    if (!data.results?.length) {
        return fetchRandom(length);
    }

    return data;
};
