import fetch from 'node-fetch';
import { choose } from 'core/util';

const CATEGORIES = {
    Animals: 1,
    'Common animals': 56,
    Places: 4,
    Sports: 65,
    'Food and cooking': 2,
    Nature: 63,
    People: 3,
    'Around the house': 52,
    'Around the office': 53,
    Travel: 66,
    Colors: 55,
    'Dog breeds': 57,
    'Feelings and emotions': 59,
    'English literature': 58,
    Math: 61,
    Music: 62,
    Science: 64,
    Art: 54,
};

const wordCache: Record<string, string[]> = {};

export const fetchWord = async () => {
    const category = choose(Object.keys(CATEGORIES));

    if (!wordCache[category]) {
        wordCache[category] = await fetch(
            `https://www.thegamegal.com/wordgenerator/generator.php?game=1&category=${CATEGORIES[category]}`
        )
            .then(res => res.json())
            .then(res => res.words);
    }

    const word = choose(wordCache[category]);

    return { category, word };
};
