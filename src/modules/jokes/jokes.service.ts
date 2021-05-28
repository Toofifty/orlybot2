import fetch from 'node-fetch';

export class JokesService {
    async fetchJoke(): Promise<{ setup: string; punchline: string }> {
        return await fetch(
            'https://official-joke-api.appspot.com/random_joke'
        ).then(body => body.json());
    }

    async fetchDadJoke(): Promise<{ joke: string }> {
        return await fetch('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' },
        }).then(body => body.json());
    }
}
