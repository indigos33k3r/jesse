import Strategy from '../../core/models/Strategy';
import Candle from '../../core/models/Candle';
import store, { selectors } from '../../core/store';
import { Sides } from '../../core/store/types';
import $ from '../../core/services/Helpers';
import currentPosition from '../../core/services/Positions';

/**
 * A strategy written to be used at 'backtest.test.ts'.
 * If you're looking for an example strategy to
 * copy from, check out 'ExampleStrategy.ts'.
 *
 * @export
 * @class DefaultStrategy
 * @extends {Strategy}
 */
export default class DefaultStrategy extends Strategy {
    shortEMA: number;
    longEMA: number;
    currentCandle: Candle;
    previousCandle: Candle;
    pip: number = $.estimatePip(store.getState().config.tradingSymbol);

    positionQuantity: number;
    riskPerQty: number;
    riskPerCapitalPercentage: number = 1; 

    constructor() {
        super('EMA strategy', '0.0.1', 21);
    }

    async update() {
        this.shortEMA = this.indicators.EMA(8);
        this.longEMA = this.indicators.EMA(21);

        this.currentCandle = selectors.getCurrentTradingCandle();
        this.previousCandle = selectors.getPastTradingCandle(1);
    }

    shouldBuy(): boolean {
        if (!(this.shortEMA > this.longEMA)) {
            return false;
        }

        if (this.previousCandle.close > this.longEMA) {
            return false;
        }

        if (this.previousCandle.isBearish() && this.currentCandle.isBullish()) {
            return true;
        }

        return false;
    }

    shouldSell(): boolean {
        if (!(this.shortEMA < this.longEMA)) {
            return false;
        }

        if (this.previousCandle.close < this.longEMA) {
            return false;
        }

        if (this.previousCandle.isBullish() && this.currentCandle.isBearish()) {
            return true;
        }

        return false;
    }

    async executeBuy(): Promise<void> {
        this.buyPrice = this.currentCandle.high + 3 * this.pip;
        this.stopLossPrice = this.previousCandle.low - 3 * this.pip;
        this.riskPerQty = Math.abs(this.buyPrice - this.stopLossPrice);
        this.takeProfitPrice = this.buyPrice + (this.riskPerQty * 2);
        let positionSize: number = $.riskToSize(
            store.getState().mainReducer.currentBalance,
            this.riskPerCapitalPercentage,
            this.riskPerQty,
            this.buyPrice
        );
        this.positionQuantity = $.positionSizeToQuantity(positionSize, this.buyPrice);
        this.openPositionOrder = await this.trader.startProfitAt(Sides.BUY, this.buyPrice, this.positionQuantity);
    }

    async executeSell(): Promise<void> {
        this.sellPrice = this.currentCandle.low - 3 * this.pip;
        this.stopLossPrice = this.previousCandle.high + 3 * this.pip;
        this.riskPerQty = Math.abs(this.sellPrice - this.stopLossPrice);
        this.takeProfitPrice = this.sellPrice - (this.riskPerQty * 2);
        let positionSize: number = $.riskToSize(
            store.getState().mainReducer.currentBalance,
            this.riskPerCapitalPercentage,
            this.riskPerQty,
            this.sellPrice
        );
        this.positionQuantity = $.positionSizeToQuantity(positionSize, this.sellPrice);
        this.openPositionOrder = await this.trader.startProfitAt(Sides.SELL, this.sellPrice, this.positionQuantity);
    }

    shouldCancel(): boolean {
        if ($.isDefined(this.openPositionOrder) && this.openPositionOrder.side === Sides.BUY) {
            if (store.getState().mainReducer.currentPrice <= this.longEMA) {
                return true;
            }
        }

        if ($.isDefined(this.openPositionOrder) && this.openPositionOrder.side === Sides.SELL) {
            if (store.getState().mainReducer.currentPrice >= this.longEMA) {
                return true;
            }
        }

        return false;
    }

    shouldWait(): boolean {
        if (currentPosition.isOpen()) {
            return true;
        }

        return false;
    }
}
