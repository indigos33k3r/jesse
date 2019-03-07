import $ from '../services/Helpers';
import store, { actions } from '../store';
import { reduxActionLogs } from '../store/reducers/mainReducer';

beforeEach(() => {
    store.dispatch(actions.resetState());
    store.dispatch(actions.setTradingFee(0));
    store.dispatch(actions.updateCurrentPrice(50));
});

it('Should log redux actions despite the type of the action', () => {
    store.dispatch({ type: 'TEST_ACTION' });

    expect(reduxActionLogs.find(item => item.type === 'TEST_ACTION')).toEqual({
        type: 'TEST_ACTION', 
        createdAt: $.now()
    }); 
});