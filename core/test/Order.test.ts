
import { orderTypes } from '../exchanges/Bitfinex/types';
import store, { actions } from '../store';
import Order from '../models/Order';
import { Sides, orderStatuses } from '../store/types';
import $ from '../services/Helpers';
import config from '../../config';

beforeEach(() => {
    store.dispatch(actions.resetState());
});

it('Should cancel order', () => {
    const order: Order = new Order({
        id: $.generateUniqueID(),
        flag: null,
        symbol: config.symbolToTrade,
        type: orderTypes.LIMIT,
        price: 129.33,
        quantity: 10.2041,
        side: Sides.BUY,
        status: orderStatuses.ACTIVE,
        createdAt: $.now(),
        executedAt: null, 
        canceledAt: null
    });

    store.dispatch(actions.addOrder(order));
    
    order.cancel(); 

    expect(store.getState().orders[0].status).toBe(orderStatuses.CANCELED);
    expect(store.getState().orders[0].canceledAt).toBe($.now());
});

it('Should execute order', () => {
    const order: Order = new Order({
        id: $.generateUniqueID(),
        flag: null,
        symbol: config.symbolToTrade,
        type: orderTypes.LIMIT,
        price: 129.33,
        quantity: 10.2041,
        side: Sides.BUY,
        status: orderStatuses.ACTIVE,
        createdAt: $.now(),
        executedAt: null, 
        canceledAt: null
    });

    store.dispatch(actions.addOrder(order));
    
    order.execute(); 

    expect(store.getState().orders[0].status).toBe(orderStatuses.EXECUTED);
    expect(store.getState().orders[0].executedAt).toBe($.now());
});
