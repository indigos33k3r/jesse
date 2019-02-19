import _ from 'lodash';
import moment from 'moment-timezone';
import config from '../../../config';
import Candle from '../../models/Candle';
import Trade from '../../models/Trade';
import store from '../../store';
import { TableDataInterface } from '../Table/types';
moment.tz.setDefault('UTC');

const Statistics = {
    candles(candles: Candle[]): TableDataInterface[] {
        let priceChangePercentage = ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100;

        return [
            { key: 'total', value: candles.length },
            { key: 'symbol', value: store.getState().config.tradingSymbol },
            { key: 'timeFrame', value: config.timeFrameToTrade },
            {
                key: 'time period',
                value: `${moment
                    .duration(moment(candles[0].timestamp).diff(moment(candles[candles.length - 1].timestamp)))
                    .humanize()} (${candles[0].timestamp} => ${candles[candles.length - 1].timestamp})`
            },
            {
                key: 'price change:',
                value: `${_.round(priceChangePercentage, 2)}% ($${candles[0].close} => $${
                    candles[candles.length - 1].close
                })`
            }
        ];
    },

    trades(trades: Trade[]): TableDataInterface[] {
        const winningTrades: Trade[] = trades.filter(t => t.pnl() > 0);
        const losingTrades: Trade[] = trades.filter(t => t.pnl() < 0);
        const winRate = winningTrades.length / (losingTrades.length + winningTrades.length);
        const minTradesR: Trade = _.minBy(trades, t => t.R());
        const maxTradedR: Trade = _.maxBy(trades, t => t.R());
        const numberOfLongs = (_.filter(trades, t => t.type === 'long').length / trades.length) * 100;

        return [
            { key: 'total', value: store.getState().trades.length },
            { key: 'starting balance', value: `$${_.round(store.getState().mainReducer.startingBalance, 2)}` },
            { key: 'finishing balance', value: `$${_.round(store.getState().mainReducer.currentBalance, 2)}` },
            { key: 'PNL', value: `$${_.round(store.getState().mainReducer.profit, 4)}` },
            {
                key: 'PNL%',
                value: `${_.round(
                    (store.getState().mainReducer.profit / store.getState().mainReducer.startingBalance) * 100,
                    2
                )}%`
            },
            { key: 'win rate', value: `${Math.round(winRate * 100)}%` },
            { key: 'minimum R', value: _.round(minTradesR.R(), 2) },
            { key: 'average R', value: _.round(_.meanBy(trades, t => t.R()), 2) },
            { key: 'maximum R', value: _.round(maxTradedR.R(), 2) },
            { key: 'longs/shorts trades', value: `${Math.round(numberOfLongs)}%/${Math.round(100 - numberOfLongs)}%` }
        ];
    }
};

export default Statistics;
