import _ from 'lodash';
import Candle from '../../models/Candle';
import chalk from 'chalk';
import config from '../../../config';
import Order from '../../models/Order';
import fs from 'fs';
import jsonfile from 'jsonfile';
import mkdirp from 'mkdirp';
import moment, { Moment } from 'moment-timezone';
import { Sides, TradeTypes } from '../../store/types';
moment.tz.setDefault('UTC');

const $ = {
    /**
     * Gets the duration in milliseconds and prints it in readable format.
     *
     * @param duration number
     */
    durationForHuman(durationInMilliseconds: number): string {
        let duration = moment.duration(durationInMilliseconds);
        return Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(':mm:ss');
    },

    date(date: string): string {
        return moment(date).format('YYYY-MM-DD');
    },

    time(time: number): string {
        return moment(time).format();
    },

    moment(time: string): Moment {
        return moment(time);
    }, 

    /**
     * Prepares quantity based on the size of position.
     *
     * @param positionSize number
     * @param price number
     */
    positionSizeToQuantity(positionSize: number, price: number): number {
        return positionSize / price;
    },

    /**
     * Prepares quantity based on the size of position.
     *
     * @param quantity number
     * @param price number
     */
    quantityToPositionSize(quantity: number, price: number): number {
        return quantity * price;
    },

    /**
     * Calculates the risk in USD.
     *
     * @param entryPrice number
     * @param stopPrice number
     */
    estimateRisk(entryPrice: number, stopPrice: number): number {
        return Math.abs(entryPrice - stopPrice);
    },

    /**
     * Loads and returns the file located in the path. Stops the application
     * if the file does not exist in the location.
     *
     * @param path string
     */
    loadFile(path: string) {
        try {
            return jsonfile.readFileSync(path);
        } catch (error) {
            this.hardError(`No file was founded. Check your address.`);
        }
    },

    /**
     * Creates the directory in case it doesn't already exist.
     *
     * @param directory string
     */
    createDirectoryIfNotExists(directory: string) {
        if (!fs.existsSync(directory)) {
            mkdirp.sync(directory, err => {
                if (err) console.error(err);
            });
        }
    },

    /**
     * Checks to see if the current candle's price range includes the price of order.
     *
     * @param candle Candle
     * @param order Order
     */
    doesCandleIncludeOrderPrice(candle: Candle, order: Order): boolean {
        return order.price >= candle.low && order.price <= candle.high;
    },

    /**
     * Generates candle from 1m candles.
     *
     * @param {string} timeFrame
     * @param {Candle[]} candles
     * @returns {Candle}
     */
    generateCandleFromOneMinutes(timeFrame: string, candles: Candle[]): Candle {
        $.validateTimeFrame(timeFrame);

        return new Candle({
            timestamp: candles[0].timestamp,
            open: candles[0].open,
            close: candles[candles.length - 1].close,
            high: _.maxBy(candles, 'high').high,
            low: _.minBy(candles, 'low').low,
            volume: _.sumBy(candles, 'volume'),
            symbol: candles[0].symbol,
            timeFrame: timeFrame
        });
    },

    /**
     * prints a candlestick in a pretty style.
     *
     * @param candle Candle
     * @param isShortCandle boolean
     */
    printCandle(candle: Candle, isShortCandle: boolean = false): void {
        if (isShortCandle) {
            if (candle.isBullish()) {
                console.log(
                    chalk.cyanBright(
                        `===== ${candle.timestamp}: open:${candle.open} close:${candle.close} high:${candle.high} low:${
                            candle.low
                        } volume:${candle.volume} ==`
                    )
                );
            } else {
                console.log(
                    chalk.redBright(
                        `===== ${candle.timestamp}: open:${candle.open} close:${candle.close} high:${candle.high} low:${
                            candle.low
                        } volume:${candle.volume} ==`
                    )
                );
            }

            return;
        }

        if (candle.isBullish()) {
            console.log(
                chalk.bgCyan(`=====`) +
                    chalk.cyan(
                        ` ${candle.timestamp}: open:${candle.open} close:${candle.close} high:${candle.high} low:${
                            candle.low
                        } volume:${candle.volume} ==`
                    )
            );
        } else {
            console.log(
                chalk.bgRed(`=====`) +
                    chalk.red(
                        ` ${candle.timestamp}: open:${candle.open} close:${candle.close} high:${candle.high} low:${
                            candle.low
                        } volume:${candle.volume} ==`
                    )
            );
        }
    },

    /**
     * Converts candleSize to minutes.
     *
     * @param candleSize string
     */
    candleSizeToMinutes(candleSize): number {
        switch (candleSize) {
            case '1d':
                return 60 * 24;

            case '1h':
                return 60;

            case '3h':
                return 60 * 3;

            case '4h':
                return 60 * 4;

            case '1m':
                return 1;

            case '5m':
                return 5;

            case '15m':
                return 15;
        }
    },

    prepareQuantity(quantity: number, side: string): number {
        if (side.toLowerCase() === 'sell' || side.toLowerCase() === 'short') {
            return -Math.abs(quantity);
        }

        if (side.toLowerCase() === 'buy' || side.toLowerCase() === 'long') {
            return Math.abs(quantity);
        }

        throw new Error(`side is not supported.`);
    },

    targetedMarket(): string {
        return config.exchanges.Bitfinex.baseURL;
    },

    /**
     * Plucks candles and returns an array holding only values for the
     * targeted key.
     *
     * @param candles Candle[]
     * @param pluckKey string
     */
    pluckCandles(candles: Candle[], pluckKey: string = 'close'): number[] {
        return _.transform(candles, (result, value, key) => (result[key] = value[pluckKey]));
    },

    /**
     * Estimates the profit/loss in USD that has been made after trade(both opening and closing a position).
     *
     * @param quantity number
     * @param entryPrice number
     * @param exitPrice number
     * @param type string
     */
    estimateProfit(quantity: number, entryPrice: number, exitPrice: number, type: string): number {
        quantity = Math.abs(quantity);
        let profit: number = quantity * (exitPrice - entryPrice);
        if (type === 'short') profit *= -1;
        return profit;
    },

    /**
     * Estimates the PNL.
     *
     * @param quantity number
     * @param entryPrice number
     * @param exitPrice number
     * @param type string
     */
    estimatePNL(quantity: number, entryPrice: number, exitPrice: number, type: string): number {
        quantity = Math.abs(quantity);
        let profit: number = quantity * (exitPrice - entryPrice);
        if (type === 'short') profit *= -1;

        return (profit / (quantity * entryPrice)) * 100;
    },

    /**
     * Estimates the new entry price for the position. This is used after having a new order
     * and updating the currently holding position.
     *
     * @param orderQuantity number
     * @param orderPrice number
     * @param currentQuantity number
     * @param currentEntryPrice number
     */
    estimateAveragePrice(
        orderQuantity: number,
        orderPrice: number,
        currentQuantity: number,
        currentEntryPrice: number
    ): number {
        return (
            (Math.abs(orderQuantity) * orderPrice + Math.abs(currentQuantity) * currentEntryPrice) /
            (Math.abs(orderQuantity) + Math.abs(currentQuantity))
        );
    },

    now(): string {
        return moment().format();
    },

    transformTimestamp(timestamp: number): string {
        return moment(timestamp).format();
    },

    logHeading(title: string) {
        console.log(`=`.repeat(15) + ` ${title.toUpperCase()} ` + `=`.repeat(15));
    },

    logHeadingBlock(title: string) {
        console.log(chalk.bold(`=`.repeat(70)));
        console.log(chalk.bold(title));
        console.log(chalk.bold(`=`.repeat(70)));
    },

    /**
     * Is the number a an odd number?
     *
     * @param num number
     * @returns boolean
     */
    isOdd(num: number) {
        return num % 2 === 1 ? true : false;
    },

    /**
     * Estimates the pip for the trading symbol.
     *
     * @param symbol string
     * @returns number
     */
    estimatePip(symbol: string): number {
        switch (symbol) {
            case 'BTCUSD':
                return 0.5;

            case 'EOSUSD':
                return 0.0000001;

            case 'XRPUSD':
                return 0.00000004;

            case 'ETHUSD':
                return 0.000025;

            default:
                return 0;
        }
    },

    /**
     * Generates a unique ID.
     */
    generateUniqueID(): number {
        return _.random(1e10, 1e12);
    },

    /**
     * Used for tracing errors.
     *
     * @param message any
     */
    debug(message): void {
        console.log(message);
        console.trace();
    },

    /**
     * Logs a red message and then quits the application. Used for hard errors
     * that should be solved before running the application again.
     *
     * @param message string
     */
    hardError(message: string) {
        console.log(chalk.bgRed(message));
        process.exit();
    },

    /**
     * If condition is passed, print in green, otherwise in red. Helper for printing profit/loss values. Like PNL.
     *
     * @param condition boolean
     * @param text string
     */
    greenOrRed(condition: boolean, text: string) {
        return condition ? chalk.green(text) : chalk.red(text);
    },

    isLiveTrading(): boolean {
        return config.app.tradingMode === 'livetrade';
    },

    isBackTesting(): boolean {
        return config.app.tradingMode === 'backtest' || config.app.tradingMode === 'fitness';
    },

    isTesting(): boolean {
        return config.app.isTesting; 
    }, 

    isFitting(): boolean {
        return config.app.tradingMode === 'fitness';
    },

    isDebugging(): boolean {
        return config.app.debugMode;
    },

    isDebuggable(debugItem: string): boolean {
        return this.isDebugging() && config.logging.items[debugItem];
    },

    /**
     * A prettier version of console.log().
     *
     * @param text string
     * @param type string
     */
    printToConsole(text: string, type: string = `black`) {
        // Do not print if we're in backTest mode.
        if (this.isBackTesting() && !this.isDebugging()) return;
        if (config.app.tradingMode === 'fitness') return;
        if (config.app.isTesting) return;

        switch (type) {
            case `green`:
                console.log(chalk.green(text));
                break;
            case `yellow`:
                console.log(chalk.yellow(text));
                break;
            case `red`:
                console.log(chalk.red(text));
                break;
            case `magenta`:
                console.log(chalk.magenta(text));
                break;

            // default: black
            default:
                console.log(text);
                break;
        }
    },

    /**
     * Validates Side.
     *
     * @param {string} side
     */
    validateSide(side: string): void {
        if (!_.includes(['buy', 'sell'], side)) {
            throw new Error(`Invalid "side". Must be either "sell" or "buy".`);
        }
    },

    /**
     * Validates Symbol.
     *
     * @param {string} symbol
     */
    validateSymbol(symbol: string): void {
        if (
            !_.includes(
                [
                    'BTCUSD',
                    'ETHUSD',
                    'LTCUSD',
                    'XRPUSD',
                    'EOSUSD',
                    'NEOUSD',
                    'ZECUSD',
                    'XMRUSD',
                    'DSHUSD',
                    'IOTUSD',
                    'OMGUSD',
                    'ETPUSD'
                ],
                symbol
            )
        ) {
            throw new Error(`Invalid "symbol format". Example of accepted values are: "BTCUSD", "ETHUSD"`);
        }
    },

    /**
     * Validates timeFrame.
     *
     * @param {string} timeFrame
     */
    validateTimeFrame(timeFrame: string): void {
        if (!_.includes(['1m', '5m', '15m', '30m', '1h', '3h', '6h', '1d'], timeFrame)) {
            throw new Error(
                `Invalid "timeFrame format". Example of accepted values are: '1m', '5m', '15m', '30m', '1h', '3h', '6h', '1d'.`
            );
        }
    },

    /**
     * Helper for performing multiple _.isDefined.
     *
     * @param {*} array
     * @returns {boolean}
     */
    areDefined(...array): boolean {
        return array.reduce((prev, current) => {
            return prev !== undefined && current !== undefined;
        });
    },

    /**
     * The opposite of Lodash's isUndifined().
     *
     * @param {*} data
     * @returns {boolean}
     */
    isDefined(data: any): boolean {
        return !_.isUndefined(data);
    },

    /**
     * Returns a random boolean. (true or false)
     *
     * @returns {boolean}
     */
    randomBoolean(): boolean {
        return !!_.random(0, 1);
    },

    sideToType(side: string): string {
        switch (side) {
            case Sides.BUY:
                return TradeTypes.LONG;
            case Sides.SELL:
                return TradeTypes.SHORT;

            default:
                throw new Error('unsupported side');
        }
    },

    typeToSide(type: string): string {
        switch (type) {
            case TradeTypes.LONG:
                return Sides.BUY;
            case TradeTypes.SHORT:
                return Sides.SELL;

            default:
                throw new Error('unsupported type');
        }
    }
};

export default $;
