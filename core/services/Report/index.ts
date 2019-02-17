import store, { selectors } from '../../store';
import _ from 'lodash';
import Candle from '../../models/Candle';
import config from '../../../config';
import moment from 'moment-timezone';
import Trade from '../../models/Trade';
import TableDataInterface from '../../interfaces/TableDataInterface';
import Strategy from '../../models/Strategy';
import EasyTable from 'easy-table';
import jesse from '../../models/Jesse';
import $ from '../Helpers';
import chalk from 'chalk';
import currentPosition from '../Positions';
import { TradeTypes } from '../../store/types';
import { ErrorInterface, WarningInterface } from '../../interfaces/LogInterfaces';
moment.tz.setDefault('UTC');

// TODO: refactor
interface PositionInterface {
    type: string;
    symbol: string;
    quantity: number;
    entryPrice: number;
    PNL: number;
}

const Report = {
    backtestInfo(strategy: Strategy): TableDataInterface[] {
        return [
            { key: 'strategy', value: `${strategy.name} (v${strategy.version})` },
            { key: 'debug mode', value: config.debugMode ? 'enabled' : 'disabled' }
        ];
    },

    candles(candles: Candle[]): TableDataInterface[] {
        let priceChangePercentage = ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100;

        return [
            { key: 'total', value: candles.length },
            { key: 'symbol', value: store.getState().mainReducer.symbol },
            { key: 'timeFrame', value: config.timeFrameToTrade },
            {
                key: 'time period',
                value: `${moment
                    .duration(moment(candles[0].timestamp).diff(moment(candles[candles.length - 1].timestamp)))
                    .humanize()} (${candles[0].timestamp} => ${candles[candles.length - 1].timestamp})`
            },
            {
                key: 'price change:',
                value: `${_.round(priceChangePercentage, 2)}% ($${candles[0].close} => $${
                    candles[candles.length - 1].close
                })`
            }
        ];
    },

    trades(trades: Trade[]): TableDataInterface[] {
        const winningTrades: Trade[] = trades.filter(t => t.pnl() > 0);
        const losingTrades: Trade[] = trades.filter(t => t.pnl() < 0);
        const winRate = winningTrades.length / (losingTrades.length + winningTrades.length);
        const minTradesR: Trade = _.minBy(trades, t => t.R());
        const maxTradedR: Trade = _.maxBy(trades, t => t.R());
        const numberOfLongs = (_.filter(trades, t => t.type === 'long').length / trades.length) * 100;

        return [
            { key: 'total', value: store.getState().trades.length },
            { key: 'starting balance', value: `$${_.round(store.getState().mainReducer.startingBalance, 2)}` },
            { key: 'finishing balance', value: `$${_.round(store.getState().mainReducer.currentBalance, 2)}` },
            { key: 'PNL', value: `$${_.round(store.getState().mainReducer.profit, 4)}` },
            {
                key: 'PNL%',
                value: `${_.round(
                    (store.getState().mainReducer.profit / store.getState().mainReducer.startingBalance) * 100,
                    2
                )}%`
            },
            { key: 'win rate', value: `${Math.round(winRate * 100)}%` },
            { key: 'minimum R', value: _.round(minTradesR.R(), 2) },
            { key: 'average R', value: _.round(_.meanBy(trades, t => t.R()), 2) },
            { key: 'maximum R', value: _.round(maxTradedR.R(), 2) },
            { key: 'longs/shorts trades', value: `${Math.round(numberOfLongs)}%/${Math.round(100 - numberOfLongs)}%` }
        ];
    },

    // TODO: must return data like other methods in this file, and
    // then get printed at Table/index.ts
    liveTradeDashboard(): void {
        console.clear();

        // info
        const jesseTable = new EasyTable();
        const jesseData: TableDataInterface[] = [
            { key: 'strategy', value: `${jesse.strategy.name} - v${jesse.strategy.version}` },
            { key: 'debug mode', value: config.debugMode ? 'enabled' : 'disabled' },
            { key: 'profit', value: `$${store.getState().mainReducer.profit}` },
            {
                key: 'current time',
                value: $.now() + ` (started at ${$.time(store.getState().mainReducer.startTime)} UTC)`
            },
            { key: 'errors', value: store.getState().logs.errors.length },
            { key: 'warnings', value: store.getState().logs.warnings.length },
            { key: 'trades', value: store.getState().trades.length },
            { key: 'active orders', value: selectors.countOfActiveOrders() },
            { key: 'inactive orders', value: store.getState().orders.length - selectors.countOfActiveOrders() }
        ];

        jesseData.forEach(item => {
            jesseTable.cell(chalk.bold(`JESSE (v${require('../../../package.json').version})`), chalk.grey(`${item.key}:`));
            jesseTable.cell(' ', item.value);

            jesseTable.newRow();
        });

        // orders
        const ordersTable = new EasyTable();
        store.getState().orders.forEach(order => {
            ordersTable.cell(chalk.bold(`id`), order.isActive() ? order.id : chalk.grey(`${order.id}`));
            ordersTable.cell(chalk.bold(`symbol`), order.isActive() ? order.symbol : chalk.grey(`${order.symbol}`));
            ordersTable.cell(chalk.bold(`side`), order.isActive() ? order.side : chalk.grey(`${order.side}`));
            ordersTable.cell(chalk.bold(`type`), order.isActive() ? order.type : chalk.grey(`${order.type}`));
            ordersTable.cell(
                chalk.bold(`quantity`),
                order.isActive() ? _.round(order.quantity, 3) : chalk.grey(`${_.round(order.quantity, 3)}`)
            );
            ordersTable.cell(
                chalk.bold(`price`),
                order.isActive() ? _.round(order.price, 3) : chalk.grey(`${_.round(order.price, 3)}`)
            );
            ordersTable.cell(chalk.bold(`flag`), order.isActive() ? order.flag : chalk.grey(`${order.flag}`));
            ordersTable.cell(chalk.bold(`status`), order.isActive() ? order.status : chalk.grey(`${order.status}`));
            ordersTable.cell(
                chalk.bold(`createdAt`),
                order.isActive() ? order.createdAt : chalk.grey(`${order.createdAt}`)
            );

            ordersTable.newRow();
        });

        // candles
        const candles: Candle[] = [];
        if (store.getState().candles.symbols.length === config.symbolsToConsider.length) {
            config.symbolsToConsider.forEach(symbol => {
                config.timeFramesToConsider.forEach(timeFrame => {
                    candles.push(selectors.getCurrentCandleFor(symbol, timeFrame));
                });
            });
        }
        const candlesTable = new EasyTable();
        candles.forEach(c => {
            const isTradingCandle: boolean =
                c.symbol === config.symbolToTrade && c.timeFrame === config.timeFrameToTrade;
            candlesTable.cell(chalk.bold('symbol'), isTradingCandle ? '*' + c.symbol : chalk.grey(c.symbol));
            candlesTable.cell(chalk.bold('timeFrame'), isTradingCandle ? c.timeFrame : chalk.grey(c.timeFrame));

            candlesTable.cell(chalk.bold('open'), $.greenOrRed(c.isBullish(), _.round(c.open, 3).toString()));
            candlesTable.cell(chalk.bold('close'), $.greenOrRed(c.isBullish(), _.round(c.close, 3).toString()));
            candlesTable.cell(chalk.bold('high'), $.greenOrRed(c.isBullish(), _.round(c.high, 3).toString()));
            candlesTable.cell(chalk.bold('low'), $.greenOrRed(c.isBullish(), _.round(c.low, 3).toString()));
            candlesTable.cell(chalk.bold('volume'), $.greenOrRed(c.isBullish(), _.round(c.volume, 2).toString()));

            candlesTable.newRow();
        });

        // active positions
        const positions: PositionInterface[] = [
            {
                type: currentPosition.type(),
                symbol: currentPosition.symbol(),
                quantity: store.getState().mainReducer.quantity,
                entryPrice: store.getState().mainReducer.entryPrice,
                PNL: currentPosition.pnl()
            }
        ];
        const positionTable = new EasyTable();
        positions.forEach(p => {
            positionTable.cell(chalk.bold(`type`), p.type === TradeTypes.LONG ? chalk.green(`●`) : chalk.red(`●`));
            positionTable.cell(chalk.bold(`symbol`), p.symbol);
            positionTable.cell(chalk.bold(`quantity`), _.round(p.quantity, 4));
            positionTable.cell(chalk.bold(`entryPrice`), p.entryPrice);
            positionTable.cell(chalk.bold(`PNL`), $.greenOrRed(p.PNL > 0, _.round(p.PNL, 2) + '%'));

            positionTable.newRow();
        });

        // print info table
        if (config.dashboardItems.info) console.log(jesseTable.toString());
        // print errors
        if (config.dashboardItems.errors && store.getState().logs.errors.length) {
            console.log('Latest Errors:');
            let errors: ErrorInterface[] = [];
            if (store.getState().logs.errors.length < 6) {
                errors = _.cloneDeep(store.getState().logs.errors);
            } else {
                errors = _.cloneDeep(store.getState().logs.errors.slice(-5));
            }

            errors.reverse();

            errors.forEach(error => {
                console.log(chalk.red(`  x ${error.message} [${error.time}]`));
            });

            console.log(`\n`);
        }
        // print warnings
        if (config.dashboardItems.warnings && store.getState().logs.warnings.length) {
            console.log('Latest Warnings:');
            let warnings: WarningInterface[] = [];
            if (store.getState().logs.warnings.length < 6) {
                warnings = _.cloneDeep(store.getState().logs.warnings);
            } else {
                warnings = _.cloneDeep(store.getState().logs.warnings.slice(-5));
            }

            warnings.reverse();

            warnings.forEach(warnings => {
                console.log(chalk.grey(`  ! ${warnings.message} [${warnings.time}]`));
            });

            console.log(`\n`);
        }
        // candles table
        if (config.dashboardItems.candles) console.log(candlesTable.toString());
        // positions table
        if (config.dashboardItems.positions && currentPosition.isOpen()) console.log(positionTable.toString());
        // print info table
        if (config.dashboardItems.orders && store.getState().orders.length) console.log(ordersTable.toString());

        // keyboard guide
        console.log(
            chalk.bold(`Usage:`),
            chalk.grey(`Press`),
            `h`,
            chalk.grey(`to ${config.dashboardItems.guide ? 'hide' : 'show'} help`)
        );
        if (config.dashboardItems.guide) {
            console.log(chalk.grey(`  > press`), `ctrl + c`, chalk.grey(`to terminate`));
            console.log(
                chalk.grey(`  > press`),
                `i`,
                chalk.grey(`to ${config.dashboardItems.info ? 'hide' : 'show'} info table`)
            );
            console.log(
                chalk.grey(`  > press`),
                `p`,
                chalk.grey(`to ${config.dashboardItems.positions ? 'hide' : 'show'} open positions table`)
            );
            console.log(
                chalk.grey(`  > press`),
                `c`,
                chalk.grey(`to ${config.dashboardItems.candles ? 'hide' : 'show'} candles table`)
            );
            console.log(
                chalk.grey(`  > press`),
                `o`,
                chalk.grey(`to ${config.dashboardItems.orders ? 'hide' : 'show'} orders`)
            );
            console.log(
                chalk.grey(`  > press`),
                `t`,
                chalk.grey(`to ${config.dashboardItems.trades ? 'hide' : 'show'} trades`)
            );
            console.log(
                chalk.grey(`  > press`),
                `e`,
                chalk.grey(`to ${config.dashboardItems.errors ? 'hide' : 'show'} errors`)
            );
            console.log(
                chalk.grey(`  > press`),
                `w`,
                chalk.grey(`to ${config.dashboardItems.warnings ? 'hide' : 'show'} warnings`)
            );
        }
    }
};

export default Report;
