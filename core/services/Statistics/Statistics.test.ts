import _ from 'lodash';
import store, { actions } from '../../store';
import { supportedSymbols, supportedTimeFrames } from '../../store/types';
import testingCandles from '../../test/data/candles';
import Candle from '../../models/Candle';
import TestStrategy from '../../test/data/TestStrategy';
import { Jesse } from '../../models/Jesse';
import Statistics from '.';

beforeEach(() => {
    store.dispatch(actions.resetState());
    store.dispatch(actions.setTradingFee(0));
    store.dispatch(actions.setStartingBalance(10000));
    store.dispatch(actions.setTradingSymbol(supportedSymbols.ETHUSD));
});

it('Should return proper statistics for given candles[]', () => {
    const candles: Candle[] = testingCandles;

    expect(Statistics.candles(candles)).toEqual([
        { key: 'total', value: 55 },
        { key: 'symbol', value: supportedSymbols.ETHUSD },
        { key: 'timeFrame', value: supportedTimeFrames.fiveMinutes },
        { key: 'time period', value: `an hour (2019-01-11T09:55:00Z => 2019-01-11T10:50:00Z)` },
        { key: 'price change:', value: `-2.82% ($129.07 => $125.43015725)` }
    ]);
});


it('Should return proper statistics for give trades[]', async () => {
    const strategy = new TestStrategy();
    const candles: Candle[] = testingCandles;

    // perform a quick backtest so that can have some trades do the assertions
    await new Jesse(strategy).backTest({
        symbols: [
            {
                symbol: candles[0].symbol,
                timeFrames: [
                    {
                        timeFrame: candles[0].timeFrame,
                        candles
                    }
                ]
            }
        ]
    });

    expect(Statistics.trades(store.getState().trades)).toEqual([
        { key: 'total', value: 2 },
        { key: 'starting balance', value: '$10000' },
        { key: 'finishing balance', value: '$10004.7' },
        { key: 'PNL', value: '$4.7' },
        { key: 'PNL%', value: '0.05%' },
        { key: 'win rate', value: '50%' },
        { key: 'minimum R', value: 1 },
        { key: 'average R', value: 1.5 },
        { key: 'maximum R', value: 2 },
        { key: 'longs/shorts trades', value: '50%/50%' }
    ]);
});
