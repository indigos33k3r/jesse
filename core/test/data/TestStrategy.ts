import Strategy from "../../models/Strategy";
import store from "../../store";
import $ from "../../services/Helpers";

/**
 * A strategy written to be used at 'backtest.test.ts'.
 * If you're looking for an example strategy to 
 * copy from, check out 'ExampleStrategy.ts'.
 *
 * @export
 * @class TestStrategy
 * @extends {Strategy}
 */
export default class TestStrategy extends Strategy {
    constructor(minimumRequiredCandles: number = 0) {
        super('A strategy used for testing', '0.0.1', minimumRequiredCandles);
    }

    async check() {
        // trade #1
        // A failing trade that gets closed with the stopLoss order. 09:59
        if (store.getState().mainReducer.currentTime === $.transformTimestamp(1547200740000)) {
            this.openPositionOrder = await this.trader.buyAt(10.2041, 129.33);
            this.stopLossPrice = 128.35;
            this.takeProfitPrice = 131.29; 
        }

        // trade #2 
        // A winning trade that is closed with the takeProfit order. 
        // notice that in this trade is very short-lived. In fact,
        // it's opened and closed inside the very same 5m candle. 
        // Notice that this is even done via a LIMIT order thanks 
        // to Jesse's ability to trade on forming-candles. 
        if (store.getState().mainReducer.currentTime === $.transformTimestamp(1547203500000)) {
            this.openPositionOrder = await this.trader.sellAt(10, 128.05);
            this.stopLossPrice = 129.52;
            this.takeProfitPrice = 126.58; 
        }
    }
}
