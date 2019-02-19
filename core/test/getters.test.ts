import store, { actions, selectors } from "../store";
import Order from "../models/Order";
import Trader from "../models/Trader";
import Candle from "../models/Candle";
import config from "../../config";
import { supportedSymbols, supportedTimeFrames } from "../store/types";
import $ from "../services/Helpers";
const trader: Trader = new Trader();

beforeEach(() => {
    store.dispatch(actions.resetState());
}); 

it('Should return order', async () => {
    store.dispatch(actions.updateCurrentPrice(140));

    // executed orders 
    const order: Order = await trader.buyAtMarket(1);
    await trader.buyAtMarket(1);

    expect(selectors.getOrder(order.id)).toBe(order);
}); 

it('Should return the count of active orders', async () => {
    store.dispatch(actions.updateCurrentPrice(140));

    // executed orders 
    await trader.buyAtMarket(1);
    await trader.buyAtMarket(1);
    // active orders 
    await trader.reducePositionAt('sell', store.getState().mainReducer.currentPrice + 10, 1);
    await trader.reducePositionAt('sell', store.getState().mainReducer.currentPrice + 15, 0.5);

    expect(selectors.countOfActiveOrders()).toBe(2);
}); 

it('Should return latest trading candle', () => {
    config.app.symbolToTrade = 'BTCUSD';
    config.app.timeFrameToTrade = '5m';

    const candle1: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle2: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle1));
    store.dispatch(actions.addCandle(candle2));

    const tradingCandle1: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const tradingCandle2: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(tradingCandle1));
    store.dispatch(actions.addCandle(tradingCandle2));
    
    const candle3: Candle = new Candle(
        {
            symbol: 'LTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle4: Candle = new Candle(
        {
            symbol: 'LTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle3));
    store.dispatch(actions.addCandle(candle4));
    
    const candle5: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '15m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle6: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '15m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle5));
    store.dispatch(actions.addCandle(candle6));
    
    expect(selectors.getCurrentTradingCandle()).toEqual(tradingCandle2);
});

it('Should return latest candle for a specific symbol or a specific timeFrame', () => {
    config.app.symbolToTrade = 'BTCUSD';
    config.app.timeFrameToTrade = '5m';

    const candle1: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle2: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle1));
    store.dispatch(actions.addCandle(candle2));

    const tradingCandle1: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const tradingCandle2: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(tradingCandle1));
    store.dispatch(actions.addCandle(tradingCandle2));
    
    const candle3: Candle = new Candle(
        {
            symbol: 'LTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle4: Candle = new Candle(
        {
            symbol: 'LTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle3));
    store.dispatch(actions.addCandle(candle4));
    
    const candle5: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '15m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle6: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '15m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle5));
    store.dispatch(actions.addCandle(candle6));
    
    expect(selectors.getCurrentCandleFor(undefined, '15m')).toEqual(candle6);
    expect(selectors.getCurrentCandleFor('ETHUSD')).toEqual(candle2);
});

it('Should return all the trading candles', () => {
    config.app.symbolToTrade = 'BTCUSD';
    config.app.timeFrameToTrade = '5m';

    const candle1: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle2: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle1));
    store.dispatch(actions.addCandle(candle2));

    const tradingCandle1: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const tradingCandle2: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(tradingCandle1));
    store.dispatch(actions.addCandle(tradingCandle2));
    
    const candle3: Candle = new Candle(
        {
            symbol: 'LTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle4: Candle = new Candle(
        {
            symbol: 'LTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle3));
    store.dispatch(actions.addCandle(candle4));
    
    const candle5: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '15m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle6: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '15m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle5));
    store.dispatch(actions.addCandle(candle6));
    
    expect(selectors.getTradingCandles()).toEqual([tradingCandle1, tradingCandle2]);
});

it('Should return all candles for a specific symbol and/or a specific timeFrame', () => {
    config.app.symbolToTrade = 'BTCUSD';
    config.app.timeFrameToTrade = '5m';

    const candle1: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle2: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle1));
    store.dispatch(actions.addCandle(candle2));

    const tradingCandle1: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const tradingCandle2: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(tradingCandle1));
    store.dispatch(actions.addCandle(tradingCandle2));
    
    const candle3: Candle = new Candle(
        {
            symbol: 'LTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle4: Candle = new Candle(
        {
            symbol: 'LTCUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle3));
    store.dispatch(actions.addCandle(candle4));
    
    const candle5: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '15m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle6: Candle = new Candle(
        {
            symbol: 'BTCUSD',
            timeFrame: '15m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle5));
    store.dispatch(actions.addCandle(candle6));
    
    expect(selectors.getCandlesFor(supportedSymbols.LTCUSD, supportedTimeFrames.fiveMinutes)).toEqual([
        candle3, candle4
    ]);
});

it('Should return past candle', () => {
    config.app.symbolToTrade = 'ETHUSD';
    config.app.timeFrameToTrade = '5m';

    const candle1: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle2: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle3: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + (60000 * 2)),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle4: Candle = new Candle(
        {
            symbol: 'ETHUSD',
            timeFrame: '5m',  
            timestamp: $.transformTimestamp(1543387260000 + (60000 * 3)),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle1));
    store.dispatch(actions.addCandle(candle2));
    store.dispatch(actions.addCandle(candle3));
    store.dispatch(actions.addCandle(candle4));
    
    expect(selectors.getPastTradingCandle(0)).toEqual(candle4);
    expect(selectors.getPastTradingCandle(1)).toEqual(candle3);
    expect(selectors.getPastTradingCandle(2)).toEqual(candle2);
    expect(selectors.getPastTradingCandle(3)).toEqual(candle1);
    expect(selectors.getPastTradingCandle(4)).toEqual(undefined);
    expect(selectors.getPastTradingCandle(5)).toEqual(undefined);
});

it('Should return past candle', () => {
    config.app.symbolToTrade = 'BTCUSD';
    config.app.timeFrameToTrade = '15m';

    const candle1: Candle = new Candle(
        {
            symbol: supportedSymbols.ETHUSD,
            timeFrame: supportedTimeFrames.fiveMinutes,  
            timestamp: $.transformTimestamp(1543387260000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle2: Candle = new Candle(
        {
            symbol: supportedSymbols.ETHUSD,
            timeFrame: supportedTimeFrames.fiveMinutes,  
            timestamp: $.transformTimestamp(1543387260000 + 60000),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle3: Candle = new Candle(
        {
            symbol: supportedSymbols.ETHUSD,
            timeFrame: supportedTimeFrames.fiveMinutes,  
            timestamp: $.transformTimestamp(1543387260000 + (60000 * 2)),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    const candle4: Candle = new Candle(
        {
            symbol: supportedSymbols.ETHUSD,
            timeFrame: supportedTimeFrames.fiveMinutes,  
            timestamp: $.transformTimestamp(1543387260000 + (60000 * 3)),
            open: 117.31,
            close: 127.27,
            high: 127.31,
            low: 117.17,
            volume: 195.88077825
        }
    );
    store.dispatch(actions.addCandle(candle1));
    store.dispatch(actions.addCandle(candle2));
    store.dispatch(actions.addCandle(candle3));
    store.dispatch(actions.addCandle(candle4));
    
    expect(selectors.getPastCandleFor(0, supportedSymbols.ETHUSD, supportedTimeFrames.fiveMinutes)).toEqual(candle4);
    expect(selectors.getPastCandleFor(1, supportedSymbols.ETHUSD, supportedTimeFrames.fiveMinutes)).toEqual(candle3);
    expect(selectors.getPastCandleFor(2, supportedSymbols.ETHUSD, supportedTimeFrames.fiveMinutes)).toEqual(candle2);
    expect(selectors.getPastCandleFor(3, supportedSymbols.ETHUSD, supportedTimeFrames.fiveMinutes)).toEqual(candle1);
    expect(selectors.getPastCandleFor(4, supportedSymbols.ETHUSD, supportedTimeFrames.fiveMinutes)).toEqual(undefined);
    expect(selectors.getPastCandleFor(5, supportedSymbols.ETHUSD, supportedTimeFrames.fiveMinutes)).toEqual(undefined);
});