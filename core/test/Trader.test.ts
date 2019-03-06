import Trader from "../models/Trader";
import store, { actions, selectors } from "../store";
import currentPosition from "../services/Positions";
import Order from "../models/Order";
import $ from "../services/Helpers";
import { orderTypes } from "../exchanges/Bitfinex/types";
import { Sides } from "../store/types";

const trader: Trader = new Trader();

beforeEach(() => {
    store.dispatch(actions.resetState());
    store.dispatch(actions.setTradingFee(0));
    store.dispatch(actions.setStartingBalance(1000));
    store.dispatch(actions.setCurrentBalance(1000));
    store.dispatch(actions.updateEntryPrice(0));
    store.dispatch(actions.updateQuantity(0));
    store.dispatch(actions.updateCurrentPrice(50));
});

it('Should include fee when opening and closing a position', async () => {
    // Bitfinex's default fee:
    store.dispatch(actions.setTradingFee(0.002));
    const quantity: number = 1;
    
    // to buy 1 quantity, you need "price * quantity * (1 + fee)"
    await trader.buyAtMarket(1);
    expect(store.getState().mainReducer.quantity).toBe(1);
    const expectedBalanceAfterCuttingFee: number = 1000 - (50 * quantity * (1 + 0.002));
    expect(store.getState().mainReducer.currentBalance).toBe(expectedBalanceAfterCuttingFee); 

    store.dispatch(actions.updateCurrentPrice(60));

    // on closing the position, we gain "price * quantity * (1 - fee)”
    await trader.sellAtMarket(1);
    expect(store.getState().mainReducer.quantity).toBe(0);
    expect(currentPosition.isOpen()).toBeFalsy();
    expect(store.getState().mainReducer.currentBalance).toBe(expectedBalanceAfterCuttingFee + (60 * quantity * (1 - 0.002)));
});

it('Should go short', async () => {
    const order: Order = await trader.sellAtMarket($.positionSizeToQuantity(100, store.getState().mainReducer.currentPrice));
    expect(order.type).toBe(orderTypes.MARKET);
    expect(order.isNew()).toBeFalsy();
    expect(order.isExecuted()).toBeTruthy();
    expect(order.price).toBe(store.getState().mainReducer.currentPrice);
    expect(order.side).toBe(Sides.SELL);
    expect(order.quantity).toBe(-2);

    expect(store.getState().mainReducer.currentBalance).toBe(900);
    expect(store.getState().mainReducer.entryPrice).toBe(50);
    expect(store.getState().mainReducer.quantity).toBe(-2);
});

it('Should go long', async () => {
    const order: Order = await trader.buyAtMarket($.positionSizeToQuantity(100, store.getState().mainReducer.currentPrice));
    expect(order.type).toBe(orderTypes.MARKET);
    expect(order.isNew()).toBeFalsy();
    expect(order.isExecuted()).toBeTruthy();
    expect(order.price).toBe(store.getState().mainReducer.currentPrice);
    expect(order.side).toBe(Sides.BUY);
    expect(order.quantity).toBe(2);

    expect(store.getState().mainReducer.currentBalance).toBe(900);
    expect(store.getState().mainReducer.entryPrice).toBe(50);
    expect(store.getState().mainReducer.quantity).toBe(2);
});

it('Should reduce the size of Position when reaching a certain price', async () => {
    await expect(trader.reducePositionAt(-(store.getState().mainReducer.currentPrice + 10), store.getState().mainReducer.currentPrice + 10, 'short'))
        .rejects
        .toThrow(`Invalid "side"`);

    await trader.buyAtMarket($.positionSizeToQuantity(100, store.getState().mainReducer.currentPrice)); 
    expect(store.getState().mainReducer.quantity).toBe(2);
    expect(store.getState().mainReducer.currentBalance).toBe(900);

    const order: Order = await trader.reducePositionAt(1, store.getState().mainReducer.currentPrice + 10, Sides.SELL);

    expect(order.type).toBe(orderTypes.LIMIT);
    expect(order.isNew()).toBeTruthy();
    expect(order.isReduceOnly()).toBeTruthy();
    expect(order.price).toBe(store.getState().mainReducer.currentPrice + 10);
    expect(order.side).toBe(Sides.SELL);
    expect(order.quantity).toBe(-1);
});

it('Should open a position using a STOP order', async () => {
    await expect(trader.startProfitAt('long', store.getState().mainReducer.currentPrice + 10, store.getState().mainReducer.currentPrice + 10))
        .rejects
        .toThrow(`Invalid "side"`);
    await expect(trader.startProfitAt(Sides.BUY, store.getState().mainReducer.currentPrice - 10, store.getState().mainReducer.currentPrice + 10))
        .rejects
        .toThrow(`Invalid "price"`);
    await expect(trader.startProfitAt(Sides.SELL, store.getState().mainReducer.currentPrice + 10, store.getState().mainReducer.currentPrice + 10))
        .rejects
        .toThrow(`Invalid "price"`);

    const order: Order = await trader.startProfitAt(Sides.BUY, store.getState().mainReducer.currentPrice + 10, 1);

    expect(order.type).toBe('STOP');
    expect(order.isNew()).toBeTruthy();
    expect(order.isReduceOnly()).toBeFalsy();
    expect(order.price).toBe(store.getState().mainReducer.currentPrice + 10);
    expect(order.side).toBe(Sides.BUY);
    expect(order.quantity).toBe(1);
});

it('Should submit a STOP order', async () => {
    await expect(trader.stopLossAt('long', store.getState().mainReducer.currentPrice + 10, store.getState().mainReducer.currentPrice + 10))
        .rejects
        .toThrow(`Invalid "side"`);
    
    await trader.buyAtMarket($.positionSizeToQuantity(100, store.getState().mainReducer.currentPrice))
    expect(store.getState().mainReducer.quantity).toBe(2);

    const order: Order = await trader.stopLossAt(Sides.SELL, store.getState().mainReducer.currentPrice - 10, 2);

    expect(order.type).toBe('STOP');
    expect(order.isNew()).toBeTruthy();
    expect(order.isReduceOnly()).toBeFalsy();
    expect(order.price).toBe(store.getState().mainReducer.currentPrice - 10);
    expect(order.side).toBe(Sides.SELL);
    expect(order.quantity).toBe(-2);
});

it('Should submit a TRAILING STOP order', async () => {
    await expect(trader.trailingStopOrder('long', store.getState().mainReducer.currentPrice + 10, store.getState().mainReducer.currentPrice + 10))
        .rejects
        .toThrow(`Invalid "side"`);
    
    await trader.buyAtMarket($.positionSizeToQuantity(100, store.getState().mainReducer.currentPrice))
    expect(store.getState().mainReducer.quantity).toBe(2);

    const order: Order = await trader.trailingStopOrder(Sides.SELL, 10, 2);

    expect(order.type).toBe('TRAILING STOP');
    expect(order.isNew()).toBeTruthy();
    expect(order.isTrailingStop()).toBeTruthy();
    expect(order.isReduceOnly()).toBeTruthy();
    expect(order.price).toBe(store.getState().mainReducer.currentPrice - 10);
    expect(order.side).toBe(Sides.SELL);
    expect(order.quantity).toBe(-2);
});

it('Should submit a STOP order that closes the position', async () => {
    await expect(trader.closeAtStopLossAt('long', store.getState().mainReducer.currentPrice + 10, store.getState().mainReducer.currentPrice + 10))
        .rejects
        .toThrow(`Invalid "side"`);
    
    await trader.buyAtMarket($.positionSizeToQuantity(100, store.getState().mainReducer.currentPrice))
    expect(store.getState().mainReducer.quantity).toBe(2);

    const order: Order = await trader.closeAtStopLossAt(Sides.SELL, store.getState().mainReducer.currentPrice - 10, 2);

    expect(order.type).toBe('STOP');
    expect(order.isNew()).toBeTruthy();
    expect(order.isTrailingStop()).toBeFalsy();
    expect(order.isClose()).toBeTruthy();
    expect(order.price).toBe(store.getState().mainReducer.currentPrice - 10);
    expect(order.side).toBe(Sides.SELL);
    expect(order.quantity).toBe(-2);
});

it('Should cancel a single order', async () => {
    const orderToCancel: Order = await trader.startProfitAt(Sides.BUY, store.getState().mainReducer.currentPrice + 10, 2);
    const orderToRemainActive: Order = await trader.startProfitAt(Sides.BUY, store.getState().mainReducer.currentPrice + 20, 4);

    expect(selectors.getOrder(orderToCancel.id).isActive()).toBeTruthy();
    expect(selectors.getOrder(orderToRemainActive.id).isActive()).toBeTruthy();

    await trader.cancelOrder(orderToCancel.id);

    expect(selectors.getOrder(orderToCancel.id).isCanceled()).toBeTruthy();
    expect(selectors.getOrder(orderToRemainActive.id).isActive()).toBeTruthy();
});

it('Should cancel all active orders', async () => {
    // let's say we have one ACTIVE order and one EXECUTED order
    // and after executing cancelAllOrders() only the ACTIVE
    // orders must get canceled and not EXECUTED ones. 
    const executedOrder: Order = await trader.buyAtMarket(1);
    const orderToCancel1: Order = await trader.startProfitAt(Sides.BUY, store.getState().mainReducer.currentPrice + 10, 2);
    const orderToCancel2: Order = await trader.startProfitAt(Sides.SELL, store.getState().mainReducer.currentPrice - 10, 2);

    expect(selectors.getOrder(orderToCancel1.id).isActive()).toBeTruthy();
    expect(selectors.getOrder(orderToCancel2.id).isActive()).toBeTruthy();
    expect(selectors.getOrder(executedOrder.id).isExecuted()).toBeTruthy();

    await trader.cancelAllOrders();

    expect(selectors.getOrder(orderToCancel1.id).isCanceled()).toBeTruthy();
    expect(selectors.getOrder(orderToCancel2.id).isCanceled()).toBeTruthy();
    expect(selectors.getOrder(executedOrder.id).isCanceled()).toBeFalsy();
    expect(selectors.getOrder(executedOrder.id).isExecuted()).toBeTruthy();
});
