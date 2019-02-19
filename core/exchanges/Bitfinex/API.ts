import crypto from 'crypto';
import _ from 'lodash';
import WebSocket from 'ws';
import APIInterface from '../../interfaces/APIInterface';
import { BitfinexError, BitfinexOrder, BitfinexPosition, CandlesChannel, orderTypes } from './types';
import config from '../../../config';
import $ from '../../services/Helpers';
import store, { actions, selectors } from '../../store';
import Order from '../../models/Order';
import { orderStatuses } from '../../store/types';
import currentPosition from '../../services/Positions';
import Candle from '../../models/Candle';

/**
 * To connect to Bitfinex's market via WS connection. Currently supports margin trading only.
 *
 * @class API
 * @implements {APIInterface}
 */
class API implements APIInterface {
    ws: WebSocket;
    initiallyOpened: boolean = false;
    isAuthenticated: boolean = false;
    subscribedCandleChannels: CandlesChannel[] = [];
    isSubmittingOrders: boolean = false;

    constructor() {
        this.init();
    }

    init() {
        if (!$.isLiveTrading()) return;

        this.ws = new WebSocket(config.exchanges.Bitfinex.baseURL);

        this.ws.on('open', () => {
            store.dispatch(
                actions.logWarning(
                    `Successfully ${this.initiallyOpened ? 'reconnected' : 'subscribed'} to ${
                        config.marketToTradeIn
                    } via WS.`
                )
            );

            this.initiallyOpened = true;

            if (!this.isAuthenticated) {
                this.authenticate()
                    .then(() => {
                        this.isAuthenticated = true;
                        store.dispatch(actions.logWarning(`Authenticated successfully.`));

                        // subscribe to fetch candles (all sizes for all symbols. Set from config file)
                        config.app.symbolsToConsider.forEach(symbol => {
                            config.app.timeFramesToConsider.forEach(timeFrame => {
                                this.subscribeToCandles(timeFrame, symbol);
                            });
                        });
                    })
                    .catch(errorMessage => {
                        store.dispatch(actions.logError(errorMessage));
                    });
            }
        });

        this.ws.on('close', () => {
            this.isAuthenticated = false;

            store.dispatch(actions.logWarning(`WS disconnected. Reconnecting...`));

            // retry after 1 seconds
            setTimeout(() => this.init(), 1000);
        });

        this.ws.on('error', error => {
            store.dispatch(actions.logError(`WS FAILED. ERROR: ${error}`));
        });

        this.ws.on('message', msg => {
            const data = JSON.parse(msg.toString());

            // new position
            if (Array.isArray(data) && data[0] === 0 && data[1] === 'pn') {
                this.openPosition(data[2]);
            }
            // position update:
            if (Array.isArray(data) && data[0] === 0 && data[1] === 'ps') {
                this.syncPositions(data[2]);
            }
            // position close:
            if (Array.isArray(data) && data[0] === 0 && data[1] === 'pc') {
                this.closePosition(data[2]);
            }

            // order cancel
            if (Array.isArray(data) && data[0] === 0 && data[1] === 'oc' && Array.isArray(data[2])) {
                this.handleOC(data[2]);
            }

            // order update
            if (Array.isArray(data) && data[0] === 0 && data[1] === 'ou' && Array.isArray(data[2])) {
                this.handleUpdatedOrder(data[2]);
            }

            // candles subscription
            if (data.event === 'subscribed' && data.channel === 'candles') {
                const channel: CandlesChannel = this.subscribedCandleChannels.find(item => item.key === data.key);

                // already exists (reconnecting), update
                if (!_.isUndefined(channel)) {
                    channel.id = data.chanId;
                }
                // first time subscribing
                else {
                    $.hardError('could not find the CandlesChannel. Something must be wrong. ');
                }
            }

            // new candles
            if (Array.isArray(data) && this.subscribedCandleChannels.findIndex(item => item.id === data[0]) !== -1) {
                this.handleNewCandles(data);
            }

            // info
            if (!_.isUndefined(data.code) && data.event === 'info') {
                const info: BitfinexError = data;

                // reconnect
                if (info.code === 20051) {
                    // TODO
                }
                // maintenance mode
                if (info.code === 20060) {
                    // TODO
                }
                // maintenance mode ended. Reconnect.
                if (info.code === 20061) {
                    // TODO
                }
            }

            // error
            if (data.event === 'error') {
                const error: BitfinexError = data;
                store.dispatch(actions.logError(`[${error.code}:${this.getError(error.code)}] ${error.msg}`));

                if (error.code === 10100) {
                    this.isAuthenticated = true;
                }
            }
        });
    }

    private handleUpdatedOrder(data: any[]) {
        const cid: number = data[2];
        const price: number = data[16];
        const amount: number = data[6];
        const updatedOrder: Order = selectors.getOrder(cid);

        updatedOrder.updatePrice(price);
        updatedOrder.updateQuantity(amount);
    }

    /**
     * Handles the "oc" message from Bitfinex. Could mean both order cancellation and execution.
     *
     * @private
     * @param {any[]} data
     * @memberof API
     */
    private handleOC(data: any[]): void {
        const cid: number = data[2];
        const order: Order = selectors.getOrder(cid);

        if (data[13].startsWith(orderStatuses.CANCELED)) {
            order.cancel();
        } else if (data[13].startsWith(orderStatuses.EXECUTED)) {
            order.execute();
        }
    }

    /**
     * Close position.
     * TODO: support more than one position.
     *
     * @param data any[]
     */
    private closePosition(data: any[]) {
        const pos: BitfinexPosition = this.transformPositionData(data);
        // console.log(`Closing position`);
        // console.log(pos);

        if (currentPosition.symbol() === pos.symbol) {
            store.dispatch(actions.updateQuantity(0));
        }
    }

    /**
     * keeps the open positions synced.
     * TODO: support more than one position.
     *
     * @param data any[]
     */
    private syncPositions(data: any[]) {
        const positions: BitfinexPosition[] = [];

        data.forEach(item => positions.push(this.transformPositionData(item)));

        positions.forEach(pos => {
            if (pos.symbol === currentPosition.symbol()) {
                store.dispatch(actions.updateQuantity(pos.amount));
                store.dispatch(actions.updateEntryPrice(pos.basePrice));
            }
        });
    }

    /**
     * Opens a new position.
     * TODO: handle multiple positions.
     *
     * @param data any[]
     */
    private openPosition(data: any[]) {
        const pos: BitfinexPosition = this.transformPositionData(data);
        
        store.dispatch(actions.updateQuantity(pos.amount));
        store.dispatch(actions.updateEntryPrice(pos.basePrice));
    }

    /**
     * handles new candle(s) received over the WS connection.
     *
     * @param data any[]
     */
    private handleNewCandles(data: any[]) {
        const channel: CandlesChannel = this.subscribedCandleChannels.find(item => item.id === data[0]);

        // it's a single candle
        if (data[1].length > 1 && Array.isArray(data[1]) && !Array.isArray(data[1][0])) {
            const rawCandle = data[1];
            const candle: Candle = new Candle({
                symbol: channel.symbol,
                timeFrame: channel.timeFrame,
                timestamp: $.transformTimestamp(rawCandle[0]),
                open: rawCandle[1],
                close: rawCandle[2],
                high: rawCandle[3],
                low: rawCandle[4],
                volume: rawCandle[5]
            });

            // don't add it if it's not bigger than the "last-1" candle
            if (candle.timestamp > selectors.getPastCandleFor(1, candle.symbol, candle.timeFrame).timestamp) {
                store.dispatch(actions.addCandle(candle));
            }
        }

        // it's a batch of candles (for the first time, AND on reconnects)
        else if (data[1].length > 1 && Array.isArray(data[1])) {
            let rawCandles: any[] = data[1];
            rawCandles = rawCandles.reverse();
            let transformedCandles: Candle[] = [];
            for (let index = 0; index < rawCandles.length; index++) {
                transformedCandles.push(
                    new Candle({
                        symbol: channel.symbol,
                        timeFrame: channel.timeFrame,
                        timestamp: $.transformTimestamp(rawCandles[index][0]),
                        open: rawCandles[index][1],
                        close: rawCandles[index][2],
                        high: rawCandles[index][3],
                        low: rawCandles[index][4],
                        volume: rawCandles[index][5]
                    })
                );
            }

            // add batch of candles:
            store.dispatch(actions.batchAddCandles(transformedCandles));
            // add the very last candle in case it's starting of the bot and
            // we intend to submit orders at the very beginning as well.
            // don't worry, duplicate won't get actually added:
            store.dispatch(actions.addCandle(transformedCandles[transformedCandles.length - 1]));
        }
    }

    subscribeToCandles(timeFrame: string, symbol: string) {
        $.validateSymbol(symbol);
        $.validateTimeFrame(timeFrame);

        const key: string = `trade:${timeFrame}:t${symbol}`;

        this.ws.send(
            JSON.stringify({
                event: 'subscribe',
                channel: 'candles',
                key
            })
        );

        const channel: CandlesChannel = this.subscribedCandleChannels.find(item => item.key === key);
        // already exists (reconnecting), update
        if (!_.isUndefined(channel)) {
            channel.id = null;
        }
        // first time subscribing
        else {
            this.subscribedCandleChannels.push({
                id: null,
                key: key,
                name: 'candles',
                symbol,
                timeFrame
            });
        }
    }

    authenticate() {
        const apiKey = config.exchanges.Bitfinex.apiKey;
        const apiSecret = config.exchanges.Bitfinex.apiSecret;
        const authNonce = Date.now() * 1000;
        const authPayload = 'AUTH' + authNonce;
        const hmac = crypto.createHmac('sha384', apiSecret);
        hmac.update(authPayload);
        const authSig = hmac.digest('hex');

        return new Promise((resolve, reject) => {
            this.ws.on('message', msg => {
                const data = JSON.parse(msg.toString());

                if (data.event === 'auth') {
                    if (data.status === 'OK') {
                        resolve();
                    } else if (data.status === 'FAILED') {
                        reject(`[${data.code}:${this.getError(data.code)}] ${data.msg}`);
                    }
                }
            });

            this.ws.send(
                JSON.stringify({
                    apiKey,
                    authSig,
                    authNonce,
                    authPayload,
                    event: 'auth'
                })
            );
        });
    }

    /**
     * (liveTrade only) Submits the order to the Bitfinex.
     *
     * @param order Order
     */
    private async submitOrder(order: BitfinexOrder) {
        // validations
        if (!this.isAuthenticated) {
            store.dispatch(actions.logError('not authenticated'));
            return Promise.reject(new Error('not authenticated'));
        }
        $.validateSymbol(order.symbol);

        // to prevent duplicate order submissions
        if (this.isSubmittingOrders) return;
        this.isSubmittingOrders = true;

        return new Promise((resolve, reject) => {
            this.ws.on('message', msg => {
                const data = JSON.parse(msg.toString());

                if (Array.isArray(data) && data[0] === 0 && data[1] === 'n' && Array.isArray(data[2])) {
                    if (data[2][1] === 'on-req' && Array.isArray(data[2][4]) && data[2][4][2] === order.cid) {
                        const message: string = data[2][data[2].length - 1];

                        // success
                        if (data[2][data[2].length - 2] === 'SUCCESS') {
                            this.isSubmittingOrders = false;
                            resolve(message);
                        }

                        // fail
                        else if (data[2][data[2].length - 2] === 'ERROR') {
                            this.isSubmittingOrders = false;
                            reject(message);
                        }
                    }
                }
            });

            this.ws.send(
                JSON.stringify([
                    0,
                    'on',
                    null,
                    Object.assign(
                        {
                            // TODO: gid should be dynamic when supporting multiple strategies and stuff.
                            gid: 1,
                            cid: order.cid,
                            type: order.type,
                            symbol: 't' + order.symbol,
                            amount: `${order.amount}`,
                            flags: this.getOrderFlags(order.flags)
                        },
                        order.type !== orderTypes.EXCHANGE ? { price: `${order.price}` } : null,
                        order.type === orderTypes.TRAILING_STOP ? { price_trailing: `${order.price_trailing}` } : null,
                        order.type === orderTypes.STOP_LIMIT ? { price_aux_limit: `${order.price_aux_limit}` } : null,
                        !_.isUndefined(order.price_oco_stop) ? { price_oco_stop: `${order.price_oco_stop}` } : null
                    )
                ])
            );
        });
    }

    /**
     * Submits a EXCHANGE order to the market.
     *
     * @param symbol string
     * @param quantity number
     * @param side string
     * @param flags string[]
     */
    async marketOrder(symbol: string, quantity: number, side: string, flags: string[] = []): Promise<Order> {
        let amount = $.prepareQuantity(quantity, side);

        const order: Order = new Order({
            id: $.generateUniqueID(),
            symbol,
            side,
            type: orderTypes.EXCHANGE,
            flag: this.getExecInst(flags),
            quantity: amount,
            price: store.getState().mainReducer.currentPrice,
            status: 'EXECUTED'
        });

        if ($.isBackTesting()) {
            return new Promise<Order>(resolve => {
                store.dispatch(actions.addOrder(order));

                $.printToConsole(
                    `Executed a ${order.side} ${order.type} order at the price of ${order.price} for the quantity of ${
                        order.quantity
                    }`,
                    'green'
                );

                resolve(order);
            });
        }

        const orderToSubmit: BitfinexOrder = {
            cid: order.id,
            symbol,
            amount,
            type: order.type,
            flags
        };

        await this.submitOrder(orderToSubmit);

        store.dispatch(actions.addOrder(order));
        return order;
    }

    /**
     * Submits a LIMIT order to the market.
     *
     * @param symbol string
     * @param quantity number
     * @param price number
     * @param side string
     * @param flags string[]
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

        if ($.isBackTesting()) {
            return new Promise<Order>(resolve => {
                store.dispatch(actions.addOrder(order));
                resolve(order);
            });
        }

        const orderToSubmit: BitfinexOrder = {
            cid: order.id,
            symbol,
            amount,
            type: order.type,
            price,
            flags
        };

        await this.submitOrder(orderToSubmit);

        store.dispatch(actions.addOrder(order));
        return order;
    }

    /**
     * Submits a TRAILING STOP order to the market.
     *
     * @param symbol string
     * @param quantity number
     * @param price number
     * @param trailingPrice number
     * @param side string
     * @param flags string[]
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

        if ($.isBackTesting()) {
            return new Promise<Order>((resolve, reject) => {
                store.dispatch(actions.addOrder(order));
                resolve(order);
            });
        }

        const orderToSubmit: BitfinexOrder = {
            cid: order.id,
            symbol,
            amount,
            type: order.type,
            flags,
            price_trailing: order.trailingPrice
        };

        await this.submitOrder(orderToSubmit);

        store.dispatch(actions.addOrder(order));
        return order;
    }

    /**
     * Submits a STOP order to the market.
     *
     * @param symbol string
     * @param quantity number
     * @param price number
     * @param side string
     * @param flags string[]
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

        if ($.isBackTesting()) {
            return new Promise<Order>(resolve => {
                store.dispatch(actions.addOrder(order));
                resolve(order);
            });
        }

        const orderToSubmit: BitfinexOrder = {
            cid: order.id,
            symbol,
            amount,
            type: order.type,
            price,
            flags
        };

        await this.submitOrder(orderToSubmit);

        store.dispatch(actions.addOrder(order));
        return order;
    }

    /**
     * Cancels all the active orders.
     */
    async cancelAllOrders() {
        return new Promise((resolve, reject) => {
            if ($.isBackTesting()) {
                store
                    .getState()
                    .orders.filter(item => item.isNew())
                    .forEach(item => item.cancel());

                resolve(`${selectors.countOfActiveOrders()} orders have been successfully cancelled.`);
            } else if ($.isLiveTrading()) {
                const activeOrders: Order[] = store.getState().orders.filter(item => item.isActive());

                activeOrders.forEach(async order => {
                    await this.cancelOrder(order.id);
                });

                resolve(`${selectors.countOfActiveOrders()} orders have been successfully cancelled.`);
            }
        });
    }

    /**
     * Cancels a single order.
     *
     * @param orderID
     */
    async cancelOrder(orderID: number) {
        const order: Order = selectors.getOrder(orderID);

        return new Promise((resolve, reject) => {
            if ($.isBackTesting()) {
                order.cancel();
                resolve(
                    `The ${order.side} ${order.type} order at the price of ${order.price} for the quantity of ${
                        order.quantity
                    } has been successfully canceled.`
                );
            } else if ($.isLiveTrading()) {
                this.ws.on('message', msg => {
                    const data = JSON.parse(msg.toString());

                    if (Array.isArray(data) && data[0] === 0 && data[1] === 'n' && Array.isArray(data[2])) {
                        if (data[2][1] === 'on-req' && Array.isArray(data[2][4]) && data[2][4][2] === order.id) {
                            const message: string = data[2][data[2].length - 1];

                            // success
                            if (data[2][data[2].length - 2] === 'SUCCESS') {
                                order.cancel();
                                resolve(message);
                            }

                            // fail
                            else if (data[2][data[2].length - 2] === 'ERROR') {
                                reject(message);
                            }
                        }
                    }
                });

                this.ws.send(
                    JSON.stringify([
                        0,
                        'oc',
                        null,
                        {
                            cid: order.id,
                            cid_date: $.date(order.createdAt)
                        }
                    ])
                );
            }
        });
    }

    /**
     * Detect the flag from the flags[] array.
     *
     * @param flags string[]
     */
    private getExecInst(flags: string[]): string {
        if (_.includes(flags, 'ReduceOnly')) return 'ReduceOnly';
        if (_.includes(flags, 'Close')) return 'Close';
        return null;
    }

    getOrderFlags(flags: string[]): number {
        const ReduceOnly: number = _.includes(flags, 'ReduceOnly') ? 2 ** 10 : 0;
        const Close: number = _.includes(flags, 'Close') ? 2 ** 9 : 0;
        const OCO: number = _.includes(flags, 'OCO') ? 2 ** 14 : 0;
        const Hidden: number = _.includes(flags, 'Hidden') ? 2 ** 6 : 0;
        const PostOnly: number = _.includes(flags, 'PostOnly') ? 2 ** 12 : 0;

        return ReduceOnly + Close + OCO + Hidden + PostOnly;
    }

    /**
     * translates the error using it's code number.
     *
     * @param code number
     */
    getError(code: number): string {
        switch (code) {
            case 11000:
                return 'Not ready, try again later';
            case 10200:
                return 'Error in un-authentication request';
            case 10114:
                return 'Error in authentication request nonce';
            case 10112:
                return 'Error in authentication request signature';
            case 10113:
                return 'Error in authentication request encryption';
            case 10111:
                return 'Error in authentication request payload';
            case 10100:
                return 'Failed authentication';
            case 10050:
                return 'Configuration setup failed';
            case 10020:
                return 'Request parameters error';
            case 10000:
                return 'Unknown event';
            case 10001:
                return 'Unknown pair';
            case 10305:
                return 'Reached limit of open channels';
            case 10300:
                return 'Subscription failed (generic)';
            case 10301:
                return 'Already subscribed';
            case 10302:
                return 'Unknown channel';
            case 10400:
                return 'Subscription failed (generic) channel not found';
            case 10401:
                return 'Not subscribed';
            case 20051:
                return 'Stop/Restart Websocket Server (please reconnect)';
            case 20060:
                return 'Entering in Maintenance mode. Please pause any activity and resume after receiving the info message 20061 (it should take 120 seconds at most).';
            case 20061:
                return 'Maintenance ended. You can resume normal activity. It is advised to unsubscribe/subscribe again all channels.';
            case 5000:
                return 'Info message';

            default:
                return 'unknown error';
        }
    }

    private transformPositionData(data: any[]): BitfinexPosition {
        return {
            symbol: data[0][0] === 't' ? data[0].slice(1) : data[0],
            status: data[1],
            amount: data[2],
            basePrice: data[3],
            marginFunding: data[4],
            marginFundingType: data[5],
            pl: data[6],
            plPercentage: data[7],
            priceLiq: data[8],
            leverage: data[9]
        };
    }
}

const api: API = new API();
export default api;
