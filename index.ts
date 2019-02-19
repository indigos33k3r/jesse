// register donenv to load config values
require('dotenv').config();

import _ from 'lodash';
import readline from 'readline';
import config from './config';
import jesse from './core/models/Jesse';
import candleSet from './core/services/CandleLoader';
import Notifier from './core/services/Notifier';
import store, { actions } from './core/store';
import Dashboard from './core/services/Dashboard';

let executeExit = _.once(function() {
    if (config.notifications.events.liveTradeStopped) {
        Notifier.send(`liveTrade stopped`);
    }

    store.dispatch(actions.logWarning('Saving before exit...'));

    jesse.strategy.end();

    jesse.saveLogs().then(() => {
        process.exit();
    });
});

// setup Sentry
if (config.useSentryForExceptionReporting) {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: config.sentryDSN });
}

// run the main application
switch (config.tradingMode.toLowerCase()) {
    case 'backtest':
        jesse.backTest(candleSet);
        break;

    case 'fitness':
        jesse.fitness(candleSet);
        break;

    case 'livetrade':
        // TODO: make a check to see if there's been a session
        // running (like if there are any active orders and
        // stuff). if so, set the sessionID to resume.

        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.on('keypress', (str, key) => {
            if (key.ctrl && key.name === 'c') {
                executeExit();
            } else if (key.name === 'h') {
                config.dashboardItems.guide = !config.dashboardItems.guide;
            } else if (key.name === 'i') {
                config.dashboardItems.info = !config.dashboardItems.info;
            } else if (key.name === 'p') {
                config.dashboardItems.positions = !config.dashboardItems.positions;
            } else if (key.name === 'c') {
                config.dashboardItems.candles = !config.dashboardItems.candles;
            } else if (key.name === 'w') {
                config.dashboardItems.warnings = !config.dashboardItems.warnings;
            } else if (key.name === 'e') {
                config.dashboardItems.errors = !config.dashboardItems.errors;
            } else if (key.name === 'o') {
                config.dashboardItems.orders = !config.dashboardItems.orders;
            } else if (key.name === 't') {
                config.dashboardItems.trades = !config.dashboardItems.trades;
            }

            Dashboard.liveTrade();
        });

        jesse.liveTrade();
        break;

    default:
        throw new Error('Selected mode is not supported.');
}
