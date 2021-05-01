const DEFAULT_PARAMETERS = {
    temperature: 0.9,
    max_tokens: 50,
    top_p: 1,
    frequency_penalty: 0.9,
    presence_penalty: 0.8,
    stop: ['\n', 'Human:', 'AI:'],
};

const OPENAI_COMPLETIONS =
    'https://api.openai.com/v1/engines/davinci/completions';

const PROMPT_LENGTH = 6;
