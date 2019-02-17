import config from '../config';
import store from '../core/store';
import Order from '../core/models/Order';
import Candle from '../core/models/Candle';
import $ from '../core/services/Helpers';

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
        .candles.symbols.find(item => item.symbol === config.symbolToTrade)
        .timeFrames.find(item => item.timeFrame === config.timeFrameToTrade).candles;

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
        .candles.symbols.find(item => item.symbol === config.symbolToTrade)
        .timeFrames.find(item => item.timeFrame === config.timeFrameToTrade).candles;
}

/**
 * The current(last added) candle for a specific symbol or a specific timeFrame.
 *
 * @export
 * @param {string} [symbol=config.symbolToTrade]
 * @param {string} [timeFrame=config.timeFrameToTrade]
 * @returns {Candle}
 */
export function getCurrentCandleFor(
    symbol: string = config.symbolToTrade,
    timeFrame: string = config.timeFrameToTrade
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
    symbol: string = config.symbolToTrade,
    timeFrame: string = config.timeFrameToTrade
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
        .candles.symbols.find(item => item.symbol === config.symbolToTrade)
        .timeFrames.find(item => item.timeFrame === config.timeFrameToTrade).candles;

    return candles[candles.length - (numberOfCandlesAgo + 1)];
}

export function getPastCandleFor(numberOfCandlesAgo: number, symbol: string = config.symbolToTrade, timeFrame: string = config.timeFrameToTrade): Candle {
    const candles: Candle[] = store
        .getState()
        .candles.symbols.find(item => item.symbol === symbol)
        .timeFrames.find(item => item.timeFrame === timeFrame).candles;

    return candles[candles.length - (numberOfCandlesAgo + 1)];
}
