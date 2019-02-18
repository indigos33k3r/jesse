import Order from '../../models/Order';
import { ActionTypes as types, orderStatuses } from './../types';
import { ActionInterface } from '../../interfaces/ActionInterface';

/**
 * The main reducer that performs the reducing for most parts of the store.
 *
 * @export
 * @param {Order[]} [state=[]]
 * @param {ActionInterface} [action]
 * @returns {Order[]}
 */
export function ordersReducer(state: Order[] = [], action?: ActionInterface): Order[] {
    switch (action.type) {
        case types.RESET_STATE:
            return [];
        case types.ADD_ORDER:
            return [...state, action.payload];
        case types.CANCEL_ORDER:
            return state.map(item => {
                if (item.id !== action.payload.id) return item;

                return new Order({
                    ...item,
                    status: orderStatuses.CANCELED,
                    canceledAt: action.payload.time
                });
            });
        case types.EXECUTE_ORDER:
            return state.map(item => {
                if (item.id !== action.payload.id) return item;

                return new Order({
                    ...item,
                    status: orderStatuses.EXECUTED,
                    executedAt: action.payload.time
                });
            });
        case types.UPDATE_ORDER_PRICE:
            return state.map(item => {
                if (item.id !== action.payload.id) return item;

                return new Order({ 
                    ...item, 
                    price: action.payload.price, 
                    updatedAt: action.payload.time
                 });
            })
        case types.UPDATE_ORDER_QUANTITY:
            return state.map(item => {
                if (item.id !== action.payload.orderID) return item;
                return new Order({ ...item, quantity: action.payload.quantity });
            })

        default:
            return state;
    }
}
