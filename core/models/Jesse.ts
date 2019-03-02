import _cliProgress from 'cli-progress';
import jsonfile from 'jsonfile';
import _ from 'lodash';
import config from '../../config';
import Router from '../../strategies/Router';
import ConflictingOrders from '../exceptions/ConflictingOrders';
import EmptyPosition from '../exceptions/EmptyPosition';
import { ActionInterface } from '../interfaces/ActionInterface';
import { CandleSetInterface } from '../interfaces/CandleSetInterface';
import Candle from '../models/Candle';
import Dashboard from '../services/Dashboard';
import $ from '../services/Helpers';
import Notifier from '../services/Notifier';
import Report from '../services/Report';
import Statistics from '../services/Statistics';
import Table from '../services/Table';
import store, { actions } from '../store';
import { reduxActionLogs } from '../store/reducers/mainReducer';
import { ActionTypes, supportedTimeFrames, Sides } from '../store/types';
import Order from './Order';
import Strategy from './Strategy';
import Logger from '../services/Logger';
const progressBar = new _cliProgress.Bar({}, _cliProgress.Presets.legacy);

/**
 * This class does basically everything that Jesse Livermore would have wished he could do.
 *
 * @export
 * @class Jesse
 */
export class Jesse {
    strategy: Strategy;
    
    /**
     * Creates an instance of Jesse.
     *
     * @param {Strategy} [strategy]
     * @memberof Jesse
     */
    constructor(strategy?: Strategy) {
        if (strategy) {
            this.strategy = strategy;
        } else {
            let configValue = Router.symbols.find(item => item.symbol === store.getState().config.tradingSymbol);
            if (configValue) {
                this.strategy = configValue.strategy; 
            } else {
                this.strategy = Router.default; 
            }
        }
    }

    /**
     * Trades with live data on exchange. At this point, you'll either make a lot, or lose a lot.
     *
     * @returns real money ($ $)
     * @memberof Jesse
     */
    async liveTrade() {
        Dashboard.liveTrade();
        // refresh dashboard every 5 seconds
        setInterval(Dashboard.liveTrade, 5000);

        // watch for new candles, so that execute the strategy whenever
        // there's a new candle added. Also, does the logging:
        this.watchStoreForExecution();

        if ($.isDebugging()) {
            store.dispatch(actions.logWarning(`The debugMode is enabled.`));
        }

        if (config.notifications.events.liveTradeStarted) {
            Notifier.send('liveTrade started.')
        }
    }

    /**
     * subscribe to the store, to detect new candle's which is when we execute the strategy.
     * There's also logging stuff which we do by watching the store.
     *
     * @memberof Jesse
     */
    async watchStoreForExecution() {
        await this.strategy.init();

        store.subscribe(async () => {
            let lastAction: ActionInterface = store.getState().lastAction;

            // new candle added
            if (lastAction.type === ActionTypes.ADD_CANDLE) {
                await this.executeStrategy(lastAction.payload);
            }
        });
    }

    /**
     * Pulls the trigger and executes our trading strategy.
     *
     * @param {Candle} mostRecentCandle
     * @memberof Jesse
     */
    async executeStrategy(mostRecentCandle: Candle) {
        if (
            mostRecentCandle.symbol !== config.app.symbolToTrade ||
            mostRecentCandle.timeFrame !== config.app.timeFrameToTrade
        ) return;

        // update store for global access
        store.dispatch(actions.updateCurrentPrice(mostRecentCandle.close));

        await this.strategy.execute();
    }

    /**
     * Runs the strategy on historical candles, to see how the strategy would have performed in that past.
     *
     * @param {CandleSetInterface} candleSet
     * @memberof Jesse
     */
    async backTest(candleSet: CandleSetInterface) {
        console.clear(); 

        Table.keyValue(Report.backTest(this.strategy), `JESSE (v${require('../../package.json').version})`);

        await this.strategy.init();

        let oneMinuteCandles: Candle[] = candleSet.symbols
            .find(item => item.symbol === config.app.symbolToTrade)
            .timeFrames.find(item => item.timeFrame === '1m').candles;

        // Initial Report on the candles we're trying to backTest against
        Table.keyValue(Statistics.candles(oneMinuteCandles), 'Candles');

        // time-travels by faking candles
        await this.runBackTest(oneMinuteCandles);

        // let's see how we did
        this.strategy.end();
        this.saveLogs();

        if (store.getState().mainReducer.conflictingOrdersCount) {
            store.dispatch(actions.logError(`There was ${store.getState().mainReducer.conflictingOrdersCount} conflicting orders.`))
        }

        if (store.getState().trades.length) {
            Table.keyValue(Statistics.trades(store.getState().trades), 'Trades');
        } else {
            $.printToConsole(`No trades were made via this strategy. Either modify your target time period, or your strategy.`, `yellow`)
        }
    }

    /**
     *The fitness function is used for computations requiring a lot of runnings. Such as the Genetic algorithm.
     *
     * @param {CandleSetInterface} candleSet
     * @returns {Promise<number>}
     * @memberof Jesse
     */
    async fitness(candleSet: CandleSetInterface): Promise<number> {
        await this.strategy.init();

        let oneMinuteCandles: Candle[] = candleSet.symbols
            .find(item => item.symbol === config.app.symbolToTrade)
            .timeFrames.find(item => item.timeFrame === '1m').candles;

        await this.runBackTest(oneMinuteCandles);

        this.strategy.end();

        let profit: number = _.round(
            (store.getState().mainReducer.profit / store.getState().mainReducer.startingBalance) * 100,
            2
        );

        store.dispatch(actions.resetState());

        console.log(`Profit: ${profit}`);
        return profit;
    }

    /**
     * Returns how many oneMinute candles are required.
     *
     * @param {string} candleSize
     * @returns {number}
     * @memberof Jesse
     */
    getOneMinuteCandleCount(candleSize: string): number {
        switch (candleSize) {
            case '1d':
                return 60 * 24;
            case '3h':
                return 60 * 3;
            case '1h':
                return 60;
            case '5m':
                return 5;
            case '15m':
                return 15;
            case '30m':
                return 30;
        }
    }

    /**
     * Runs the backTest simulation. It's been used inside both backTest() and fitness() methods.
     *
     * @param {Candle[]} candles
     * @param {Candle[]} oneMinuteCandles
     * @memberof Jesse
     */
    async runBackTest(candles: Candle[]) {
        console.time('Executed backtest simulation in');
        
        // progress-bar begins
        if ($.isBackTesting() && !$.isFitting() && !$.isTesting() && !$.isDebugging() && config.logging.items.progressBar) {
            progressBar.start(candles.length);
        }

        function requiredOneMinuteCandlePerTimeFrame(timeFrame: string): number {
            switch (timeFrame) {
                case supportedTimeFrames.oneMinute:
                    return 1;
                case supportedTimeFrames.thirtyMinutes:
                    return 3;
                case supportedTimeFrames.fiveMinutes:
                    return 5;
                case supportedTimeFrames.fifteenMinutes:
                    return 15;
                case supportedTimeFrames.thirtyMinutes:
                    return 30;
                case supportedTimeFrames.oneHour:
                    return 60;
                case supportedTimeFrames.threeHours:
                    return 60 * 3;
                case supportedTimeFrames.oneDay:
                    return 60 * 24;

                default:
                    throw new Error(`invalid candle size`);
            }
        }

        // loop through history
        store.dispatch(actions.addCandle(candles[0]));
        for (let index = 0; index < candles.length; index++) {
            // add 1m candle
            store.dispatch(actions.quickAddCandle(candles[index]));
            store.dispatch(actions.updateCurrentTime(candles[index].timestamp));

            // progress-bar updates
            if ($.isBackTesting() && config.logging.items.progressBar) {
                progressBar.update(index);
            }

            // print the 1m candle
            if ($.isDebuggable('shorterPeriodCandles')) {
                $.printCandle(candles[index], true);
            }

            // validate for conflicting orders. Without this, there may be few conflicting orders causing Jesse to break.
            try {
                this.validateOrders(candles[index]);
            } catch (error) {
                if (error instanceof ConflictingOrders) {
                    store.dispatch(actions.increaseCountOfConflictingOrders());
                    await this.strategy.executeCancel(); 
                } else {
                    throw error;
                }
            }

            // update orders and the position based on the previous oneMinuteCandles' price action
            for (let k = 0; k < store.getState().orders.length; k++) {
                if (
                    store.getState().orders[k].isNew() &&
                    this.doesCandleIncludeOrderPrice(candles[index], store.getState().orders[k])
                ) {
                    // update store's orders
                    store.getState().orders[k].execute();

                    if ($.isDebuggable('executedOrderDetection')) {
                        Logger.warning(`Order: ${store.getState().orders[k].id} has been executed at ${candles[index].timestamp}`);
                    }

                    // (fake) broadcast executed order
                    try {
                        await this.strategy.handleExecutedOrder({
                            time: candles[index].timestamp,
                            order: store.getState().orders[k]
                        });
                    } catch (error) {
                        if (error instanceof EmptyPosition) {
                            await this.strategy.executeCancel(); 
                        } else {
                            throw error;
                        }
                    }
                } else if (
                    store.getState().orders[k].isNew() &&
                    store.getState().orders[k].isTrailingStop()
                ) {
                    // update trailingStop order's triggering price
                    if (
                        Math.abs(
                            store.getState().mainReducer.currentPrice - store.getState().orders[k].price
                        ) > store.getState().orders[k].trailingPrice
                    ) {
                        store.getState().orders[k].updatePrice(
                            store.getState().orders[k].side === Sides.BUY
                            ? store.getState().mainReducer.currentPrice +
                              store.getState().orders[k].trailingPrice
                            : store.getState().mainReducer.currentPrice -
                              store.getState().orders[k].trailingPrice
                        );
                    }
                }
            }

            // TODO: don't really do "if", create forming candles instead. Or ask for it? Or test it?
            for (let k = 0; k < config.app.timeFramesToConsider.length; k++) {
                if (config.app.timeFramesToConsider[k] === supportedTimeFrames.oneMinute) {
                    continue;
                }

                if ((index + 1) % requiredOneMinuteCandlePerTimeFrame(config.app.timeFramesToConsider[k]) === 0) {
                    const generatedCandle: Candle = $.generateCandleFromOneMinutes(
                        config.app.timeFramesToConsider[k],
                        candles.slice(
                            index - (requiredOneMinuteCandlePerTimeFrame(config.app.timeFramesToConsider[k]) - 1),
                            index
                        )
                    );

                    store.dispatch(actions.addCandle(generatedCandle));

                    await this.executeStrategy(generatedCandle);
                }
            }
        }

        // end progress-bar
        if ($.isBackTesting() && config.logging.items.progressBar) {
            progressBar.update(candles.length);
            progressBar.stop();
            if (! $.isTesting()) {
                let executionTime: number = new Date().valueOf() - store.getState().mainReducer.startTime; 
                if (executionTime < 10000) {
                    console.timeEnd('Executed backtest simulation in'); 
                    console.log('\n');
                } else {
                    console.log(`Executed backtest simulation in: ${$.durationForHuman(executionTime)}`, `\n`);
                }
            } 
        }
    }

    /**
     * Validates orders.
     *
     * @param {Candle} candle
     * @memberof Jesse
     */
    validateOrders(candle: Candle) {
        if (
            !_.isUndefined(store.getState().orders[store.getState().orders.length - 1]) &&
            !_.isUndefined(store.getState().orders[store.getState().orders.length - 2]) &&
            store.getState().orders[store.getState().orders.length - 1].isNew() &&
            store.getState().orders[store.getState().orders.length - 2].isNew() &&
            this.doesCandleIncludeOrderPrice(
                candle,
                store.getState().orders[store.getState().orders.length - 2]
            ) &&
            this.doesCandleIncludeOrderPrice(
                candle,
                store.getState().orders[store.getState().orders.length - 1]
            )
        ) {
            throw new ConflictingOrders(
                'There are conflicting orders. Meaning that more than one orders could be executed at the passed candle.'
            );
        }
    }

    /**
     * Saves loges.
     *
     * @returns {void}
     * @memberof Jesse
     */
    saveLogs() {
        return new Promise((resolve, reject) => {
            if ($.isFitting()) return;
            if ($.isTesting()) return;
            if (config.logging.logDriver === null) return;

            if (config.logging.logDriver === 'file') {
                let fileName = Date.now();

                // store orders:
                jsonfile.writeFile(`./storage/logs/orders/${fileName}.json`, {
                    orders: store.getState().orders
                });

                // store trades:
                jsonfile.writeFile(`./storage/logs/trades/${fileName}.json`, {
                    trades: store.getState().trades.map(item => {
                        return {
                            id: item.id, 
                            strategy: item.strategy,
                            strategyVersion: item.strategyVersion, 
                            symbol: item.symbol, 
                            type: item.type, 
                            entryPrice: item.entryPrice, 
                            exitPrice: item.exitPrice, 
                            takeProfitPrice: item.takeProfitPrice, 
                            stopLossPrice: item.stopLossPrice, 
                            quantity: item.quantity, 
                            fee: item.fee, 
                            orders: item.orders, 
                            openedAt: item.openedAt, 
                            closedAt: item.closedAt, 
                            risk: item.risk(), 
                            expectedReward: item.reward(), 
                            R: item.R(), 
                            size: item.size(), 
                            PNL: item.pnl(), 
                            percentagePNL: item.percentagePNL(), 
                            holdingPeriodSeconds: item.holdingPeriod(), 
                        }
                    })
                });

                // store redux actions:
                jsonfile.writeFile(`./storage/logs/redux-actions/${fileName}.json`, {
                    actions: reduxActionLogs
                });
            }
            
            setTimeout(() => resolve(), 2000);
        });
    }
    
    /**
     * Checks to see if the current candle's price range includes the price of order.
     *
     * @param {Candle} candle
     * @param {Order} order
     * @returns {boolean}
     * @memberof Jesse
     */
    doesCandleIncludeOrderPrice(candle: Candle, order: Order): boolean {
        return order.price >= candle.low && order.price <= candle.high;
    }
}

const jesse: Jesse = new Jesse();
export default jesse;
