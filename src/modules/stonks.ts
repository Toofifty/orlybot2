import fetch from 'node-fetch';
import { Command } from 'core/commands';

type Amount = {
    raw: number;
    fmt: string;
    longFmt?: string;
};

type StonkSummary = {
    price: {
        quoteSourceName: string;
        regularMarketPrice: Amount;
        regularMarketOpen: Amount;
        regularMarketChange: Amount;
        regularMarketChangePercent: Amount;
        regularMarketPreviousClose: Amount;
        regularMarketDayHigh: Amount;
        regularMarketDayLow: Amount;
        regularMarketVolume: Amount;
        regularMarketTime: string;
        postMarketPrice: Amount;
        postMarketChange: Amount;
        postMarketChangePercent: Amount;
        postMarketTime: string;
        exchange: string;
        symbol: string;
        shortName: string;
        currency: string;
        currencySymbol: string;
    };
};

const fmt = (
    amount: Amount,
    { currency, currencySymbol }: { currency: string; currencySymbol: string }
) => `${currency}${currencySymbol} ${amount.fmt}`;

const fmtDate = (date: string) => new Date(+date).toLocaleTimeString();

const fetchSummary = (
    symbol: string,
    region: string = 'US'
): Promise<StonkSummary> =>
    fetch(
        `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary?symbol=${symbol}&region=${region}`,
        {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
                'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com',
            },
        }
    ).then(res => res.json());

Command.create('stonks', async (message, [symbol, region = 'US']) => {
    if (!symbol) throw new Error('Stock symbol is required');

    message.replyEphemeral(`Looking up symbol ${symbol}, one moment...`);

    const { price } = await fetchSummary(symbol, region);

    message.reply('', {
        attachments: [
            {
                title: `${price.shortName} (${price.symbol})`,
                pretext: `This is what I found from ${price.exchange}`,
                title_link: `https://finance.yahoo.com/quote/${symbol}/`,
                thumb_url:
                    'https://s.yimg.com/cv/apiv2/social/images/yahoo_default_logo.png',
                text: `Volume: ${price.regularMarketVolume.fmt}`,
                fields: [
                    {
                        title: `Market (${fmtDate(price.regularMarketTime)})`,
                        value: `${fmt(price.regularMarketPrice, price)} *${
                            price.regularMarketChange.fmt
                        } (${price.regularMarketChangePercent.fmt})*`,
                        short: true,
                    },
                    {
                        title: `Post market (${fmtDate(price.postMarketTime)})`,
                        value: `${fmt(price.postMarketPrice, price)} *${
                            price.postMarketChange.fmt
                        } (${price.postMarketChangePercent.fmt})*`,
                        short: true,
                    },
                    {
                        title: 'Open',
                        value: `${fmt(price.regularMarketOpen, price)}`,
                        short: true,
                    },
                    {
                        title: 'Previous close',
                        value: `${fmt(
                            price.regularMarketPreviousClose,
                            price
                        )}`,
                        short: true,
                    },
                    {
                        title: 'High (day)',
                        value: `${fmt(price.regularMarketDayHigh, price)}`,
                        short: true,
                    },
                    {
                        title: 'Low (day)',
                        value: `${fmt(price.regularMarketDayLow, price)}`,
                        short: true,
                    },
                ],
            },
        ],
    });
})
    .desc('Check stonk prices')
    .arg({ name: 'symbol', required: true })
    .arg({ name: 'region', def: 'US' })
    .alias('stonk', 'stock', 'stocks');
