import _ from 'lodash';
import config from '../../config';
import $ from '../services/Helpers';
import { CandleSetTimeFrame } from '../interfaces/CandleSetInterface';
import Candle from '../models/Candle';
import Order from '../models/Order';
import Trade from '../models/Trade';
import store from '../store';
import { ActionTypes as types } from './types';
import { ActionInterface } from '../interfaces/ActionInterface';
import Notifier from '../services/Notifier';

export function resetState(): ActionInterface {
    return {
        type: types.RESET_STATE
    };
}
export function setStartingBalance(balance: number): ActionInterface {
    return {
        type: types.SET_STARTING_BALANCE,
        payload: balance
    };
}
export function setCurrentBalance(balance: number): ActionInterface {
    return {
        type: types.SET_CURRENT_BALANCE,
        payload: balance
    };
}
export function increaseCurrentBalance(balance: number): ActionInterface {
    return {
        payload: balance,
        type: types.INCREASE_CURRENT_BALANCE
    };
}
export function reduceCurrentBalance(balance: number): ActionInterface {
    return {
        payload: balance,
        type: types.REDUCE_CURRENT_BALANCE
    };
}
export function updateCurrentTime(time: string): ActionInterface {
    return {
        type: types.UPDATE_CURRENT_TIME,
        payload: time
    };
}
export function updateCurrentPrice(price: number): ActionInterface {
    return {
        type: types.UPDATE_CURRENT_PRICE,
        payload: price
    };
}
export function increaseCountOfConflictingOrders(): ActionInterface {
    return {
        type: types.INCREASE_CONFLICTING_ORDERS_COUNT,
        payload: store.getState().mainReducer.conflictingOrdersCount + 1
    };
}
export function addCandleSetTimeFrame(candleSetTimeFrame: CandleSetTimeFrame): ActionInterface {
    return {
        type: types.ADD_CANDLE_SET_TIME_FRAME, 
        payload: candleSetTimeFrame
    }
}
export function addCandle(candle: Candle): ActionInterface {
    return {
        type: types.ADD_CANDLE, 
        payload: candle
    }
}
export function batchAddCandles(candles: Candle[]): ActionInterface {
    return {
        type: types.BATCH_ADD_CANDLES, 
        payload: candles
    }
}
export function setStartTime(time: number): ActionInterface {
    return {
        type: types.SET_START_TIME,
        payload: time
    };
}
export function addProfit(addedProfit: number): ActionInterface {
    return {
        payload: addedProfit,
        type: types.ADD_PROFIT
    };
}
export function updateQuantity(quantity: number): ActionInterface {
    return {
        type: types.UPDATE_QUANTITY, 
        payload: quantity
    };
}
export function addQuantity(addedQuantity: number): ActionInterface {
    return {
        payload: store.getState().mainReducer.quantity + addedQuantity,
        type: types.UPDATE_QUANTITY
    };
}
export function updateEntryPrice(price: number): ActionInterface {
    return {
        type: types.UPDATE_ENTRY_PRICE, 
        payload: price
    };
}
export function setTradingSymbol(symbol: string): ActionInterface {
    return {
        type: types.SET_TRADING_SYMBOL, 
        payload: symbol
    };
}
export function setTradingFee(fee: number): ActionInterface {
    return {
        type: types.SET_TRADING_FEE, 
        payload: fee
    };
}
export function addTrade(trade: Trade): ActionInterface {
    return {
        type: types.ADD_TRADE,
        payload: trade
    };
}
export function addOrder(order: Order): ActionInterface {
    if ($.isLiveTrading() && config.notifications.events.submittedOrders) {
        Notifier.send(`Created ${order.type} ${order.side} order of ${_.round(order.quantity, 2)} ${order.symbol.slice(0, 3)} at ${_.round(order.price, 2)} USD (ID: ${order.id})`);
    }

    if ($.isDebuggable('orderSubmission')) {
        store.dispatch(logWarning(`Created ${order.type} ${order.side} order of ${order.quantity} ${order.symbol.slice(0, 3)} at ${order.price} USD (ID: ${order.id})`));
    }

    return {
        type: types.ADD_ORDER,
        payload: order
    };
}
export function executeOrder(id: number): ActionInterface {
    if ($.isLiveTrading() && config.notifications.events.executedOrders) {
        Notifier.send(`order ID:${id} has been EXECUTED.`);
        store.dispatch(logWarning(`order ID:${id} has been EXECUTED.`));
    }
    
    return {
        type: types.EXECUTE_ORDER,
        payload: {
            id, 
            time: ($.isBackTesting() ? (store.getState().mainReducer.currentTime ? store.getState().mainReducer.currentTime : $.now()) : $.now())
        }
    };
}
export function cancelOrder(id: number): ActionInterface {
    if ($.isLiveTrading() && config.notifications.events.cancelledOrders) {
        Notifier.send(`order ID:${id} has been CANCELLED.`);
        store.dispatch(logWarning(`order ID:${id} has been CANCELLED.`));
    }
    
    return {
        type: types.CANCEL_ORDER,
        payload: {
            id, 
            time: ($.isBackTesting() ? (store.getState().mainReducer.currentTime ? store.getState().mainReducer.currentTime : $.now()) : $.now())
        }
    };
}
export function updateOrderPrice(id: number, price: number): ActionInterface {
    return {
        type: types.UPDATE_ORDER_PRICE,
        payload: {
            id, 
            price, 
            time: ($.isBackTesting() ? (store.getState().mainReducer.currentTime ? store.getState().mainReducer.currentTime : $.now()) : $.now())
        }
    };
}
export function updateOrderQuantity(id: number, quantity: number): ActionInterface {
    return {
        type: types.UPDATE_ORDER_QUANTITY,
        payload: {
            id, 
            quantity, 
            time: ($.isBackTesting() ? (store.getState().mainReducer.currentTime ? store.getState().mainReducer.currentTime : $.now()) : $.now())
        }
    };
}
export function logError(message: string): ActionInterface {
    if ($.isLiveTrading() && config.notifications.events.errors) {
        Notifier.send(`API Error: "${message}"`);
    }

    return {
        payload: {
            message, 
            time: ($.isBackTesting() ? (store.getState().mainReducer.currentTime ? store.getState().mainReducer.currentTime : $.now()) : $.now())
        }, 
        type: types.LOG_ERROR
    }
}
export function logWarning(message: string): ActionInterface {
    return {
        payload: {
            message, 
            time: ($.isBackTesting() ? (store.getState().mainReducer.currentTime ? store.getState().mainReducer.currentTime : $.now()) : $.now())
        }, 
        type: types.LOG_WARNING
    }
}
export function setSessionID(id: number): ActionInterface {
    return {
        type: types.SET_SESSION_ID,
        payload: id
    };
}