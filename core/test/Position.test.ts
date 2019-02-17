import store, { actions } from '../store';
import currentPosition from '../services/Positions';

beforeEach(() => {
    store.dispatch(actions.resetState());
    store.dispatch(actions.setTradingFee(0));
    store.dispatch(actions.setStartingBalance(1000));
    store.dispatch(actions.setCurrentBalance(1000));
    store.dispatch(actions.updateEntryPrice(50));
    store.dispatch(actions.updateQuantity(2));
    store.dispatch(actions.updateCurrentPrice(60));
});

it('Should return value of symbol in USD', () => {
    expect(currentPosition.value()).toEqual(120);
});

it('Should return the current pnl of the current open position', () => {
    // for a long position 
    expect(currentPosition.pnl()).toBe(20); 

    store.dispatch(actions.updateCurrentPrice(store.getState().mainReducer.currentPrice - 20))
    expect(currentPosition.pnl()).toBe(-20); 

    // for a short position 
    store.dispatch(actions.setStartingBalance(1000));
    // store.dispatch(actions.cutCurrentBalance(1000));
    store.dispatch(actions.updateEntryPrice(50));
    store.dispatch(actions.updateQuantity(-2));
    store.dispatch(actions.updateCurrentPrice(40));

    expect(currentPosition.pnl()).toBe(20); 
});

it('Should return type of the position', () => {
    expect(currentPosition.type()).toEqual('long');
    store.dispatch(actions.updateQuantity(-2))
    expect(currentPosition.type()).toEqual('short');
    store.dispatch(actions.updateQuantity(0)); 
    expect(currentPosition.type()).toEqual('close');
});

it('Should tell if position is open', () => {
    expect(currentPosition.isOpen()).toEqual(true);
});

it('Should update position', () => {
    expect(store.getState().mainReducer.quantity).toBe(2);
    expect(store.getState().mainReducer.currentBalance).toBe(1000);

    // increase position size
    currentPosition.update(2, 50);

    expect(store.getState().mainReducer.quantity).toBe(4);
    expect(store.getState().mainReducer.currentBalance).toBe(900);

    // decrease position size 
    currentPosition.update(-2, 50);

    expect(store.getState().mainReducer.quantity).toBe(2);
    expect(store.getState().mainReducer.currentBalance).toBe(1000);

    // close position  
    currentPosition.update(-2, 50);

    expect(store.getState().mainReducer.quantity).toBe(0);
    expect(store.getState().mainReducer.currentBalance).toBe(1100);

    // decrease position size 
    currentPosition.update(-2, 50);

    expect(store.getState().mainReducer.quantity).toBe(-2);
    expect(store.getState().mainReducer.currentBalance).toBe(1000);
});

it('Should close position', () => {
    store.dispatch(actions.updateQuantity(2));
    store.dispatch(actions.updateCurrentPrice(50));

    currentPosition.close();

    expect(store.getState().mainReducer.quantity).toBe(0);
    expect(store.getState().mainReducer.currentBalance).toBe(1100);
});

it('Should reduce a long position', () => {
    store.dispatch(actions.updateQuantity(2));
    store.dispatch(actions.updateCurrentPrice(50));
    
    currentPosition.reduce(1);

    expect(store.getState().mainReducer.quantity).toBe(1);
    expect(store.getState().mainReducer.currentBalance).toBe(1050);
});

it('Should reduce a short position', () => {
    store.dispatch(actions.updateQuantity(-2));
    store.dispatch(actions.updateCurrentPrice(50));

    currentPosition.reduce(1);

    expect(store.getState().mainReducer.quantity).toBe(-1);
    expect(store.getState().mainReducer.currentBalance).toBe(1050);
});

it('Should be able to close via reduce position too', () => {
    currentPosition.reduce(2, 50);

    expect(store.getState().mainReducer.quantity).toBe(0);
    expect(store.getState().mainReducer.currentBalance).toBe(1100);
});
