import fetch from 'node-fetch';

type WordResponse = {
    word: string;
    results: { definition: string; examples: string[] }[];
};

type InvalidResponse = {
    success: false;
    message: string;
};

const isInvalid = (data: any): data is InvalidResponse => {
    return data.success === false;
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
