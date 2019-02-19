import Order from '../models/Order';
import Trader from '../models/Trader';
import $ from '../services/Helpers';
import store, { actions } from '../store';
import { reduxActionLogs } from '../store/reducers/mainReducer';
const trader: Trader = new Trader();

beforeEach(() => {
    store.dispatch(actions.resetState());
    store.dispatch(actions.setTradingFee(0));
    store.dispatch(actions.updateCurrentPrice(50));
});

it('Should log trades', async () => {
    // open a long position
    const buyOrder: Order = await trader.buyAtMarket(1);
    expect(store.getState().mainReducer.quantity).toEqual(1);

    // price goes up
    store.dispatch(actions.updateCurrentPrice(60));

    // close position. We should end up with $10 profit
    const sellOrder: Order = await trader.sellAtMarket(1);
    expect(store.getState().mainReducer.quantity).toEqual(0);

    // We should end up with $10 profit
    expect(store.getState().mainReducer.profit).toEqual(10);
    expect(store.getState().orders).toEqual([buyOrder, sellOrder]);
});

it('Should log redux actions despite the type of the action', () => {
    store.dispatch({ type: 'TEST_ACTION' });

    expect(reduxActionLogs.find(item => item.type === 'TEST_ACTION')).toEqual({
        type: 'TEST_ACTION', 
        createdAt: $.now()
    }); 
});