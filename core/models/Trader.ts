import Order from '../models/Order';
import api from '../services/API';
import $ from '../services/Helpers';
import store from '../store';
import { orderFlags, Sides } from '../store/types';

export default class Trader {
    executedOrdersToImpact: Order[] = []; 

    /**
     * Creates a sell MARKET order. 
     *
     * @param {number} quantity
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async sellAtMarket(quantity: number): Promise<Order> {
        quantity = -Math.abs(quantity);

        let order: Order = await api.marketOrder(store.getState().config.tradingSymbol, Math.abs(quantity), Sides.SELL, []);

        if (! $.isLiveTrading()) {
            this.executedOrdersToImpact.push(order);
        }

        return order; 
    }
    
    /**
     * Creates a sell LIMIT order. 
     *
     * @param {number} quantity
     * @param {number} price
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async sellAt(quantity: number, price: number): Promise<Order> {
        return await api.limitOrder(store.getState().config.tradingSymbol, Math.abs(quantity), price, Sides.SELL, [])
    }
    
    /**
     * Places a long/buy MARKET order.
     *
     * @param {number} quantity
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async buyAtMarket(quantity: number): Promise<Order> {
        let order: Order = await api.marketOrder(store.getState().config.tradingSymbol, Math.abs(quantity), Sides.BUY, []);

        if (! $.isLiveTrading()) {
            this.executedOrdersToImpact.push(order);
        }

        return order;
    }
    
    /**
     * Places a buy LIMIT order.
     *
     * @param {number} quantity
     * @param {number} price
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async buyAt(quantity: number, price: number): Promise<Order> {
        return await api.limitOrder(store.getState().config.tradingSymbol, Math.abs(quantity), price, Sides.BUY, []);
    }
    
    /**
     * Reduces the size of the position through a LIMIT order.
     *
     * @param {number} quantity
     * @param {number} price
     * @param {string} side
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async reducePositionAt(quantity: number, price: number, side: string): Promise<Order> {
        $.validateSide(side);
        return await api.limitOrder(store.getState().config.tradingSymbol, Math.abs(quantity), price, side, [orderFlags.REDUCE_ONLY]);
    }
    
    /**
     * Sends a "Stop" order that is used to enter a position. (Tricky, right?)
     *
     * @param {string} side
     * @param {number} price
     * @param {number} quantity
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async startProfitAt(side: string, price: number, quantity: number): Promise<Order> {
        // validations 
        $.validateSide(side);
        if (side === 'buy' && price < store.getState().mainReducer.currentPrice) {
            throw new Error(`Invalid "price". A buy startProfit order must have a price higher than store.getState().mainReducer.currentPrice.`);
        } 
        if (side === 'sell' && price > store.getState().mainReducer.currentPrice) {
            throw new Error(`Invalid "price". A sell startProfit order must have a price lower than store.getState().mainReducer.currentPrice.`);
        }
        
        return await api.stopOrder(store.getState().config.tradingSymbol, Math.abs(quantity), price, side, []);
    }
    
    /**
     * Creates a STOP order. 
     *
     * @param {string} side
     * @param {number} price
     * @param {number} quantity
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async stopLossAt(side: string, price: number, quantity: number): Promise<Order> {
        $.validateSide(side);
        return await api.stopOrder(store.getState().config.tradingSymbol, Math.abs(quantity), price, side, []);
    }
    
    /**
     * Creates a TRAILING STOP order. 
     *
     * @param {string} side
     * @param {number} trailingPrice
     * @param {number} quantity
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async trailingStopOrder(side: string, trailingPrice: number, quantity: number): Promise<Order> {
        $.validateSide(side);
        return await api.trailingStopOrder(store.getState().config.tradingSymbol, Math.abs(quantity), trailingPrice, side, [orderFlags.REDUCE_ONLY]);
    }
    
    /**
     * Creates a STOP order that is used to close the position. 
     *
     * @param {string} side
     * @param {number} price
     * @param {number} quantity
     * @returns {Promise<Order>}
     * @memberof Trader
     */
    async closeAtStopLossAt(side: string, price: number, quantity: number): Promise<Order> {
        $.validateSide(side);
        return await api.stopOrder(store.getState().config.tradingSymbol, Math.abs(quantity), price, side, [orderFlags.CLOSE]);
    }
    
    /**
     * Cancels all previous orders for the trading symbol. 
     *
     * @memberof Trader
     */
    async cancelAllOrders() {
        await api.cancelAllOrders(); 
    }
    
    /**
     * Cancels a single order using its ID. 
     *
     * @param {number} orderID
     * @memberof Trader
     */
    async cancelOrder(orderID: number) {
        await api.cancelOrder(orderID); 
    }
}