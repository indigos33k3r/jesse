export default interface HyperParameters {
    // how many candles to look back to specify the highest and lowest prices
    numberOfPreviousCandlesToLookBackForLongs: number;
    numberOfPreviousCandlesToLookBackForShorts: number;
    
    // what rate of position's size has to be exited at first exit: (example: 5/10, 3/10, 7/10, etc.)
    takeProfitRate: number;
    // trades with that don't meet this minimum PNL will be ignored. 
    minimumPnlPerTradeFilter: number;
};