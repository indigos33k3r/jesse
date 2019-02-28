import store, { selectors } from "../../store";
import $ from "../Helpers";
import JI from 'jesse-indicators';

const Indicators = {
    SMA(period: number, symbol: string = store.getState().config.tradingSymbol, timeFrame: string = store.getState().config.tradingTimeFrame): number {
        return JI.SMA(
            $.pluckCandles(selectors.getCandlesFor(symbol, timeFrame), 'close'), 
            period
        );
    }, 

    EMA(period: number, symbol: string = store.getState().config.tradingSymbol, timeFrame: string = store.getState().config.tradingTimeFrame): number {
        return JI.EMA(
            $.pluckCandles(selectors.getCandlesFor(symbol, timeFrame), 'close'), 
            period
        );
    }, 
};

export default Indicators;