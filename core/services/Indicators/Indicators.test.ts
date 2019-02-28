import JI from 'jesse-indicators';
import Indicators from '.';
import Candle from '../../models/Candle';
import fakeCandle from '../../models/factories/CandleFactory';
import store, { actions } from '../../store';
import { supportedSymbols, supportedTimeFrames } from '../../store/types';

beforeEach(() => {
    store.dispatch(actions.resetState());
    store.dispatch(actions.setTradingSymbol(supportedSymbols.ETHUSD));
    store.dispatch(actions.setTradingTimeFrame(supportedTimeFrames.fiveMinutes));

    // add candles for first symbol 
    const candle1: Candle = fakeCandle(supportedTimeFrames.fiveMinutes, supportedSymbols.ETHUSD);
    candle1.timestamp = '2016-10-29T00:00:00Z';
    candle1.close = 1;
    store.dispatch(actions.addCandle(candle1));
    const candle2: Candle = fakeCandle(supportedTimeFrames.fiveMinutes, supportedSymbols.ETHUSD);
    candle2.timestamp = '2016-10-29T00:05:00Z';
    candle2.close = 2;
    store.dispatch(actions.addCandle(candle2));
    const candle3: Candle = fakeCandle(supportedTimeFrames.fiveMinutes, supportedSymbols.ETHUSD);
    candle3.timestamp = '2016-10-29T00:10:00Z';
    candle3.close = 3;
    store.dispatch(actions.addCandle(candle3));
    
    // add candles for second symbol 
    const candle4: Candle = fakeCandle(supportedTimeFrames.fiveMinutes, supportedSymbols.BTCUSD);
    candle4.timestamp = '2016-10-29T00:00:00Z';
    candle4.close = 4;
    store.dispatch(actions.addCandle(candle4));
    const candle5: Candle = fakeCandle(supportedTimeFrames.fiveMinutes, supportedSymbols.BTCUSD);
    candle5.timestamp = '2016-10-29T00:05:00Z';
    candle5.close = 5;
    store.dispatch(actions.addCandle(candle5));
    const candle6: Candle = fakeCandle(supportedTimeFrames.fiveMinutes, supportedSymbols.BTCUSD);
    candle6.timestamp = '2016-10-29T00:10:00Z';
    candle6.close = 6;
    store.dispatch(actions.addCandle(candle6));
});

/*
|--------------------------------------------------------------------------
| Simple Moving Average (SMA)
|--------------------------------------------------------------------------
*/

it('Should work directly with the "jesse-indicators" package', () => {
    // prices of the candles in the store
    let prices1: number[] = [1, 2, 3];
    expect(JI.SMA(prices1, 3)).toBe(2);
    
    let prices2: number[] = [4, 5, 6];
    expect(JI.SMA(prices2, 3)).toBe(5);
});

it('Should return current SMA for currentTradingSymbol', () => {
    expect(Indicators.SMA(3)).toEqual(2);

    // current trading symbol 
    expect(Indicators.SMA(3, supportedSymbols.ETHUSD)).toEqual(2);
    expect(Indicators.SMA(3, undefined, supportedTimeFrames.fiveMinutes)).toEqual(2);

    expect(Indicators.SMA(3, supportedSymbols.BTCUSD)).toEqual(5);
    expect(Indicators.SMA(3, supportedSymbols.BTCUSD, supportedTimeFrames.fiveMinutes)).toEqual(5);
});

/*
|--------------------------------------------------------------------------
| Exponential Moving Average (EMA)
|--------------------------------------------------------------------------
*/

it('Should work directly with the "jesse-indicators"', () => {
    // prices of the candles in the store
    let prices1: number[] = [1, 2, 3];
    expect(JI.EMA(prices1, 3)).toBe(2);
    
    let prices2: number[] = [4, 5, 6];
    expect(JI.EMA(prices2, 3)).toBe(5);
});

it('Should return current EMA for currentTradingSymbol', () => {
    expect(Indicators.EMA(2)).toEqual(2.5);

    // current trading symbol 
    expect(Indicators.EMA(2, supportedSymbols.ETHUSD)).toEqual(2.5);
    expect(Indicators.EMA(2, undefined, supportedTimeFrames.fiveMinutes)).toEqual(2.5);

    expect(Indicators.EMA(2, supportedSymbols.BTCUSD)).toEqual(5.5);
    expect(Indicators.EMA(2, supportedSymbols.BTCUSD, supportedTimeFrames.fiveMinutes)).toEqual(5.5);
});