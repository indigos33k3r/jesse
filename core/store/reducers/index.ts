import { combineReducers } from 'redux';
import { lastActionReducer } from './lastActionReducer';
import { mainReducer } from './mainReducer';
import { candlesReducer } from './candlesReducer';
import { ordersReducer } from './ordersReducer';
import { tradesReducer } from './tradesReducer';
import { logsReducer } from './logsReducer';

const combinedReducer = combineReducers({
    mainReducer,
    lastAction: lastActionReducer,
    candles: candlesReducer, 
    orders: ordersReducer, 
    trades: tradesReducer, 
    logs: logsReducer
});

export default combinedReducer;
