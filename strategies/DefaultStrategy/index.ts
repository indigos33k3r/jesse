import Strategy from '../../core/models/Strategy';
import Candle from '../../core/models/Candle';
import store, { selectors } from '../../core/store';
import { Sides } from '../../core/store/types';
import $ from '../../core/services/Helpers';
import currentPosition from '../../core/services/Positions';
import Logger from '../../core/services/Logger';
import HyperParametersInterface from './types';

const defaultHyperParameters: HyperParametersInterface = {
    minimumPnlPerTradeFilter: 0.8
};

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
    hyperParameters: HyperParametersInterface;
    shortEMA: number;
    longEMA: number;
    currentCandle: Candle;
    previousCandle: Candle;
    pip: number = $.estimatePip(store.getState().config.tradingSymbol);

    positionQuantity: number;
    riskPerQty: number;
    rewardPerQty: number; 
    riskPerCapitalPercentage: number = 1; 

    constructor(hyperParameters: HyperParametersInterface = defaultHyperParameters) {
        super('EMA strategy', '0.0.1', 21);

        this.hyperParameters = defaultHyperParameters; 
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
        this.rewardPerQty = (this.riskPerQty * 2)
        this.takeProfitPrice = this.buyPrice + this.rewardPerQty;

        // filter trades that don't worth it
        if ((this.rewardPerQty / this.buyPrice) * 100 < this.hyperParameters.minimumPnlPerTradeFilter) {
            Logger.warning(`Not worth it. Pass!`);
            return;
        }

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
        this.rewardPerQty = (this.riskPerQty * 2)
        this.takeProfitPrice = this.sellPrice - this.rewardPerQty;

        // filter trades that don't worth it
        if ((this.rewardPerQty / this.sellPrice) * 100 < this.hyperParameters.minimumPnlPerTradeFilter) {
            Logger.warning(`Not worth it. Pass!`);
            return;
        }

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
