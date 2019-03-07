import { orderTypes } from '../exchanges/Bitfinex/types';
import testingCandles from './data/candles';
import TestStrategy from './data/TestStrategy';
import store, { actions } from '../store';
import { supportedSymbols, TradeTypes, Sides, orderStatuses } from '../store/types';
import Candle from '../models/Candle';
import { Bootstrap } from '../services/Bootstrap';
import Order from '../models/Order';
import Trade from '../models/Trade';
import config from '../../config';
import $ from '../services/Helpers';

beforeEach(() => {
    store.dispatch(actions.resetState());
    store.dispatch(actions.setTradingFee(0));
    store.dispatch(actions.setStartingBalance(10000));
    store.dispatch(actions.setTradingSymbol(supportedSymbols.ETHUSD));
});

it('Should run a simple backTest making 2 trades via LIMIT orders', async () => {
    const strategy = new TestStrategy();
    const candles: Candle[] = testingCandles;

    // run backTest on a new instance of Bootstrap
    await new Bootstrap(new TestStrategy()).backTest({
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

    // fetch the orders from the store because we need their IDs to 
    // pass the test (even though the IDs don't really matter)
    const orders: Order[] = store.getState().orders; 
    expect(orders.length).toBe(6);

    const expectedTrade1: Trade = new Trade({
        id: orders[0].id,
        strategy: strategy.name,
        strategyVersion: strategy.version,
        symbol: config.app.symbolToTrade,
        type: TradeTypes.LONG,
        entryPrice: 129.33,
        exitPrice: 128.35,
        takeProfitPrice: 131.29,
        stopLossPrice: 128.35,
        quantity: 10.2041,
        fee: 0,
        orders: [
            // open position 
            new Order({
                id: orders[0].id,
                flag: null, 
                symbol: config.app.symbolToTrade,
                type: orderTypes.LIMIT,
                price: 129.33,
                quantity: 10.2041,
                side: Sides.BUY,
                status: orderStatuses.EXECUTED,
                createdAt: $.transformTimestamp(1547200740000), 
                executedAt: $.transformTimestamp(1547201100000)
            }),
            // close position with a STOP order
            new Order({
                id: orders[1].id,
                flag: null, 
                symbol: config.app.symbolToTrade,
                type: orderTypes.STOP,
                price: 128.35,
                quantity: -10.2041,
                side: Sides.SELL,
                status: orderStatuses.EXECUTED,
                createdAt: $.transformTimestamp(1547201100000), 
                executedAt: $.transformTimestamp(1547202840000), 
            }), 
        ],
        openedAt: $.transformTimestamp(1547201100000),
        closedAt: $.transformTimestamp(1547202840000)
    });

    const expectedTrade2: Trade = new Trade({
        id: orders[3].id,
        strategy: strategy.name,
        strategyVersion: strategy.version,
        symbol: config.app.symbolToTrade,
        type: TradeTypes.SHORT,
        entryPrice: 128.05,
        exitPrice: 126.58,
        takeProfitPrice: 126.58,
        stopLossPrice: 129.52,
        quantity: 10,
        fee: 0,
        orders: [
            // open position 
            new Order({
                id: orders[3].id,
                flag: null, 
                symbol: config.app.symbolToTrade,
                type: orderTypes.LIMIT,
                price: 128.05,
                quantity: -10,
                side: Sides.SELL,
                status: orderStatuses.EXECUTED,
                createdAt: $.transformTimestamp(1547203500000), 
                executedAt: $.transformTimestamp(1547203560000), 
            }),
            // takeProfitOrder gets filled 
            new Order({
                id: orders[5].id,
                flag: null, 
                symbol: config.app.symbolToTrade,
                type: orderTypes.LIMIT,
                price: 126.58,
                quantity: 10,
                side: Sides.BUY,
                status: orderStatuses.EXECUTED,
                createdAt: $.transformTimestamp(1547203560000),
                executedAt: $.transformTimestamp(1547203740000)
            })
        ],
        openedAt: $.transformTimestamp(1547203560000),
        closedAt: $.transformTimestamp(1547203740000)
    });

    expect(store.getState().trades.length).toBe(2);
    expect(store.getState().trades).toEqual([expectedTrade1, expectedTrade2]);
});


it('Should log a warning for not having enough candles to execute the strategy', async () => {
    const strategy = new TestStrategy(3);
    const candles: Candle[] = testingCandles;
    
    await new Bootstrap(strategy).backTest({
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

    // expect it to be 2 warnings since the third time would be the charm
    expect(
        store.getState().logs.warnings.filter(item => item.message.startsWith('TestStrategy requires 3 candles to begin executing,')).length
    ).toBe(2);
});