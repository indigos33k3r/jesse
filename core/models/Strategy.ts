import $ from '../services/Helpers';
import currentPosition from '../services/Positions';
import store, { actions, selectors } from '../store';
import { Sides, tradeLogTypes, TradeTypes } from '../store/types';
import Order from './Order';
import Trade from './Trade';
import _ from 'lodash';
import Event from '../services/Event';
import EventDataInterface from '../interfaces/EventDataInterface';
import Trader from './Trader';

export default abstract class Strategy {
    name: string;
    version: string;
    trader: Trader;
    buyPrice: number;
    sellPrice: number;
    closePrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    reducePositionPrice: number;
    trade: Trade;
    // a flag used to prevent duplications 
    isExecuting: boolean = false;
    minimumRequiredCandle: number;

    stopLossOrder: Order;
    openPositionOrder: Order;
    takeProfitOrder: Order; 
    increasePositionOrder: Order; 
    reducePositionOrder: Order; 
    
    /**
     * to handle executed orders. If you need more types of 
     * orders than has been defined in this class, then 
     * you must also overwrite this method as well. 
     *
     * @param {EventDataInterface} data
     * @memberof Strategy
     */
    async handleExecutedOrder(data: EventDataInterface) {
        // in case you're overwriting this method, don't forget to include this line
        if ($.isBackTesting()) this.impactExecutedOrderOnPositionWhenBacktesting(data); 

        if (!_.isUndefined(this.openPositionOrder) && data.order.id === this.openPositionOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.OPEN_POSITION);
            await this.onOpenPosition();
        } 

        else if (!_.isUndefined(this.stopLossOrder) && data.order.id === this.stopLossOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.CLOSE_POSITION); 
            await this.onStopLoss(); 
        }

        else if (!_.isUndefined(this.takeProfitOrder) && data.order.id === this.takeProfitOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.CLOSE_POSITION); 
            await this.onTakeProfit(); 
        }
        
        else if (!_.isUndefined(this.increasePositionOrder) && data.order.id === this.increasePositionOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.INCREASE_POSITION); 
            await this.onIncreasedPosition();    
        }
        
        else if (!_.isUndefined(this.reducePositionOrder) && data.order.id === this.reducePositionOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.REDUCE_POSITION); 
            await this.onReducedPosition(); 
        }
    };

    /**
     * This method figures what effect must the executed order have on the 
     * position and the general store, and impacts it. The reason we use
     * it only when backTesting is that when liveTrading, we fetch the
     * position data from the market itself instead of calculating 
     * it ourselves. Maybe we should reconsider this?! 
     *
     * @param {EventDataInterface} data
     * @memberof Strategy
     */
    impactExecutedOrderOnPositionWhenBacktesting(data: EventDataInterface) {
        if (!_.isUndefined(this.openPositionOrder) && data.order.id === this.openPositionOrder.id) {
            store.dispatch(actions.reduceCurrentBalance(Math.abs(data.order.quantity) * data.order.price));
            store.dispatch(
                actions.updateEntryPrice(
                    $.estimateAveragePrice(
                        data.order.quantity,
                        data.order.price,
                        store.getState().mainReducer.quantity,
                        store.getState().mainReducer.entryPrice
                    )
                )
            );
            store.dispatch(actions.addQuantity(data.order.quantity));
        } 

        else if (!_.isUndefined(this.stopLossOrder) && data.order.id === this.stopLossOrder.id) {
            currentPosition.close(data.order.price);
        }

        else if (!_.isUndefined(this.takeProfitOrder) && data.order.id === this.takeProfitOrder.id) {
            currentPosition.close(data.order.price);
        }

        else if (!_.isUndefined(this.increasePositionOrder) && data.order.id === this.increasePositionOrder.id) {
            store.dispatch(actions.reduceCurrentBalance(Math.abs(data.order.quantity) * data.order.price));
            store.dispatch(
                actions.updateEntryPrice(
                    $.estimateAveragePrice(
                        data.order.quantity,
                        data.order.price,
                        store.getState().mainReducer.quantity,
                        store.getState().mainReducer.entryPrice
                    )
                )
            );
            store.dispatch(actions.addQuantity(data.order.quantity));
        }

        else if (!_.isUndefined(this.reducePositionOrder) && data.order.id === this.reducePositionOrder.id) {
            currentPosition.reduce(data.order.quantity, data.order.price);
        }
    }

    /**
     * Resets everything so that the strategy can keep looking for new trades. 
     * Overwrite this method inside your own strategy if you need otherwise. 
     *
     * @memberof Strategy
     */
    async reset() {
        await this.trader.cancelAllOrders();

        this.stopLossOrder = undefined;
        this.openPositionOrder = undefined;
        this.takeProfitOrder = undefined; 
        this.increasePositionOrder = undefined; 
        this.reducePositionOrder = undefined; 
    }
    
    /**
     * What should get updated after each new candle? 
     * 
     * @memberof Strategy
     */
    async update() {}

    /**
     * Based on the newly calculated information, check if we should take action or not.
     *
     * @abstract
     * @memberof Strategy
     */
    abstract check();

    /**
     * What should happen after the openPositionOrder is executed and a new position has been opened. 
     * Overwrite this method inside your own strategy if you need otherwise. 
     *
     * @memberof Strategy
     */
    async onOpenPosition() {
        if ($.isDebugging()) {
            store.dispatch(actions.logWarning(`Detected open position. Setting stops now:`));
        }

        if (currentPosition.type() === TradeTypes.LONG) {
            this.stopLossOrder = await this.trader.stopLossAt(
                Sides.SELL, 
                this.stopLossPrice,
                this.openPositionOrder.quantity
            );  

            this.takeProfitOrder = await this.trader.sellAt(this.openPositionOrder.quantity, this.takeProfitPrice); 
        } else {
            this.stopLossOrder = await this.trader.stopLossAt(
                Sides.BUY,
                this.stopLossPrice,
                this.openPositionOrder.quantity
            );  

            this.takeProfitOrder = await this.trader.buyAt(this.openPositionOrder.quantity, this.takeProfitPrice); 
        }

        this.openPositionOrder = undefined;
    }

    /**
     * What should happen after the stopLoss order has been executed. 
     *
     * @memberof Strategy
     */
    async onStopLoss() {
        if ($.isDebugging()) {
            store.dispatch(
                actions.logWarning(`StopLoss has been executed. Looking for next trade...`)
            );
        }

        await this.reset();
    };

    /**
     * What should happen after the takeProfit order is executed. 
     *
     * @memberof Strategy
     */
    async onTakeProfit() {
        if ($.isDebugging()) {
            store.dispatch(actions.logWarning(`Sweet! Take profit order has been executed. Let's look for the next hunt.`));
        }
        
        await this.reset();
    };

    /**
     * What should happen after the order (if any) increasing the 
     * size of the position is executed. Overwrite it if needed. 
     * And leave it be if your strategy doesn't require it. 
     *
     * @memberof Strategy
     */
    async onIncreasedPosition() {}

    /**
     * What should happen after the order (if any) reducing the 
     * size of the position is executed. Overwrite it if needed. 
     * And leave it be if your strategy doesn't require it. 
     *
     * @memberof Strategy
     */
    async onReducedPosition() {}

    /**
     * Creates an instance of Strategy.
     * 
     * @param {string} name
     * @param {string} version
     * @param {number} minimumRequiredCandle
     * @memberof Strategy
     */
    constructor(name: string, version: string, minimumRequiredCandle: number = 0) {
        this.name = name;
        this.version = version;
        this.minimumRequiredCandle = minimumRequiredCandle; 
    }
    
    /**
     * Initially prepare the strategy. 
     *
     * @memberof Strategy
     */
    async init() {
        this.trader = new Trader(); 

        // listen for order execution events. (For liveTrade we do it manually.)
        if ($.isLiveTrading()) {
            Event.on('orderExecuted', this.handleExecutedOrder.bind(this));
        }
    } 

    /**
     * Handles the execution permission for the strategy. 
     *
     * @memberof Strategy
     */
    async execute() {
        // return while there isn't enough candles to execute the strategy
        if (selectors.getTradingCandles().length < this.minimumRequiredCandle) {
            store.dispatch(actions.logWarning(`${this.constructor.name} requires ${this.minimumRequiredCandle} candles to begin executing, but there's only ${selectors.getTradingCandles().length} candles present.`)); 
            return; 
        }

        if (this.isExecuting === true) return;

        // make sure we don't execute this strategy more than once at the same time.
        this.isExecuting = true;

        await this.update();
        await this.check();

        this.isExecuting = false;
    }

    /**
     * Optional for executing code after completion of a backTest. 
     * This block will not execute in live use as a live 
     * Jesse is never ending.
     *
     * @memberof Strategy
     */
    end(): void {
        try {
            if ($.isBackTesting()) {
                currentPosition.close(store.getState().mainReducer.entryPrice);

                if ($.isDebugging()) {
                    store.dispatch(
                        actions.logWarning(
                            `Finished backTest. Closed the last order at opening price to exclude it from the stats (since it's incomplete, hence being inaccurate).`
                        )
                    );
                }
            }
        } catch (error) {
            store.dispatch(actions.logError(error));
        }
    }

    /**
     * A log can be either about opening, adding, reducing, or closing the position.
     *
     * @param {string} time
     * @param {Order} order
     * @param {string} logType
     * @param {string} [description]
     * @memberof Strategy
     */
    log(time: string, order: Order, logType: string) {
        // TODO: if reduce is causing the position to close, 
        // change it to close

        switch (logType) {
            case tradeLogTypes.OPEN_POSITION:
                this.trade = new Trade();
                this.trade.orders = [order];
                this.trade.id = order.id;
                this.trade.strategy = this.name;
                this.trade.strategyVersion = this.version;
                this.trade.symbol = order.symbol;
                this.trade.type = order.side === Sides.BUY ? TradeTypes.LONG : TradeTypes.SHORT;
                this.trade.entryPrice = order.price;
                this.trade.stopLossPrice = this.stopLossPrice; 
                this.trade.openedAt = time;
                break;

            case tradeLogTypes.INCREASE_POSITION:
                this.trade.orders.push(order);
                this.trade.entryPrice = $.estimateAveragePrice(
                    order.quantity, order.price, this.trade.quantity, this.trade.entryPrice
                );
                this.trade.quantity += order.quantity; 
                break;

            case tradeLogTypes.REDUCE_POSITION:
                this.trade.orders.push(order);
                this.trade.exitPrice = $.estimateAveragePrice(
                    order.quantity, order.price, this.trade.quantity, this.trade.entryPrice
                );
                break;

            case tradeLogTypes.CLOSE_POSITION:
                this.trade.orders.push(order);
                if (! this.trade.exitPrice) {
                    this.trade.exitPrice = order.price; 
                } else {
                    this.trade.exitPrice = $.estimateAveragePrice(
                        order.quantity, order.price, this.trade.quantity, this.trade.entryPrice
                    );
                } 
                this.trade.closedAt = time;
                this.trade.quantity = _.sumBy(
                    this.trade.orders.filter(item => item.side === $.typeToSide(this.trade.type)), item => Math.abs(item.quantity)
                );
                this.trade.fee = store.getState().mainReducer.tradingFee * this.trade.quantity * (this.trade.entryPrice + this.trade.exitPrice);
                this.trade.takeProfitPrice = this.takeProfitPrice; 

                store.dispatch(actions.addTrade(this.trade));
                this.trade = undefined;
                break;

            default:
                throw new Error('unsupported tradeLogType');
        }
    }
}
