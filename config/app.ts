export default {
    // The the starting balance of the wallet in USD:
    startingBalance: parseInt(process.env.STARTING_BALANCE),
    // If not, how many dollars should it use: 
    positionSize: parseInt(process.env.STARTING_BALANCE), 
    // Should it use all of account's balance for positions: 
    tradeWithWholeBalance: !!parseInt(process.env.COMPOUNDING_POSITION_SIZING), 
    
    // list of currencies to consider
    symbolsToConsider: process.env.SYMBOLS.split(','), 
    // The symbol to trade. We'll make this an array in the future. 
    symbolToTrade: process.env.TRADING_SYMBOL.toUpperCase(),

    // list of timeFrames to consider 
    timeFramesToConsider: process.env.TIMEFRAMES.split(','), 
    // Which candle type do you intend trade on: 
    timeFrameToTrade: process.env.TRADING_TIMEFRAME.toLowerCase(), 

    // Accepted values are: 'backtest', 'livetrade', 'fitness'.
    tradingMode: process.env.TRADING_MODE,

    // candle files for a single period of time
    candleFiles: {
        folder: 'BitFinex', 

        // [7 months] [training data]
        // date: '2018-03-22.2018-10-17'
        // [2 months] [testing data]
        // date: '2018-08-19.2018-10-17'
        // 2 hours period use for feature testing backTest
        date: '2019-01-11.2019-01-11'
    },

    // this would enable many console.log()s in the code, which are helpful for debugging. 
    debugMode: !!(parseInt(process.env.DEBUG_MODE)),

    // is it running in jest tests. This value is set inside 
    // jest files whenever running a jest test file. 
    isTesting: false, 
}