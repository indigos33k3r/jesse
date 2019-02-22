import Order from "../models/Order";
import _ from 'lodash';

export default abstract class Exchange {
    /**
     * Submits a MARKET order to the market. 
     *
     * @abstract
     * @param {string} symbol
     * @param {number} quantity
     * @param {string} side
     * @param {string[]} flags
     * @returns {Promise<Order>}
     * @memberof Exchange
     */
    abstract marketOrder(symbol: string, quantity: number, side: string, flags: string[]): Promise<Order>;
    
    /**
     * Submits a LIMIT order to the market. 
     *
     * @abstract
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} price
     * @param {string} side
     * @param {string[]} flags
     * @returns {Promise<Order>}
     * @memberof Exchange
     */
    abstract limitOrder(symbol: string, quantity: number, price: number, side: string, flags: string[]): Promise<Order>;
    
    /**
     * Submits a TRAILING STOP order to the market.
     *
     * @abstract
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} trailingPrice
     * @param {string} side
     * @param {string[]} flags
     * @returns {Promise<Order>}
     * @memberof Exchange
     */
    abstract trailingStopOrder(symbol: string, quantity: number, trailingPrice: number, side: string, flags: string[]): Promise<Order>;
    
    /**
     * Submits a STOP order to the market. 
     *
     * @abstract
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} price
     * @param {string} side
     * @param {string[]} flags
     * @returns {Promise<Order>}
     * @memberof Exchange
     */
    abstract stopOrder(symbol: string, quantity: number, price: number, side: string, flags: string[]): Promise<Order>;
    
    /**
     * Cancels all the active orders. 
     *
     * @abstract
     * @returns {Promise<string>}
     * @memberof Exchange
     */
    abstract cancelAllOrders(): Promise<string>;
    
    /**
     * Cancels a single order. 
     *
     * @abstract
     * @param {number} orderID
     * @returns {Promise<string>}
     * @memberof Exchange
     */
    abstract cancelOrder(orderID: number): Promise<string>; 
    
    /**
     * Detect the flag from the flags[] array.
     *
     * @protected
     * @param {string[]} flags
     * @returns {string}
     * @memberof Exchange
     */
    protected getExecInst(flags: string[]): string {
        if (_.includes(flags, 'ReduceOnly')) return 'ReduceOnly';
        if (_.includes(flags, 'Close')) return 'Close';
        
        return null;
    }
}