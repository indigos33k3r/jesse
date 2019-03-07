// register donenv to load config values
require('dotenv').config();

import _ from 'lodash';
import readline from 'readline';
import config from './config';
import bootstrap from './core/services/Bootstrap';
import candleSet from './core/services/CandleLoader';
import Notifier from './core/services/Notifier';
import store, { actions } from './core/store';
import Dashboard from './core/services/Dashboard';

let executeExit = _.once(function() {
    if (config.notifications.events.liveTradeStopped) {
        Notifier.send(`liveTrade stopped`);
    }

    store.dispatch(actions.logWarning('Saving before exit...'));

    bootstrap.strategy.end();

    bootstrap.saveLogs().then(() => {
        process.exit();
    });
});

// setup Sentry
if (config.sentry.enable) {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: config.sentry.DSN });
}

// run the main application
switch (config.app.tradingMode.toLowerCase()) {
    case 'backtest':
        bootstrap.backTest(candleSet);
        break;

    case 'fitness':
        bootstrap.fitness(candleSet);
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
                config.dashboard.items.guide = !config.dashboard.items.guide;
            } else if (key.name === 'i') {
                config.dashboard.items.info = !config.dashboard.items.info;
            } else if (key.name === 'p') {
                config.dashboard.items.positions = !config.dashboard.items.positions;
            } else if (key.name === 'c') {
                config.dashboard.items.candles = !config.dashboard.items.candles;
            } else if (key.name === 'w') {
                config.dashboard.items.warnings = !config.dashboard.items.warnings;
            } else if (key.name === 'e') {
                config.dashboard.items.errors = !config.dashboard.items.errors;
            } else if (key.name === 'o') {
                config.dashboard.items.orders = !config.dashboard.items.orders;
            } else if (key.name === 't') {
                config.dashboard.items.trades = !config.dashboard.items.trades;
            }

            Dashboard.liveTrade();
        });

        bootstrap.liveTrade();
        break;

    default:
        throw new Error('Selected mode is not supported.');
}
