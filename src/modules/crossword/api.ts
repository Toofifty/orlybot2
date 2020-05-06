import fetch from 'node-fetch';
import { choose } from 'core/util';

type WordResponse = {
    word: string;
    results: {
        definition: string;
        partOfSpeech?: string;
        synonyms?: string[];
        typeOf?: string[];
        examples?: string[];
    }[];
};

const _fetch = (query: string) =>
    fetch(`https://wordsapiv1.p.rapidapi.com/words/${query}`, {
        headers: {
            'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        },
    }).then(res => res.json());

export const fetchRandomWord = async () => {
    let data: WordResponse = await _fetch('?random=true');

    while (!data.results) {
        // not a valid word - need to try again
        data = await _fetch('?random=true');
    }

    return {
        word: data.word,
        ...choose(data.results),
    };
};

type PatternOptions = {
    letters?: number;
    page?: number;
    limit?: number;
    hasDetails?: string;
    startWith?: string;
    letterPattern?: string;
    template?: string;
    frequencyMin?: number;
};

const VALID_PARAMS = [
    'letters',
    'page',
    'limit',
    'hasDetails',
    'letterPattern',
    'frequencyMin',
];

const BLANK = "[^d-']+";

type SearchResponse = {
    results: {
        total: number;
        data: string[];
    };
};

export const fetchWithPattern = async (options: PatternOptions) => {
    console.log(options);
    if (!options.letterPattern) {
        if (options.template) {
            options.letterPattern = `^${options.template.replace(
                /_/g,
                BLANK
            )}$`;
        } else if (options.startWith) {
            options.letterPattern = `^${options.startWith}`;
        } else {
            throw 'Invalid search pattern';
        }
    }

    options.hasDetails = options.hasDetails ?? 'memberOf';
    options.limit = options.limit ?? 100;

    const query = `?${Object.keys(options)
        .filter(key => VALID_PARAMS.includes(key))
        .map(key => `${key}=${options[key]}`)
        .join('&')}`;

    const data: SearchResponse = await _fetch(query);

    if (data.results.total === 0) {
        return undefined;
    }

    return { word: choose(data.results.data) };
};
