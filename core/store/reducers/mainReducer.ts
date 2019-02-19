import config from '../../../config';
import $ from '../../services/Helpers';
import { ActionTypes as types, StateInterface } from './../types';
import { ReduxActionLogInterface } from '../../interfaces/LogInterfaces';
import { ActionInterface } from '../../interfaces/ActionInterface';

export const reduxActionLogs: ReduxActionLogInterface[] = [];

export const initialState: StateInterface = {
    sessionID: $.generateUniqueID(),

    currentPrice: 0,
    currentTime: '',
    currentBalance: config.app.startingBalance,
    startingBalance: config.app.startingBalance,
    conflictingOrdersCount: 0,
    startTime: new Date().valueOf(),
    profit: 0,
    entryPrice: null,
    quantity: 0,
};

/**
 * The main reducer that performs the reducing for most parts of the store.
 *
 * @export
 * @param {StateInterface} [state=initialState]
 * @param {ActionInterface} [action]
 * @returns {StateInterface}
 */
export function mainReducer(state: StateInterface = initialState, action?: ActionInterface): StateInterface {
    // log action 
    reduxActionLogs.push({
        type: action.type,
        createdAt: $.isBackTesting() ? (state.currentTime ? state.currentTime : $.now()) : $.now()
    });

    switch (action.type) {
        case types.RESET_STATE:
            return initialState;
        case types.SET_STARTING_BALANCE:
            return { ...state, startingBalance: action.payload };
        case types.SET_CURRENT_BALANCE:
            return { ...state, currentBalance: action.payload };
        case types.INCREASE_CURRENT_BALANCE:
            return { 
                ...state, 
                currentBalance: state.currentBalance + (Math.abs(action.payload.balance) * (1 - action.payload.fee))
            };
        case types.REDUCE_CURRENT_BALANCE:
            return {
                 ...state, 
                 currentBalance: state.currentBalance - Math.abs(action.payload.balance) * (1 + action.payload.fee)
            };
        case types.ADD_PROFIT:
            return {
                 ...state, 
                profit: state.profit + 
                (action.payload.profit > 0 ? (action.payload.profit * (1 - action.payload.fee)) : (action.payload.profit * (1 + action.payload.fee)))
            };
        case types.INCREASE_CONFLICTING_ORDERS_COUNT:
            return { ...state, conflictingOrdersCount: action.payload };
        case types.UPDATE_CURRENT_TIME:
            return { ...state, currentTime: action.payload };
        case types.UPDATE_CURRENT_PRICE:
            return { ...state, currentPrice: action.payload };
        case types.SET_START_TIME:
            return { ...state, startTime: action.payload };
        case types.UPDATE_QUANTITY:
            return { ...state, quantity: action.payload };
        case types.UPDATE_ENTRY_PRICE:
            return { ...state, entryPrice: action.payload };
        case types.SET_SESSION_ID:
            return { ...state, sessionID: action.payload };

        default:
            return state;
    }
}