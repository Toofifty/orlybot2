import fetch from 'node-fetch';

export class JokesService {
    async fetchJoke(): Promise<{ setup: string; punchline: string }> {
        return await fetch(
            'https://official-joke-api.appspot.com/random_joke'
        ).then(body => body.json());
    }
}
