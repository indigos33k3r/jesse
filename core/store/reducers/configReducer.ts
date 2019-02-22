import config from '../../../config';
import { ActionInterface } from '../../interfaces/ActionInterface';
import { ActionTypes as types } from './../types';

interface StateInterface {
    readonly tradingFee: number;
    readonly tradingSymbol: string;
}

const initialState: StateInterface = {
    tradingFee: config.exchanges.tradingFee,
    tradingSymbol: config.app.symbolToTrade
};

export function configReducer(state: StateInterface = initialState, action?: ActionInterface): StateInterface {
    switch (action.type) {
        case types.RESET_STATE:
            return initialState;

        case types.SET_TRADING_FEE:
            return { ...state, tradingFee: action.payload };
        case types.SET_TRADING_SYMBOL:
            return { ...state, tradingSymbol: action.payload };

        default:
            return state;
    }
}
