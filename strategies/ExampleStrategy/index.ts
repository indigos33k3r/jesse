import Strategy from '../../core/strategies/Strategy';
import store from '../../core/store';

/**
 * A strategy written as an example. 
 *
 * @export
 * @class ExampleStrategy
 * @extends {Strategy}
 */
export default class ExampleStrategy extends Strategy {
    time: string; 

    constructor() {
        super('An example strategy', '0.0.3', 0);
    }

    async update() {
        this.time = store.getState().mainReducer.currentTime;
    }

    /**
     * trade #1: 
     * A failing trade that gets closed with the stopLoss order. 
     *
     * @returns {boolean}
     * @memberof ExampleStrategy
     */
    shouldBuy(): boolean {
        return false; 
    }

    /**
     * trade #2 
     * A winning trade that is closed with the takeProfit order. 
     * notice that in this trade is very short-lived. In fact,
     * it's opened and closed inside the very same 5m candle. 
     * Notice that this is even done via a LIMIT order thanks 
     * to Jesse's ability to trade on forming-candles. 
     *
     * @returns {boolean}
     * @memberof ExampleStrategy
     */
    shouldSell(): boolean {
        return false;
    }

    async executeBuy(): Promise<void> {
        // 
    }

    async executeSell(): Promise<void> {
        // 
    }

    shouldCancel(): boolean {
        return false;
    }
    shouldWait(): boolean {
        return false;
    }

    // uncomment if the parent class's implementation isn't enough
    // async onStopLoss() {}

    // uncomment if the parent class's implementation isn't enough
    // async onTakeProfit() {}

    // fill only if needed. If not, leave it be (but don't remove it)
    // async onIncreasedPosition() {}

    // fill only if needed. If not, leave it be (but don't remove it)
    // async onReducedPosition() {}
}
