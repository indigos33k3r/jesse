import { combineReducers } from 'redux';
import { lastActionReducer } from './lastActionReducer';
import { mainReducer } from './mainReducer';
import { candlesReducer } from './candlesReducer';
import { ordersReducer } from './ordersReducer';
import { tradesReducer } from './tradesReducer';
import { logsReducer } from './logsReducer';
import { configReducer } from './configReducer';

const combinedReducer = combineReducers({
    mainReducer,
    config: configReducer, 
    lastAction: lastActionReducer,
    candles: candlesReducer, 
    orders: ordersReducer, 
    trades: tradesReducer, 
    logs: logsReducer
});

export default combinedReducer;
