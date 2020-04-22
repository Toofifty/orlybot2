import he from 'he';

interface ApiQuestion {
    category: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

interface FetchQuestionOptions {
    categories: string[];
    difficulty: string;
}

const FETCH_AMOUNT = 10;

const acceptableQuestion = (categories: string[]) => (data: ApiQuestion) => {
    return categories.length === 0 || categories.includes(data.category);
};

const fetchQuestions = (
    options: FetchQuestionOptions
): Promise<ApiQuestion[]> =>
    fetch(
        `https://opentdb.com/api.php?amount=${FETCH_AMOUNT}&difficulty=${options.difficulty}`
    ).then(res => res.json());

const clean = (result: ApiQuestion) => ({
    question: he.decode(result.question),
    category: he.decode(result.category),
    correctAnswer: he.decode(result.correct_answer).trim(),
    incorrectAnswers: result.incorrect_answers.map(answer =>
        he.decode(answer).trim()
    ),
});

export const fetchQuestion = async (options: FetchQuestionOptions) => {
    let accepted: ApiQuestion[] = [];
    while (accepted.length === 0)
        accepted = (await fetchQuestions(options)).filter(
            acceptableQuestion(options.categories)
        );
    return clean(accepted[0]);
};
