import { createStore } from 'redux';
import * as storeActions from './actions';
import * as storeSelectors from './selectors';
import storeReducers from './reducers/index';
import { mainReducer as rootReducer } from './reducers/mainReducer';

// create a new redux store instance
const store = createStore(storeReducers);

export const actions = storeActions;
export const mainReducer = rootReducer;
export const selectors = storeSelectors;
export default store;