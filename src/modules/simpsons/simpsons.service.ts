import fetch from 'node-fetch';
import { camel } from 'core/util';

interface FetchQuoteOptions {
    term: string;
    match?: number;
    padding?: number;
}

interface FetchGifOptions {
    term?: string;
    type?: string;
    offset?: number;
    extend?: number;
    resolution?: number;
}

interface SimpsonsResponse<T> {
    status: number;
    responseTime: number;
    data: T;
}

interface SimpsonsErrorResponse {
    status: number;
    responseTime: number;
    error: string;
}

interface Subtitle {
    id: number;
    episodeId: number;
    timeBegin: string;
    timeEnd: string;
    text: string;
}

interface FetchQuoteResponse {
    meta: {
        matchNumber: number;
        totalMatches: number;
        seasonNumber: number;
        seasonTitle: string;
        episodeNumber: number;
        episodeTitle: string;
        episodeInSeason: number;
    };
    links: {};
    matches: {
        lines: Subtitle[];
        before: Subtitle[];
        after: Subtitle[];
    };
}

interface FetchSnippetResponse {
    url: string;
    renderTime: number;
    cached: boolean;
}

export const isError = (
    response: SimpsonsResponse<any> | SimpsonsErrorResponse
): response is SimpsonsErrorResponse => 'error' in response;

export default class SimpsonsService {
    private buildUrl(base: string, query: Record<string, any>) {
        const url = new URL(`https://simpsons-api.matho.me/v1/${base}`);
        // const url = new URL(`http://localhost:3312/v1/${base}`);
        Object.entries(query).forEach(([key, value]) => {
            if (
                value !== undefined &&
                !(typeof value === 'number' && isNaN(value))
            ) {
                url.searchParams.append(key, value.toString());
            }
        });
        return url.toString();
    }

    private async fetch<TResponse>(
        base: string,
        query: Record<string, any>
    ): Promise<SimpsonsResponse<TResponse> | SimpsonsErrorResponse> {
        return fetch(this.buildUrl(base, query))
            .then(res => res.json())
            .then(res => camel(res));
    }

    public async fetchQuote(options: FetchQuoteOptions) {
        return this.fetch<FetchQuoteResponse>('quote', options);
    }

    public async fetchSnippet({ type = 'gif', ...options }: FetchGifOptions) {
        return this.fetch<FetchSnippetResponse>(type, options);
    }
}
