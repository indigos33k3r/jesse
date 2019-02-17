import Trade from '../../models/Trade';
import { ActionTypes as types } from './../types';
import { ActionInterface } from '../../interfaces/ActionInterface';

/**
 * Reducer for trades[]
 *
 * @export
 * @param {Trade[]} [state=[]]
 * @param {ActionInterface} [action]
 * @returns {Trade[]}
 */
export function tradesReducer(state: Trade[] = [], action?: ActionInterface): Trade[] {
    switch (action.type) {
        case types.RESET_STATE:
            return [];
        case types.ADD_TRADE:
            return [...state, action.payload];

        default:
            return state;
    }
}
