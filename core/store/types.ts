
export interface StateInterface {
    readonly sessionID: number;

    readonly startingBalance: number;
    readonly currentBalance: number;
    readonly profit: number;
    readonly currentPrice: number;
    readonly conflictingOrdersCount: number;
    readonly currentTime: string;
    readonly startTime: number;
    readonly tradingFee: number;

    readonly quantity: number;
    readonly entryPrice: number;
    readonly symbol: string;
}

export const enum ActionTypes {
    RESET_STATE = 'RESET_STATE',
    SET_STARTING_BALANCE = 'SET_STARTING_BALANCE',
    SET_CURRENT_BALANCE = 'SET_CURRENT_BALANCE',
    INCREASE_CURRENT_BALANCE = 'INCREASE_CURRENT_BALANCE', 
    REDUCE_CURRENT_BALANCE = 'REDUCE_CURRENT_BALANCE', 
    UPDATE_CURRENT_TIME = 'UPDATE_CURRENT_TIME',
    UPDATE_CURRENT_PRICE = 'UPDATE_CURRENT_PRICE',
    ADD_PROFIT = 'ADD_PROFIT',
    INCREASE_CONFLICTING_ORDERS_COUNT = 'INCREASE_CONFLICTING_ORDERS_COUNT',
    ADD_CANDLE_SET_TIME_FRAME = 'ADD_CANDLE_SET_TIME_FRAME',
    ADD_CANDLE = 'ADD_CANDLE',
    BATCH_ADD_CANDLES = 'BATCH_ADD_CANDLES',
    SET_START_TIME = 'SET_START_TIME',
    UPDATE_QUANTITY = 'UPDATE_QUANTITY',
    UPDATE_ENTRY_PRICE = 'UPDATE_ENTRY_PRICE',
    SET_TRADING_SYMBOL = 'SET_TRADING_SYMBOL',
    ADD_TRADE_STEPS = 'ADD_TRADE_STEPS',
    ADD_TRADE = 'ADD_TRADE',
    ADD_ORDER = 'ADD_ORDER',
    UPDATE_ORDER_PRICE = 'UPDATE_ORDER_PRICE',
    UPDATE_ORDER_QUANTITY = 'UPDATE_ORDER_QUANTITY',
    CANCEL_ORDER = 'CANCEL_ORDER', 
    EXECUTE_ORDER = 'EXECUTE_ORDER', 
    LOG_ERROR = 'LOG_ERROR',
    LOG_WARNING = 'LOG_WARNING',
    SET_SESSION_ID = 'SET_SESSION_ID', 
    SET_TRADING_FEE = 'SET_TRADING_FEE'  
}

export const enum Sides {
    BUY = 'buy',
    SELL = 'sell'
}

export const enum TradeTypes {
    LONG = 'long',
    SHORT = 'short'
}

export const enum orderStatuses {
    ACTIVE = 'ACTIVE',
    CANCELED = 'CANCELED',
    EXECUTED = 'EXECUTED',
    PARTIALLY_FILLED = 'PARTIALLY FILLED'
}

export const enum supportedSymbols {
    BTCUSD = 'BTCUSD',
    ETHUSD = 'ETHUSD',
    LTCUSD = 'LTCUSD',
    XRPUSD = 'XRPUSD',
    EOSUSD = 'EOSUSD',
    NEOUSD = 'NEOUSD',
    ZECUSD = 'ZECUSD',
    XMRUSD = 'XMRUSD',
    DSHUSD = 'DSHUSD',
    IOTUSD = 'IOTUSD',
    OMGUSD = 'OMGUSD',
    ETPUSD = 'ETPUSD'
}

export const enum supportedTimeFrames {
    oneMinute = '1m',
    fiveMinutes = '5m',
    fifteenMinutes = '15m',
    thirtyMinutes = '30m',
    oneHour = '1h',
    threeHours = '3h',
    sixHours = '6h',
    oneDay = '1d'
}

export const enum supportedColors {
    GREEN = 'green',
    YELLOW = 'yellow',
    RED = 'red',
    MAGENTA = 'magenta',
    BLACK = 'black'
}

export const enum tradeLogTypes {
    OPEN_POSITION = 'OPEN POSITION',
    CLOSE_POSITION = 'CLOSE POSITION',
    INCREASE_POSITION = 'INCREASE POSITION',
    REDUCE_POSITION = 'REDUCE POSITION'
}

export const enum orderFlags {
    OCO = 'OCO',
    POST_ONLY = 'PostOnly',
    CLOSE = 'Close',
    HIDDEN = 'Hidden',
    REDUCE_ONLY = 'ReduceOnly', 
}
