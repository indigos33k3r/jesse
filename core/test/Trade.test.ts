import store, { actions } from "../store";
import Trade from "../models/Trade";
import { TradeTypes, supportedSymbols } from "../store/types";
import $ from "../services/Helpers";

beforeEach(() => {
    store.dispatch(actions.resetState());
});

it('Should be able to add a trade into store', () => {
    const trade: Trade = new Trade({
        type: TradeTypes.LONG,
        entryPrice: 50,
        exitPrice: 60,
        takeProfitPrice: 60,
        stopLossPrice: 40,
        quantity: 1,
        fee: 0,
        orders: [],
        symbol: supportedSymbols.BTCUSD,
        openedAt: $.now(),
        closedAt: $.now()
    });

    store.dispatch(actions.addTrade(trade));
    expect(store.getState().trades).toEqual([trade]);
});

it('Should return the R(reward/risk ratio)', () => {
    const trade: Trade = new Trade({
        type: TradeTypes.LONG,
        entryPrice: 10,
        exitPrice: 20,
        takeProfitPrice: 20,
        stopLossPrice: 5,
        quantity: 1,
        fee: 0,
        orders: [],
        symbol: supportedSymbols.BTCUSD,
        openedAt: $.now(),
        closedAt: $.now()
    });
    
    expect(trade.riskRewardRatio()).toEqual(2);
});

it('Should return the PNL', () => {
    const trade: Trade = new Trade({
        type: TradeTypes.LONG,
        entryPrice: 10,
        exitPrice: 20,
        takeProfitPrice: 20,
        stopLossPrice: 5,
        quantity: 1,
        fee: 0,
        orders: [],
        symbol: supportedSymbols.BTCUSD,
        openedAt: $.now(),
        closedAt: $.now()
    });
    
    expect(trade.pnl()).toEqual(10);
});

it('Should return the PNL percentage', () => {
    const trade: Trade = new Trade({
        type: TradeTypes.LONG,
        entryPrice: 10,
        exitPrice: 12,
        takeProfitPrice: 20,
        stopLossPrice: 5,
        quantity: 1,
        fee: 0,
        orders: [],
        symbol: supportedSymbols.BTCUSD,
        openedAt: $.now(),
        closedAt: $.now()
    });
    
    expect(trade.percentagePNL()).toEqual(20);
});

it('Should return the size of the whole trade', () => {
    const trade: Trade = new Trade({
        type: TradeTypes.LONG,
        entryPrice: 10,
        exitPrice: 12,
        takeProfitPrice: 20,
        stopLossPrice: 5,
        quantity: 1,
        fee: 0,
        orders: [],
        symbol: supportedSymbols.BTCUSD,
        openedAt: $.now(),
        closedAt: $.now()
    });
    
    expect(trade.size()).toEqual(10);
});

it('Should return the period the trade has taken to be done', () => {
    const trade: Trade = new Trade({
        type: TradeTypes.LONG,
        entryPrice: 10,
        exitPrice: 12,
        takeProfitPrice: 20,
        stopLossPrice: 5,
        quantity: 1,
        fee: 0,
        orders: [],
        symbol: supportedSymbols.BTCUSD,
        openedAt: '2016-10-29T00:00:00Z',
        closedAt: '2016-10-29T00:01:00Z'
    });

    // 1min = 60 seconds 
    expect(trade.holdingPeriod()).toEqual(60);
});