import $ from "../Helpers";
import Exchange from "../../exchanges/Exchange";
import BackTest from "../../exchanges/BackTest";
import Bitfinex from "../../exchanges/Bitfinex";
import Order from "../../models/Order";
import config from "../../../config";

class API {
    driver: Exchange; 

    constructor() {
        if ($.isLiveTrading()) {
            if (config.exchanges.marketToTradeIn.toLowerCase() === 'bitfinex') {
                this.driver = new Bitfinex(); 
            }
        } else {
            this.driver = new BackTest(); 
        }
    }

    /**
     * Submits a MARKET order to the market. 
     *
     * @param {string} symbol
     * @param {number} quantity
     * @param {string} side
     * @param {string[]} flags
     * @returns {Promise<Order>}
     * @memberof API
     */
    marketOrder(symbol: string, quantity: number, side: string, flags: string[]): Promise<Order> {
        return this.driver.marketOrder(symbol, quantity, side, flags);
    }

    /**
     * Submits a LIMIT order to the market. 
     *
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} price
     * @param {string} side
     * @param {string[]} flags
     * @returns {Promise<Order>}
     * @memberof API
     */
    limitOrder(symbol: string, quantity: number, price: number, side: string, flags: string[]): Promise<Order> {
        return this.driver.limitOrder(symbol, quantity, price, side, flags);
    }

    /**
     * Submits a TRAILING STOP order to the market.
     *
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} trailingPrice
     * @param {string} side
     * @param {string[]} flags
     * @returns {Promise<Order>}
     * @memberof API
     */
    trailingStopOrder(symbol: string, quantity: number, trailingPrice: number, side: string, flags: string[]): Promise<Order> {
        return this.driver.trailingStopOrder(symbol, quantity, trailingPrice, side, flags);
    }

    /**
     * Submits a STOP order to the market. 
     *
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} price
     * @param {string} side
     * @param {string[]} flags
     * @returns {Promise<Order>}
     * @memberof API
     */
    stopOrder(symbol: string, quantity: number, price: number, side: string, flags: string[]): Promise<Order> {
        return this.driver.stopOrder(symbol, quantity, price, side, flags);
    }

    /**
     * Cancels all the active orders. 
     *
     * @returns {Promise<string>}
     * @memberof API
     */
    cancelAllOrders(): Promise<string> {
        return this.driver.cancelAllOrders();
    }

    /**
     * Cancels a single order. 
     *
     * @param {number} orderID
     * @returns {Promise<string>}
     * @memberof API
     */
    cancelOrder(orderID: number): Promise<string> {
        return this.driver.cancelOrder(orderID);
    }
}

const api = new API(); 
export default api;