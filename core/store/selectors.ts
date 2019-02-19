import store from '.';
import Order from '../models/Order';
import Candle from '../models/Candle';
import config from '../../config';
import $ from '../services/Helpers';

/**
 * Helper for receiving a single order using its ID.
 *
 * @export
 * @param {number} orderID
 * @returns {Order}
 */
export function getOrder(orderID: number): Order {
    return store.getState().orders.find(item => item.id === orderID);
}

/**
 *The number of orders that are active (not filled, not canceled).
 *
 * @export
 * @returns {number}
 */
export function countOfActiveOrders(): number {
    return store.getState().orders.filter(item => item.isActive()).length;
}

/**
 * The last trading candle. Could be the current forming candle as well.
 *
 * @export
 * @returns {Candle}
 */
export function getCurrentTradingCandle(): Candle {
    const candles: Candle[] = store
        .getState()
        .candles.symbols.find(item => item.symbol === config.app.symbolToTrade)
        .timeFrames.find(item => item.timeFrame === config.app.timeFrameToTrade).candles;

    return candles[candles.length - 1];
}

/**
 * Returns all the trading candles.
 *
 * @export
 * @returns {Candle[]}
 */
export function getTradingCandles(): Candle[] {
    return store
        .getState()
        .candles.symbols.find(item => item.symbol === config.app.symbolToTrade)
        .timeFrames.find(item => item.timeFrame === config.app.timeFrameToTrade).candles;
}

/**
 * The current(last added) candle for a specific symbol or a specific timeFrame.
 *
 * @export
 * @param {string} [symbol=config.app.symbolToTrade]
 * @param {string} [timeFrame=config.app.timeFrameToTrade]
 * @returns {Candle}
 */
export function getCurrentCandleFor(
    symbol: string = config.app.symbolToTrade,
    timeFrame: string = config.app.timeFrameToTrade
): Candle {
    $.validateSymbol(symbol);
    $.validateTimeFrame(timeFrame);

    const candles: Candle[] = store
        .getState()
        .candles.symbols.find(item => item.symbol === symbol)
        .timeFrames.find(item => item.timeFrame === timeFrame).candles;

    return candles[candles.length - 1];
}

export function getCandlesFor(
    symbol: string = config.app.symbolToTrade,
    timeFrame: string = config.app.timeFrameToTrade
): Candle[] {
    $.validateSymbol(symbol);
    $.validateTimeFrame(timeFrame);

    return store
        .getState()
        .candles.symbols.find(item => item.symbol === symbol)
        .timeFrames.find(item => item.timeFrame === timeFrame).candles;
}

export function getPastTradingCandle(numberOfCandlesAgo: number): Candle {
    const candles: Candle[] = store
        .getState()
        .candles.symbols.find(item => item.symbol === config.app.symbolToTrade)
        .timeFrames.find(item => item.timeFrame === config.app.timeFrameToTrade).candles;

    return candles[candles.length - (numberOfCandlesAgo + 1)];
}

export function getPastCandleFor(numberOfCandlesAgo: number, symbol: string = config.app.symbolToTrade, timeFrame: string = config.app.timeFrameToTrade): Candle {
    const candles: Candle[] = store
        .getState()
        .candles.symbols.find(item => item.symbol === symbol)
        .timeFrames.find(item => item.timeFrame === timeFrame).candles;

    return candles[candles.length - (numberOfCandlesAgo + 1)];
}
