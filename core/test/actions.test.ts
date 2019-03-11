import Order from '../models/Order';
import store, { actions } from '../store';
import { ActionTypes } from '../store/types';
import Candle from '../models/Candle';
import $ from '../services/Helpers';
import Trade from '../models/Trade';

it('Should create an action to reset the state', () => {
    expect(actions.resetState()).toEqual({
        type: ActionTypes.RESET_STATE
    });
});
it('Should create an action to set starting balance', () => {
    expect(actions.setStartingBalance(5)).toEqual({
        type: ActionTypes.SET_STARTING_BALANCE,
        payload: 5
    });
});
it('Should create an action to set current balance', () => {
    expect(actions.setCurrentBalance(5)).toEqual({
        type: ActionTypes.SET_CURRENT_BALANCE,
        payload: 5
    });
});
it('Should create an action to increase balance', () => {
    store.dispatch(actions.setTradingFee(0)); 

    expect(actions.increaseCurrentBalance(5)).toEqual({
        type: ActionTypes.INCREASE_CURRENT_BALANCE,
        payload: {
            balance: 5, 
            fee: 0
        }
    });
});
it('Should create an action to reduce balance', () => {
    store.dispatch(actions.setTradingFee(0)); 

    expect(actions.reduceCurrentBalance(6)).toEqual({
        type: ActionTypes.REDUCE_CURRENT_BALANCE,
        payload: {
            balance: 6, 
            fee: 0
        }
    });
});
it('Should create an action to currentTime', () => {
    expect(actions.updateCurrentTime($.moment('2016-10-30T03:00:00Z').valueOf())).toEqual({
        type: ActionTypes.UPDATE_CURRENT_TIME,
        payload: $.moment('2016-10-30T03:00:00Z').valueOf()
    });
});
it('Should create an action to currentPrice', () => {
    expect(actions.updateCurrentPrice(100)).toEqual({
        type: ActionTypes.UPDATE_CURRENT_PRICE,
        payload: 100
    });
});
it('Should create an action to increase count_of_conflicting_orders', () => {
    expect(actions.increaseCountOfConflictingOrders()).toEqual({
        type: ActionTypes.INCREASE_CONFLICTING_ORDERS_COUNT,
        payload: 1
    });
});
it('Should create an action to add CandleSetTimeFrame', () => {
    expect(
        actions.addCandleSetTimeFrame({
            timeFrame: '1m',
            candles: []
        })
    ).toEqual({
        type: ActionTypes.ADD_CANDLE_SET_TIME_FRAME,
        payload: {
            timeFrame: '1m',
            candles: []
        }
    });
});
it('Should create an action to add candle', () => {
    const candle: Candle = new Candle({
        symbol: 'BTCUSD',
        timeFrame: '1m',
        timestamp: 1543387200000,
        open: 117.31,
        close: 117.27,
        high: 117.31,
        low: 117.17,
        volume: 195.88077825
    });

    expect(actions.addCandle(candle)).toEqual({
        type: ActionTypes.ADD_CANDLE, 
        payload: candle
    });
});
it('Should create an action to BATCH add candle', () => {
    const candles: Candle[] = [
        new Candle({
            symbol: 'BTCUSD',
            timeFrame: '1m',
            timestamp: 1543387200000,
            open: 117.31,
            close: 117.27,
            high: 117.31,
            low: 117.17,
            volume: 195.88077825
        }),
        new Candle({
            symbol: 'BTCUSD',
            timeFrame: '1m',
            timestamp: 1543387260000,
            open: 117.31,
            close: 118.27,
            high: 118.31,
            low: 117.17,
            volume: 295.88077825
        })
    ];

    expect(actions.batchAddCandles(candles)).toEqual({
        type: ActionTypes.BATCH_ADD_CANDLES, 
        payload: candles
    });
});
it('Should create an action to set start time', () => {
    expect(actions.setStartTime(11111)).toEqual({
        type: ActionTypes.SET_START_TIME,
        payload: 11111
    });
});
it('Should create an action to update position quantity', () => {
    expect(actions.updateQuantity(1)).toEqual({
        type: ActionTypes.UPDATE_QUANTITY,
        payload: 1
    });
});
it('Should create an action to update position entryPrice', () => {
    expect(actions.updateEntryPrice(6500)).toEqual({
        type: ActionTypes.UPDATE_ENTRY_PRICE,
        payload: 6500
    });
});
it('Should create an action to set position symbol', () => {
    expect(actions.setTradingSymbol('BTCUSD')).toEqual({
        type: ActionTypes.SET_TRADING_SYMBOL,
        payload: 'BTCUSD'
    });
});
it('Should create an action to add order', () => {
    const order: Order = new Order({
        id: 123,
        symbol: 'BTCUSD',
        side: 'buy',
        type: 'EXCHANGE',
        flag: null,
        quantity: 1,
        price: 100,
        status: 'EXECUTED'
    });

    expect(actions.addOrder(new Order(order))).toEqual({
        type: ActionTypes.ADD_ORDER,
        payload: order
    });
});
it('Should create an action to add trade', () => {
    const trade: Trade = new Trade();

    expect(actions.addTrade(trade)).toEqual({
        type: ActionTypes.ADD_TRADE,
        payload: trade
    });
});
it('Should create an action to log error', () => {
    expect(actions.logError('some error to log')).toEqual({
        type: ActionTypes.LOG_ERROR,
        payload: {
            message: 'some error to log', 
            time: $.now()
        }
    });
});
it('Should create an action to log warning', () => {
    expect(actions.logWarning('some warning to log')).toEqual({
        type: ActionTypes.LOG_WARNING,
        payload: {
            message: 'some warning to log', 
            time: $.now()
        }
    });
});
it('Should create an action to update order price', () => {
    expect(actions.updateOrderPrice(123, 321)).toEqual({
        type: ActionTypes.UPDATE_ORDER_PRICE,
        payload: {
            id: 123, 
            price: 321, 
            time: $.now()
        }
    });
});
it('Should create an action to update order quantity', () => {
    expect(actions.updateOrderQuantity(123, 2)).toEqual({
        type: ActionTypes.UPDATE_ORDER_QUANTITY,
        payload: {
            id: 123, 
            quantity: 2, 
            time: $.now()
        }
    });
});
it('Should create an action to set session ID', () => {
    expect(actions.setSessionID(123)).toEqual({
        type: ActionTypes.SET_SESSION_ID,
        payload: 123
    });
});