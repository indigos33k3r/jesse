import store, { selectors } from '../../store';
import $ from '../Helpers';
import JI from 'jesse-indicators';
import Candle from '../../models/Candle';

interface EMA {
    period: number;
    timeFrame: string;
    symbol: string;
    value: number;
    candle: Candle;
}

class Indicators {
    // because we can have more than one EMA
    lastEMAs: EMA[] = [];

    EMA(
        period: number,
        symbol: string = store.getState().config.tradingSymbol,
        timeFrame: string = store.getState().config.tradingTimeFrame
    ): number {
        const lastCandle: Candle = selectors.getCurrentCandleFor(symbol, timeFrame);
        let lastEMA: EMA = this.lastEMAs.find(item => item.period === period && item.symbol === symbol && item.timeFrame === timeFrame);

        if ($.isDefined(lastEMA)) {
            if (lastEMA.candle.timestamp === lastCandle.timestamp) {
                return lastEMA.value;
            }

            lastEMA.candle = lastCandle;
            lastEMA.value = JI.quickEMA(lastCandle.close, period, lastEMA.value);
            return lastEMA.value;
        }

        let EMA: number = JI.EMA($.pluckCandles(selectors.getCandlesFor(symbol, timeFrame), 'close'), period);

        this.lastEMAs.push({
            period,
            value: EMA,
            candle: lastCandle, 
            symbol, 
            timeFrame
        });

        return EMA;
    }

    SMA(
        period: number,
        symbol: string = store.getState().config.tradingSymbol,
        timeFrame: string = store.getState().config.tradingTimeFrame
    ): number {
        return JI.SMA($.pluckCandles(selectors.getCandlesFor(symbol, timeFrame), 'close'), period);
    }
}

export default Indicators;
