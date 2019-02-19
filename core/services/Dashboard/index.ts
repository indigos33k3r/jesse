import _ from 'lodash';
import moment from 'moment-timezone';
import config from '../../../config';
import store, { selectors } from '../../store';
import currentPosition from '../Positions';
import Table from '../Table';
import Report from '../Report';
import jesse from '../../models/Jesse';
import { ErrorInterface, WarningInterface } from '../../interfaces/LogInterfaces';
import chalk from 'chalk';
import Candle from '../../models/Candle';
moment.tz.setDefault('UTC');

const Dashboard = {
    liveTrade(): void {
        console.clear();

        if (config.dashboardItems.info) {
            Table.keyValue(Report.liveTrade(jesse.strategy), `JESSE (v${require('../../../package.json').version})`);
        }

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

        if (config.dashboardItems.candles) {
            const candles: Candle[] = [];
            if (store.getState().candles.symbols.length === config.symbolsToConsider.length) {
                config.symbolsToConsider.forEach(symbol => {
                    config.timeFramesToConsider.forEach(timeFrame => {
                        candles.push(selectors.getCurrentCandleFor(symbol, timeFrame));
                    });
                });
            }
            
            Table.multiValue(Report.candles(candles), 'Candles');
        };

        if (config.dashboardItems.positions && currentPosition.isOpen()) {
            Table.multiValue(Report.positions([
                {
                    type: currentPosition.type(),
                    symbol: currentPosition.symbol(),
                    quantity: store.getState().mainReducer.quantity,
                    entryPrice: store.getState().mainReducer.entryPrice,
                    PNL: currentPosition.pnl()
                }
            ]), 'Positions');
        };

        if (config.dashboardItems.orders && store.getState().orders.length) {
            Table.multiValue(Report.orders(store.getState().orders), 'Orders'); 
        };

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

export default Dashboard;
