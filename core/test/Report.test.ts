import _ from 'lodash';
import config from '../../config';
import { orderTypes } from '../exchanges/Bitfinex/types';
import Order from '../models/Order';
import $ from '../services/Helpers';
import Report from '../services/Report';
import store, { actions } from '../store';
import { orderFlags, orderStatuses, Sides, supportedSymbols, TradeTypes, supportedColors } from '../store/types';
import TestStrategy from './data/TestStrategy';
import Candle from '../models/Candle';
import fakeCandle from '../models/factories/CandleFactory';

beforeEach(() => {
    store.dispatch(actions.resetState());
    store.dispatch(actions.setTradingFee(0));
    store.dispatch(actions.setStartingBalance(10000));
    store.dispatch(actions.setTradingSymbol(supportedSymbols.ETHUSD));
});

it('Should return proper Report for Jesse', () => {
    expect(Report.backTest(new TestStrategy())).toEqual([
        { key: 'strategy', value: `A strategy used for testing (v0.0.1)` },
        { key: 'debug mode', value: config.debugMode ? 'enabled' : 'disabled' }
    ]);
});

it('Should return proper Report for given orders[]', () => {
    const order1: Order = new Order({
        id: $.generateUniqueID(),
        price: 10,
        type: orderTypes.LIMIT,
        symbol: supportedSymbols.BTCUSD,
        side: Sides.BUY,
        status: orderStatuses.ACTIVE,
        flag: orderFlags.CLOSE,
        createdAt: $.now(),
        quantity: 10
    });

    const order2: Order = new Order({
        id: $.generateUniqueID(),
        price: 20,
        type: orderTypes.LIMIT,
        symbol: supportedSymbols.BTCUSD,
        side: Sides.BUY,
        status: orderStatuses.ACTIVE,
        flag: orderFlags.CLOSE,
        createdAt: $.now(),
        quantity: 20
    });

    expect(Report.orders([order1, order2])).toEqual([
        {
            item: [
                { key: 'id', value: order1.id, color: order1.isActive() ? '' : 'grey' },
                { key: 'symbol', value: order1.symbol, color: order1.isActive() ? '' : 'grey' },
                { key: 'side', value: order1.side, color: order1.isActive() ? '' : 'grey' },
                { key: 'type', value: order1.type, color: order1.isActive() ? '' : 'grey' },
                { key: 'quantity', value: _.round(order1.quantity, 3), color: order1.isActive() ? '' : 'grey' },
                { key: 'price', value: _.round(order1.price, 3), color: order1.isActive() ? '' : 'grey' },
                { key: 'flag', value: order1.flag, color: order1.isActive() ? '' : 'grey' },
                { key: 'status', value: order1.status, color: order1.isActive() ? '' : 'grey' },
                { key: 'createdAt', value: order1.createdAt, color: order1.isActive() ? '' : 'grey' }
            ]
        },
        {
            item: [
                { key: 'id', value: order2.id, color: order2.isActive() ? '' : 'grey' },
                { key: 'symbol', value: order2.symbol, color: order2.isActive() ? '' : 'grey' },
                { key: 'side', value: order2.side, color: order2.isActive() ? '' : 'grey' },
                { key: 'type', value: order2.type, color: order2.isActive() ? '' : 'grey' },
                { key: 'quantity', value: _.round(order2.quantity, 3), color: order2.isActive() ? '' : 'grey' },
                { key: 'price', value: _.round(order2.price, 3), color: order2.isActive() ? '' : 'grey' },
                { key: 'flag', value: order2.flag, color: order2.isActive() ? '' : 'grey' },
                { key: 'status', value: order2.status, color: order2.isActive() ? '' : 'grey' },
                { key: 'createdAt', value: order2.createdAt, color: order2.isActive() ? '' : 'grey' }
            ]
        }
    ]);
});

it('Should return proper Report for given candles[]', () => {
    const candle1: Candle = fakeCandle();
    const candle2: Candle = fakeCandle();

    expect(Report.candles([candle1, candle2])).toEqual([
        {
            item: [
                { key: 'symbol', value: candle1.symbol === store.getState().config.tradingSymbol ? '*' + candle1.symbol : candle1.symbol, color: candle1.symbol === store.getState().config.tradingSymbol ? '' : 'grey' },
                { key: 'timeFrame', value: candle1.timeFrame, color: candle1.timeFrame === config.timeFrameToTrade ? '' : 'grey' },
                { key: 'open', value: _.round(candle1.open, 3).toString(), color: candle1.isBullish() ? 'green' : 'red' },
                { key: 'close', value: _.round(candle1.close, 3), color: candle1.isBullish() ? 'green' : 'red' },
                { key: 'high', value: _.round(candle1.high, 3), color: candle1.isBullish() ? 'green' : 'red' },
                { key: 'low', value: _.round(candle1.low, 3), color: candle1.isBullish() ? 'green' : 'red' },
                { key: 'volume', value: _.round(candle1.volume, 2), color: candle1.isBullish() ? 'green' : 'red' },
            ]
        },
        {
            item: [
                { key: 'symbol', value: candle2.symbol === store.getState().config.tradingSymbol ? '*' + candle2.symbol : candle2.symbol, color: candle2.symbol === store.getState().config.tradingSymbol ? '' : 'grey' },
                { key: 'timeFrame', value: candle2.timeFrame, color: candle2.timeFrame === config.timeFrameToTrade ? '' : 'grey' },
                { key: 'open', value: _.round(candle2.open, 3).toString(), color: candle2.isBullish() ? 'green' : 'red' },
                { key: 'close', value: _.round(candle2.close, 3), color: candle2.isBullish() ? 'green' : 'red' },
                { key: 'high', value: _.round(candle2.high, 3), color: candle2.isBullish() ? 'green' : 'red' },
                { key: 'low', value: _.round(candle2.low, 3), color: candle2.isBullish() ? 'green' : 'red' },
                { key: 'volume', value: _.round(candle2.volume, 2), color: candle2.isBullish() ? 'green' : 'red' },
            ]
        }
    ]);
});

it('Should return proper Report for given positions[]', () => {
    const position1 = {
        type: TradeTypes.LONG,
        symbol: supportedSymbols.BTCUSD,
        quantity: 10, 
        entryPrice: 100, 
        PNL: 1, 
    }; 
    const position2 = {
        type: TradeTypes.SHORT,
        symbol: supportedSymbols.ETHUSD,
        quantity: 10, 
        entryPrice: 100, 
        PNL: -1, 
    }; 

    expect(Report.positions([position1, position2])).toEqual([
        {
            item: [
                { key: 'type', value: '●', color: supportedColors.GREEN },
                { key: 'symbol', value: position1.symbol },
                { key: 'quantity', value: _.round(position1.quantity, 4).toString() },
                { key: 'entryPrice', value: _.round(position1.entryPrice, 3) },
                { key: 'PNL', value: _.round(position1.PNL, 2) + '%', color: supportedColors.GREEN },
            ]
        },
        {
            item: [
                { key: 'type', value: '●', color: supportedColors.RED },
                { key: 'symbol', value: position2.symbol },
                { key: 'quantity', value: _.round(position2.quantity, 4).toString() },
                { key: 'entryPrice', value: _.round(position2.entryPrice, 3) },
                { key: 'PNL', value: _.round(position2.PNL, 2) + '%', color: supportedColors.RED },
            ]
        }
    ]);
});