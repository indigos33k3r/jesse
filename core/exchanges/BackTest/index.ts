import Order from "../../models/Order";
import $ from "../../services/Helpers";
import store, { actions, selectors } from "../../store";
import { orderStatuses } from "../../store/types";
import { orderTypes } from "../Bitfinex/types";
import Exchange from "../Exchange";

/**
 * A simulated the market, to be used in backTesting. 
 *
 * @export
 * @class BackTest
 * @extends {Exchange}
 */
export default class BackTest extends Exchange {
    /**
     * Submits a MARKET order to the market.
     *
     * @param {string} symbol
     * @param {number} quantity
     * @param {string} side
     * @param {string[]} [flags=[]]
     * @returns {Promise<Order>}
     * @memberof BackTest
     */
    async marketOrder(symbol: string, quantity: number, side: string, flags: string[] = []): Promise<Order> {
        let amount = $.prepareQuantity(quantity, side);

        const order: Order = new Order({
            id: $.generateUniqueID(),
            symbol,
            side,
            type: orderTypes.MARKET,
            flag: this.getExecInst(flags),
            quantity: amount,
            price: store.getState().mainReducer.currentPrice,
            status: 'EXECUTED'
        });

        return new Promise<Order>(resolve => {
            store.dispatch(actions.addOrder(order));

            resolve(order);
        });
    }
    
    /**
     * Submits a LIMIT order to the market.
     *
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} price
     * @param {string} side
     * @param {string[]} [flags=[]]
     * @returns {Promise<Order>}
     * @memberof BackTest
     */
    async limitOrder(
        symbol: string,
        quantity: number,
        price: number,
        side: string,
        flags: string[] = []
    ): Promise<Order> {
        let amount = $.prepareQuantity(quantity, side);

        const order: Order = new Order({
            id: $.generateUniqueID(),
            symbol,
            side,
            type: orderTypes.LIMIT,
            flag: this.getExecInst(flags),
            quantity: amount,
            price,
            status: orderStatuses.ACTIVE
        });

        return new Promise<Order>(resolve => {
            store.dispatch(actions.addOrder(order));
            resolve(order);
        });
    }
    
    /**
     * Submits a TRAILING STOP order to the market.
     *
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} trailingPrice
     * @param {string} side
     * @param {string[]} [flags=[]]
     * @returns {Promise<Order>}
     * @memberof BackTest
     */
    async trailingStopOrder(
        symbol: string,
        quantity: number,
        trailingPrice: number,
        side: string,
        flags: string[] = []
    ): Promise<Order> {
        let amount = $.prepareQuantity(quantity, side);

        const order: Order = new Order({
            id: $.generateUniqueID(),
            symbol,
            side,
            type: orderTypes.TRAILING_STOP,
            flag: this.getExecInst(flags),
            quantity: amount,
            price:
                side === 'buy'
                    ? store.getState().mainReducer.currentPrice + trailingPrice
                    : store.getState().mainReducer.currentPrice - trailingPrice,
            trailingPrice,
            status: 'ACTIVE'
        });

        return new Promise<Order>((resolve, reject) => {
            store.dispatch(actions.addOrder(order));
            resolve(order);
        });
    }
    
    /**
     * Submits a STOP order to the market.
     *
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} price
     * @param {string} side
     * @param {string[]} [flags=[]]
     * @returns {Promise<Order>}
     * @memberof BackTest
     */
    async stopOrder(
        symbol: string,
        quantity: number,
        price: number,
        side: string,
        flags: string[] = []
    ): Promise<Order> {
        let amount = $.prepareQuantity(quantity, side);

        const order: Order = new Order({
            id: $.generateUniqueID(),
            symbol,
            side,
            type: orderTypes.STOP,
            flag: this.getExecInst(flags),
            quantity: amount,
            price,
            status: 'ACTIVE'
        });

        return new Promise<Order>(resolve => {
            store.dispatch(actions.addOrder(order));
            resolve(order);
        });
    }
    
    /**
     * Cancels all the active orders.
     *
     * @returns
     * @memberof BackTest
     */
    async cancelAllOrders(): Promise<string> {
        return new Promise((resolve, reject) => {
            store
                .getState()
                .orders.filter(item => item.isNew())
                .forEach(item => item.cancel());

            resolve(`${selectors.countOfActiveOrders()} orders have been successfully cancelled.`);
        });
    }
    
    /**
     * Cancels a single order.
     *
     * @param {number} orderID
     * @returns
     * @memberof BackTest
     */
    async cancelOrder(orderID: number): Promise<string> {
        const order: Order = selectors.getOrder(orderID);

        return new Promise((resolve, reject) => {
            order.cancel();
            resolve(
                `The ${order.side} ${order.type} order at the price of ${order.price} for the quantity of ${
                    order.quantity
                } has been successfully canceled.`
            );
        });
    }   
}
