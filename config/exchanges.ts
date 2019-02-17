export default {
    // The exchange market we're trading in. Used in for http and websocket requests.
    marketToTradeIn: process.env.EXCHANGE,

    // trading fee (in percent) per order. In our backTests, we always consider ourselves as the take
    tradingFee: parseFloat(process.env.FEE), 

    // API keys and secrets of exchanges.
    exchanges: {
        Bitfinex: {
            baseURL: process.env.BITFINEX_URL,
            apiKey: process.env.BITFINEX_API_KEY,
            apiSecret: process.env.BITFINEX_API_SECRET,
        }, 
    },
}