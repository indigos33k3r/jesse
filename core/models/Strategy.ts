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
import Logger from '../services/Logger';
import Indicators from '../services/Indicators';

export default abstract class Strategy {
    name: string;
    version: string;
    trader: Trader;
    indicators: Indicators;
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
        this.indicators = new Indicators(); 
    }
    
    /**
     * to handle executed orders. If you need more types of 
     * orders than has been defined in this class, then 
     * you must also overwrite this method as well. 
     *
     * @param {EventDataInterface} data
     * @memberof Strategy
     */
    async handleExecutedOrder(data: EventDataInterface) {
        // in case you're overwriting this method, DON'T FORGET to include this line
        if ($.isBackTesting()) {
            this.impactExecutedOrderOnPositionWhenBacktesting(data); 
        }

        if ($.isDefined(this.openPositionOrder) && data.order.id === this.openPositionOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.OPEN_POSITION);
            await this.onOpenPosition();
        } 

        else if ($.isDefined(this.stopLossOrder) && data.order.id === this.stopLossOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.CLOSE_POSITION); 
            await this.onStopLoss(); 
        }

        else if ($.isDefined(this.takeProfitOrder) && data.order.id === this.takeProfitOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.CLOSE_POSITION); 
            await this.onTakeProfit(); 
        }
        
        else if ($.isDefined(this.increasePositionOrder) && data.order.id === this.increasePositionOrder.id) {
            this.log(data.time, data.order, tradeLogTypes.INCREASE_POSITION); 
            await this.onIncreasedPosition();    
        }
        
        else if ($.isDefined(this.reducePositionOrder) && data.order.id === this.reducePositionOrder.id) {
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
        if ($.isDefined(this.openPositionOrder) && data.order.id === this.openPositionOrder.id) {
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

        else if ($.isDefined(this.stopLossOrder) && data.order.id === this.stopLossOrder.id) {
            currentPosition.close(data.order.price);
        }

        else if ($.isDefined(this.takeProfitOrder) && data.order.id === this.takeProfitOrder.id) {
            currentPosition.close(data.order.price);
        }

        else if ($.isDefined(this.increasePositionOrder) && data.order.id === this.increasePositionOrder.id) {
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

        else if ($.isDefined(this.reducePositionOrder) && data.order.id === this.reducePositionOrder.id) {
            currentPosition.reduce(data.order.quantity, data.order.price);
        }
    }

    /**
     * Execution steps to accept loss already, instead of 
     * waiting to previous stopLoss price to be reached. 
     * (assuming there's already an open position)
     *
     * @returns {Promise<void>}
     * @memberof Strategy
     */
    async executeAcceptLossEarly(): Promise<void> {}

    /**
     * Execution steps to accept profit already, instead of 
     * waiting to previous takeProfit price to be reached. 
     * (assuming there's already an open position)
     *
     * @returns {Promise<void>}
     * @memberof Strategy
     */
    async executeTakeProfitEarly(): Promise<void> {}

    /**
     * Execution steps to open a "long" position. 
     *
     * @abstract
     * @returns {Promise<void>}
     * @memberof Strategy
     */
    abstract async executeBuy(): Promise<void>;

    /**
     * Execution steps to open a "short" position. 
     *
     * @abstract
     * @returns {Promise<void>}
     * @memberof Strategy
     */
    abstract async executeSell(): Promise<void>; 
    
    /**
     * Execution steps to add size of the already open position. 
     *
     * @returns {Promise<void>}
     * @memberof Strategy
     */
    async executeIncreasePositionSize(): Promise<void> {}

    /**
     * Execution steps to reduce from size of the already open position. 
     *
     * @returns {Promise<void>}
     * @memberof Strategy
     */
    async executeReducePositionSize(): Promise<void> {}
    
    /**
     * cancels everything so that the strategy can keep looking for new trades. 
     * Overwrite this method inside your own strategy if you need otherwise. 
     *
     * @returns {Promise<void>}
     * @memberof Strategy
     */
    async executeCancel(): Promise<void> {
        Logger.warning('Cancel...');
        
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
     * Based on the newly updated info, check if we should take action or not.
     *
     * @abstract
     * @memberof Strategy
     */
    async check() {
        if (this.shouldAcceptLossEarly()) {
            await this.executeAcceptLossEarly();
        }

        if (this.shouldTakeProfitEarly()) {
            await this.executeTakeProfitEarly(); 
        }

        if (this.shouldCancel()) {
            await this.executeCancel();
        }

        if (this.shouldWait()) {
            return;
        }

        // validation 
        if (this.shouldSell() && this.shouldBuy()) {
            $.hardError('shouldSell() and shouldBuy() should not be true at the same time.'); 
        }

        if (this.shouldBuy()) {
            await this.executeBuy(); 
        }

        if (this.shouldSell()) {
            await this.executeSell(); 
        }

        if (this.shouldIncreasePositionSize()) {
            await this.executeIncreasePositionSize(); 
        }

        if (this.shouldReducePositionSize()) {
            await this.executeReducePositionSize(); 
        }
    }
    
    /**
     * Should it executeCancel(), and keep looking for trades with a fresh pair of eyes.
     *
     * @abstract
     * @returns {boolean}
     * @memberof Strategy
     */
    abstract shouldCancel(): boolean; 

    /**
     * Should it wait, and do nothing? Have in mind, a strategy gets 
     * executed on every candle update. Hence, it's useful 
     * to know when wait(), and not to do anything. 
     *
     * @abstract
     * @returns {boolean}
     * @memberof Strategy
     */
    abstract shouldWait(): boolean; 
    
    /**
     * Should it buy() now? 
     *
     * @abstract
     * @returns {boolean}
     * @memberof Strategy
     */
    abstract shouldBuy(): boolean; 
    
    /**
     * Should it sell() now? 
     *
     * @abstract
     * @returns {boolean}
     * @memberof Strategy
     */
    abstract shouldSell(): boolean; 
    
    /**
     * Should it increase the size of position? (assuming
     * there's already an open position)
     *
     * @returns
     * @memberof Strategy
     */
    shouldIncreasePositionSize(): boolean {
        return false; 
    }

    /**
     * Should it reduce the size of position? (assuming
     * there's already an open position)
     *
     * @returns {boolean}
     * @memberof Strategy
     */
    shouldReducePositionSize(): boolean {
        return false; 
    }

    /**
     * Should it takeProfit() now, instead waiting for the
     * this.takeProfitPrice to be reached? (assuming
     * there's already an open position)
     *
     * @returns {boolean}
     * @memberof Strategy
     */
    shouldTakeProfitEarly(): boolean {
        return false; 
    }

    /**
     * Should it takeLoss() now? (assuming there's already an open position)
     *
     * @returns {boolean}
     * @memberof Strategy
     */
    shouldAcceptLossEarly(): boolean {
        return false; 
    }

    /**
     * What should happen after the openPositionOrder() is executed
     * and a new position has been opened. Overwrite this method
     * inside your own strategy in case you need otherwise. 
     * 
     * @memberof Strategy
     */
    async onOpenPosition() {
        Logger.warning(`Detected open position. Setting stops now:`);

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
            Logger.warning(`StopLoss has been executed. Looking for next trade...`);
        }

        await this.executeCancel();
    };

    /**
     * What should happen after the takeProfit order is executed. 
     *
     * @memberof Strategy
     */
    async onTakeProfit() {
        if ($.isDebugging()) {
            Logger.warning(`Sweet! Take profit order has been executed. Let's look for the next hunt.`);
        }
        
        await this.executeCancel();
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
            Logger.warning(`${this.constructor.name} requires ${this.minimumRequiredCandle} candles to begin executing, but there's only ${selectors.getTradingCandles().length} candles present.`);
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
                    Logger.warning(`Finished backTest. Closed the last order at opening price to exclude it from the stats (since it's incomplete, hence being inaccurate).`);
                }
            }
        } catch (error) {
            Logger.error(error); 
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
                this.trade.quantity = order.quantity; 
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
                if (! this.trade.exitPrice) {
                    this.trade.exitPrice = order.price; 
                } else {
                    this.trade.exitPrice = $.estimateAveragePrice(
                        order.quantity, order.price, this.trade.quantity, this.trade.exitPrice
                    );
                } 
                break;

            case tradeLogTypes.CLOSE_POSITION:
                this.trade.orders.push(order);
                if (! this.trade.exitPrice) {
                    this.trade.exitPrice = order.price; 
                } else {
                    this.trade.exitPrice = $.estimateAveragePrice(
                        order.quantity, order.price, this.trade.quantity, this.trade.exitPrice
                    );
                } 
                this.trade.closedAt = time;
                this.trade.quantity = _.sumBy(
                    this.trade.orders.filter(item => item.side === $.typeToSide(this.trade.type)), item => Math.abs(item.quantity)
                );
                this.trade.fee = store.getState().config.tradingFee * this.trade.quantity * (this.trade.entryPrice + this.trade.exitPrice);
                this.trade.takeProfitPrice = this.takeProfitPrice; 

                store.dispatch(actions.addTrade(this.trade));
                this.trade = undefined;
                break;

            default:
                Logger.error('Unsupported tradeLogType');
                throw new Error('Unsupported tradeLogType');
        }
    }
}
