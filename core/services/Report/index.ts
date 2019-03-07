import _ from 'lodash';
import moment from 'moment-timezone';
import config from '../../../config';
import Order from '../../models/Order';
import Strategy from '../../strategies/Strategy';
import store, { selectors } from '../../store';
import $ from '../Helpers';
import { MultiValueTableDataInterface, TableDataInterface } from '../Table/types';
import Candle from '../../models/Candle';
import { TradeTypes } from '../../store/types';
moment.tz.setDefault('UTC');

interface PositionInterface {
    type: string;
    symbol: string;
    quantity: number;
    entryPrice: number;
    PNL: number;
}

const Report = {
    backTest(strategy: Strategy): TableDataInterface[] {
        return [
            { key: 'strategy', value: `${strategy.name} (v${strategy.version})` },
            { key: 'debug mode', value: config.app.debugMode ? 'enabled' : 'disabled' }
        ];
    },

    liveTrade(strategy: Strategy): TableDataInterface[] {
        return [
            { key: 'strategy', value: `${strategy.name} - v${strategy.version}` },
            { key: 'debug mode', value: config.app.debugMode ? 'enabled' : 'disabled' },
            { key: 'profit', value: `$${store.getState().mainReducer.profit}` },
            {
                key: 'current time',
                value: $.now() + ` (started at ${$.time(store.getState().mainReducer.startTime)} UTC)`
            },
            { key: 'errors', value: store.getState().logs.errors.length },
            { key: 'warnings', value: store.getState().logs.warnings.length },
            { key: 'trades', value: store.getState().trades.length },
            { key: 'active orders', value: selectors.countOfActiveOrders() },
            { key: 'inactive orders', value: store.getState().orders.length - selectors.countOfActiveOrders() }
        ];
    },

    orders(orders: Order[]): MultiValueTableDataInterface[] {
        const list: MultiValueTableDataInterface[] = [];

        orders.forEach(order => {
            list.push({
                item: [
                    { key: 'id', value: order.id, color: order.isActive() ? '' : 'grey' },
                    { key: 'symbol', value: order.symbol, color: order.isActive() ? '' : 'grey' },
                    { key: 'side', value: order.side, color: order.isActive() ? '' : 'grey' },
                    { key: 'type', value: order.type, color: order.isActive() ? '' : 'grey' },
                    { key: 'quantity', value: _.round(order.quantity, 3), color: order.isActive() ? '' : 'grey' },
                    { key: 'price', value: _.round(order.price, 3), color: order.isActive() ? '' : 'grey' },
                    { key: 'flag', value: order.flag, color: order.isActive() ? '' : 'grey' },
                    { key: 'status', value: order.status, color: order.isActive() ? '' : 'grey' },
                    { key: 'createdAt', value: order.createdAt, color: order.isActive() ? '' : 'grey' }
                ]
            });
        });

        return list;
    },

    candles(candles: Candle[]): MultiValueTableDataInterface[] {
        const list: MultiValueTableDataInterface[] = [];

        candles.forEach(c => {
            const isTradingCandle: boolean = c.symbol === store.getState().config.tradingSymbol && c.timeFrame === config.app.timeFrameToTrade;
            const isBullish: boolean = c.isBullish();

            list.push({
                item: [
                    { key: 'symbol', value: isTradingCandle ? '*' + c.symbol : c.symbol, color: isTradingCandle ? '' : 'grey' },
                    { key: 'timeFrame', value: c.timeFrame, color: isTradingCandle ? '' : 'grey' },
                    { key: 'open', value: _.round(c.open, 3).toString(), color: isBullish ? 'green' : 'red' },
                    { key: 'close', value: _.round(c.close, 3), color: isBullish ? 'green' : 'red' },
                    { key: 'high', value: _.round(c.high, 3), color: isBullish ? 'green' : 'red' },
                    { key: 'low', value: _.round(c.low, 3), color: isBullish ? 'green' : 'red' },
                    { key: 'volume', value: _.round(c.volume, 2), color: isBullish ? 'green' : 'red' },
                ]
            });
        });

        return list; 
    }, 

    positions(positions: PositionInterface[]): MultiValueTableDataInterface[] {
        const list: MultiValueTableDataInterface[] = [];

        positions.forEach(p => {
            list.push({
                item: [
                    { key: 'type', value: '●', color: p.type === TradeTypes.LONG ? 'green' : 'red' },
                    { key: 'symbol', value: p.symbol },
                    { key: 'quantity', value: _.round(p.quantity, 4).toString() },
                    { key: 'entryPrice', value: _.round(p.entryPrice, 3) },
                    { key: 'PNL', value: _.round(p.PNL, 2) + '%', color: p.PNL > 0 ? 'green' : 'red' },
                ]
            });
        });

        return list; 
    }
};

export default Report;
