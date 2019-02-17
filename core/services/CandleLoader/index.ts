import Candle from '../../models/Candle';
import config from '../../../config';
import jsonfile from 'jsonfile';
import { CandleSetInterface, CandleSetSymbol, CandleSetTimeFrame } from '../../interfaces/CandleSetInterface';
import $ from '../Helpers';

function getCandlesFilesPath(symbol: string, candleSize: string): string {
    return `./storage/history/${config.candleFiles.folder}/${symbol}/${config.candleFiles.date}/${candleSize}.json`;
}

const candleSet: CandleSetInterface = {
    symbols: []
};

if (! $.isLiveTrading()) {
    config.symbolsToConsider.forEach(symbol => {
        let candleSetItem: CandleSetSymbol = {
            symbol,
            timeFrames: []
        };
    
        config.timeFramesToConsider.forEach(timeFrame => {
            // just get 1m candles for now. 
            if (timeFrame !== '1m') return;

            let candlesTemp = [];
            let candleSetTimeFrame: CandleSetTimeFrame = {
                timeFrame,
                candles: []
            };
    
            try {
                candlesTemp = jsonfile.readFileSync(getCandlesFilesPath(symbol, timeFrame));
            } catch (error) {
                if ($.isBackTesting()) $.hardError(`No such candle files founded for ${symbol}:${timeFrame}`);
            }
    
            candlesTemp.forEach(item => {
                candleSetTimeFrame.candles.push(
                    new Candle({
                        symbol: symbol, 
                        timeFrame: timeFrame, 
                        timestamp: item.timestamp,
                        open: item.open,
                        close: item.close,
                        high: item.high,
                        low: item.low,
                        volume: item.volume
                    })
                );
            });
    
            candleSetItem.timeFrames.push(candleSetTimeFrame);
        });
    
        candleSet.symbols.push(candleSetItem);
    });
}

export default candleSet;
