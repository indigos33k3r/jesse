import store, { actions, selectors } from '../store';
import Candle from '../models/Candle';
import $ from '../services/Helpers';
import { supportedSymbols, supportedTimeFrames } from '../store/types';
import fakeCandle from '../models/factories/CandleFactory';
import _ from 'lodash';
import config from '../../config';

beforeEach(() => {
    store.dispatch(actions.resetState());
});

it('should add candle. Should add if new, update if already exists', () => {
    const candle: Candle = new Candle({
        symbol: supportedSymbols.BTCUSD,
        timeFrame: '1m',
        timestamp: $.transformTimestamp(1543387200000),
        open: 117.31,
        close: 117.27,
        high: 117.31,
        low: 117.17,
        volume: 195.88077825
    });
    store.dispatch(actions.addCandle(candle));
    expect(store.getState().candles).toEqual({
        symbols: [
            {
                symbol: supportedSymbols.BTCUSD,
                timeFrames: [
                    {
                        timeFrame: '1m',
                        candles: [candle]
                    }
                ]
            }
        ]
    });

    // add the same candle, expect the same result (and not two candles)
    store.dispatch(actions.addCandle(candle));
    expect(store.getState().candles).toEqual({
        symbols: [
            {
                symbol: supportedSymbols.BTCUSD,
                timeFrames: [
                    {
                        timeFrame: '1m',
                        candles: [candle]
                    }
                ]
            }
        ]
    });

    const updatedCandle: Candle = new Candle({
        symbol: supportedSymbols.BTCUSD,
        timeFrame: '1m',
        timestamp: $.transformTimestamp(1543387200000),
        open: 117.31,
        close: 127.27,
        high: 127.31,
        low: 117.17,
        volume: 195.88077825
    });
    store.dispatch(actions.addCandle(updatedCandle));
    expect(store.getState().candles).toEqual({
        symbols: [
            {
                symbol: supportedSymbols.BTCUSD,
                timeFrames: [
                    {
                        timeFrame: '1m',
                        candles: [updatedCandle]
                    }
                ]
            }
        ]
    });

    const newCandleForTheSameTimeFrame: Candle = new Candle({
        symbol: supportedSymbols.BTCUSD,
        timeFrame: '1m',
        timestamp: $.transformTimestamp(1543387260000),
        open: 117.31,
        close: 127.27,
        high: 127.31,
        low: 117.17,
        volume: 195.88077825
    });
    store.dispatch(actions.addCandle(newCandleForTheSameTimeFrame));
    expect(store.getState().candles).toEqual({
        symbols: [
            {
                symbol: supportedSymbols.BTCUSD,
                timeFrames: [
                    {
                        timeFrame: '1m',
                        candles: [updatedCandle, newCandleForTheSameTimeFrame]
                    }
                ]
            }
        ]
    });

    // add candle from new timeFrames
    const newTimeFrameCandle: Candle = new Candle({
        symbol: supportedSymbols.BTCUSD,
        timeFrame: '5m',
        timestamp: $.transformTimestamp(1543387260000),
        open: 117.31,
        close: 127.27,
        high: 127.31,
        low: 117.17,
        volume: 195.88077825
    });
    store.dispatch(actions.addCandle(newTimeFrameCandle));
    expect(store.getState().candles).toEqual({
        symbols: [
            {
                symbol: supportedSymbols.BTCUSD,
                timeFrames: [
                    {
                        timeFrame: '1m',
                        candles: [updatedCandle, newCandleForTheSameTimeFrame]
                    },
                    {
                        timeFrame: '5m',
                        candles: [newTimeFrameCandle]
                    }
                ]
            }
        ]
    });

    // add candle from new symbol
    const newSymbolCandle: Candle = new Candle({
        symbol: 'ETHUSD',
        timeFrame: '5m',
        timestamp: $.transformTimestamp(1543387260000),
        open: 117.31,
        close: 127.27,
        high: 127.31,
        low: 117.17,
        volume: 195.88077825
    });
    store.dispatch(actions.addCandle(newSymbolCandle));
    expect(store.getState().candles).toEqual({
        symbols: [
            {
                symbol: supportedSymbols.BTCUSD,
                timeFrames: [
                    {
                        timeFrame: '1m',
                        candles: [updatedCandle, newCandleForTheSameTimeFrame]
                    },
                    {
                        timeFrame: '5m',
                        candles: [newTimeFrameCandle]
                    }
                ]
            },
            {
                symbol: 'ETHUSD',
                timeFrames: [
                    {
                        timeFrame: '5m',
                        candles: [newSymbolCandle]
                    }
                ]
            }
        ]
    });
});

it('should batch add candles. Should add if new, update if already exists', () => {
    config.app.symbolToTrade = supportedSymbols.BTCUSD;
    config.app.timeFrameToTrade = supportedTimeFrames.oneMinute;

    const candle1: Candle = new Candle({
        symbol: supportedSymbols.BTCUSD,
        timeFrame: supportedTimeFrames.oneMinute,
        timestamp: $.transformTimestamp(1543387200000),
        open: 117.31,
        close: 117.27,
        high: 117.31,
        low: 117.17,
        volume: 195.88077825
    });
    const candle2: Candle = new Candle({
        symbol: supportedSymbols.BTCUSD,
        timeFrame: supportedTimeFrames.oneMinute,
        timestamp: $.transformTimestamp(1543387200000 + 60000),
        open: 117.31,
        close: 117.27,
        high: 117.31,
        low: 117.17,
        volume: 195.88077825
    });
    const candle3: Candle = new Candle({
        symbol: supportedSymbols.BTCUSD,
        timeFrame: supportedTimeFrames.oneMinute,
        timestamp: $.transformTimestamp(1543387200000 + 60000 + 60000),
        open: 117.31,
        close: 117.27,
        high: 117.31,
        low: 117.17,
        volume: 195.88077825
    });

    store.dispatch(actions.batchAddCandles([candle1, candle2, candle3]));

    expect(store.getState().candles).toEqual({
        symbols: [
            {
                symbol: supportedSymbols.BTCUSD,
                timeFrames: [
                    {
                        timeFrame: '1m',
                        candles: [candle1, candle2, candle3]
                    }
                ]
            }
        ]
    });

    const candle4: Candle = new Candle({
        symbol: supportedSymbols.BTCUSD,
        timeFrame: '1m',
        timestamp: $.transformTimestamp(1543387200000 + 3 * 60000),
        open: 117.31,
        close: 117.27,
        high: 117.31,
        low: 117.17,
        volume: 195.88077825
    });
    store.dispatch(actions.addCandle(candle4));

    expect(store.getState().candles).toEqual({
        symbols: [
            {
                symbol: supportedSymbols.BTCUSD,
                timeFrames: [
                    {
                        timeFrame: supportedTimeFrames.oneMinute,
                        candles: [candle1, candle2, candle3, candle4]
                    }
                ]
            }
        ]
    });

    expect(selectors.getCurrentTradingCandle()).toEqual(candle4);
    expect(selectors.getTradingCandles()).toEqual([candle1, candle2, candle3, candle4]);
});

it('Should generate candle from 1m candles', () => {
    const candles: Candle[] = [];
    for (let index = 0; index < 5; index++) {
        candles.push(fakeCandle());
    }

    const fiveMinuteCandle: Candle = $.generateCandleFromOneMinutes(candles[0].timeFrame, candles); 
    
    expect(fiveMinuteCandle.timestamp).toBe(candles[0].timestamp); 
    expect(fiveMinuteCandle.open).toBe(candles[0].open); 
    expect(fiveMinuteCandle.close).toBe(candles[candles.length - 1].close); 
    expect(fiveMinuteCandle.high).toBe(_.maxBy(candles, 'high').high); 
    expect(fiveMinuteCandle.low).toBe(_.minBy(candles, 'low').low); 
    expect(fiveMinuteCandle.volume).toBe(_.sumBy(candles, 'volume')); 
    expect(fiveMinuteCandle.symbol).toBe(candles[0].symbol); 
    expect(fiveMinuteCandle.timeFrame).toBe(candles[0].timeFrame); 
});