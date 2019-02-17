import _ from 'lodash';
import config from '../../config';
import $ from '../../core/services/Helpers';
import HyperParametersInterface from './types';
import Candle from '../../core/models/Candle';
import Strategy from '../../core/models/Strategy';
import currentPosition from '../../core/services/Positions';
import store, { actions, selectors } from '../../core/store';
import { Sides, TradeTypes } from '../../core/store/types';
import Indicators from 'jesse-indicators';

// Initial hyperParameters:
const defaultHyperParameters: HyperParametersInterface = {
    numberOfPreviousCandlesToLookBackForLongs: 3,
    numberOfPreviousCandlesToLookBackForShorts: 3,
    takeProfitRate: 5,
    minimumPnlPerTradeFilter: 0.5
};

export default class ScalpingStrategy extends Strategy {
    hyperParameters: HyperParametersInterface;
    positionSize: number = config.positionSize;
    pip: number = $.estimatePip(store.getState().mainReducer.symbol);
    EMA8: number;
    EMA21: number;

    lookToShort: boolean = false;
    lookToLong: boolean = false;
    currentCandle: Candle;
    initialTargetedMargin: number;
    triggerCandle: Candle;

    constructor(hyperParameters: HyperParametersInterface = defaultHyperParameters) {
        super('Scalping via EMA', '0.0.1', 22);

        this.hyperParameters = hyperParameters;
    }

    async update() {
        this.positionSize = config.tradeWithWholeBalance
            ? store.getState().mainReducer.currentBalance
            : config.positionSize;

        this.EMA8 = Indicators.EMA($.pluckCandles(selectors.getTradingCandles(), 'close'), 8);
        this.EMA21 = Indicators.EMA($.pluckCandles(selectors.getTradingCandles(), 'close'), 21);

        this.currentCandle = selectors.getCurrentTradingCandle();
    }

    async check() {
        if (this.shouldCancel()) {
            await this.reset();
        }

        if (this.shouldWait()) {
            return;
        }

        if (this.shouldBuy()) {
            store.dispatch(actions.logWarning(`Trigger candle was found. Looking for confirmation...`));

            this.triggerCandle = this.currentCandle;

            let highestPrice: number = selectors.getPastTradingCandle(1).high;
            for (let i = 0; i < this.hyperParameters.numberOfPreviousCandlesToLookBackForLongs; i++) {
                highestPrice = Math.max(highestPrice, selectors.getPastTradingCandle(i + 2).high);
            }

            // don't open a position if the trigger candle itself is acting crazy
            if (this.triggerCandle.close > highestPrice) {
                store.dispatch(actions.logWarning(`I think you should include current candle`));
                return;
            }

            this.buyPrice = highestPrice + 3 * this.pip;
            this.stopLossPrice = this.triggerCandle.low - 3 * this.pip;
            this.stopLossPrice = this.limitStopLoss(this.buyPrice, this.stopLossPrice, TradeTypes.LONG);
            this.initialTargetedMargin = Math.abs(this.stopLossPrice - this.buyPrice);
            this.reducePositionPrice = this.buyPrice + this.initialTargetedMargin;
            this.takeProfitPrice = this.buyPrice + this.initialTargetedMargin * 2;

            // filter trades that don't worth it
            if (
                (this.initialTargetedMargin / this.buyPrice) * 100 <
                this.hyperParameters.minimumPnlPerTradeFilter
            ) {
                store.dispatch(actions.logWarning(`Sounds like a crappy trade. Pass!`));
                return;
            }

            if (selectors.countOfActiveOrders() !== 0) await this.reset();
            this.openPositionOrder = await this.trader.startProfitAt(
                Sides.BUY,
                this.buyPrice,
                $.positionSizeToQuantity(this.positionSize, this.buyPrice)
            );

            // exit point 1
            this.reducePositionOrder = await this.trader.reducePositionAt(
                Sides.SELL,
                this.reducePositionPrice,
                (this.openPositionOrder.quantity * this.hyperParameters.takeProfitRate) / 10
            );
            // exit point 2
            this.takeProfitOrder = await this.trader.reducePositionAt(
                Sides.SELL,
                this.takeProfitPrice,
                Math.abs(this.openPositionOrder.quantity) -
                    (Math.abs(this.openPositionOrder.quantity) * this.hyperParameters.takeProfitRate) / 10
            );

            this.lookToLong = true;
        }

        if (this.shouldSell()) {
            if ($.isDebugging()) {
                store.dispatch(actions.logWarning(`Trigger candle was found. Submitting confirmation orders...`));
            }

            this.triggerCandle = this.currentCandle;

            let lowestPrice: number = selectors.getPastTradingCandle(1).low;
            for (let i = 0; i < this.hyperParameters.numberOfPreviousCandlesToLookBackForShorts; i++) {
                lowestPrice = Math.min(lowestPrice, selectors.getPastTradingCandle(i + 2).low);
            }

            // for now, don't open a position if the trigger candle itself is acting crazy
            if (this.triggerCandle.close < lowestPrice) return;

            this.sellPrice = lowestPrice - 3 * this.pip;
            this.stopLossPrice = this.triggerCandle.high + 3 * this.pip;
            this.stopLossPrice = this.limitStopLoss(this.sellPrice, this.stopLossPrice, TradeTypes.SHORT);
            this.initialTargetedMargin = Math.abs(this.stopLossPrice - this.sellPrice);
            this.reducePositionPrice = this.sellPrice - this.initialTargetedMargin;
            this.takeProfitPrice = this.sellPrice - this.initialTargetedMargin * 2;

            // filter trades that don't worth it
            if ((this.initialTargetedMargin / this.sellPrice) * 100 < this.hyperParameters.minimumPnlPerTradeFilter) {
                store.dispatch(actions.logWarning(`Sounds like a crappy trade, Pass!`));
                return;
            }

            this.openPositionOrder = await this.trader.startProfitAt(
                Sides.SELL,
                this.sellPrice,
                $.positionSizeToQuantity(this.positionSize, this.sellPrice)
            );

            // exit point 1
            this.reducePositionOrder = await this.trader.reducePositionAt(
                Sides.BUY,
                this.reducePositionPrice,
                (Math.abs(this.openPositionOrder.quantity) * this.hyperParameters.takeProfitRate) / 10
            );
            // exit point 2
            this.takeProfitOrder = await this.trader.reducePositionAt(
                Sides.BUY,
                this.takeProfitPrice,
                Math.abs(this.openPositionOrder.quantity) -
                    (Math.abs(this.openPositionOrder.quantity) * this.hyperParameters.takeProfitRate) / 10
            );

            this.lookToShort = true;
        }
    }

    shouldCancel(): boolean {
        // when trend is no longer in our favour
        if (this.lookToLong && this.emaTrend() !== 'bull') return true;
        if (this.lookToShort && this.emaTrend() !== 'bear') return true;

        // when the trigger candle is no longer valid if price touched the EMA21
        if (this.lookToLong && this.emaTrend() === 'bull' && this.currentCandle.low < this.EMA21) return true;
        if (this.lookToShort && this.emaTrend() === 'bear' && this.currentCandle.high > this.EMA21) return true;

        return false;
    }

    shouldBuy(): boolean {
        if (this.emaTrend() !== 'bull' || _.isUndefined(this.openPositionOrder)) return false;

        if (
            _.round(this.currentCandle.low) <= _.round(this.EMA8) &&
            _.round(this.currentCandle.low) > _.round(this.EMA21)
        )
            return true;

        return false;
    }

    shouldSell(): boolean {
        if (this.emaTrend() !== 'bear' || $.isDefined(this.openPositionOrder)) return false;

        if (
            _.round(this.currentCandle.high) >= _.round(this.EMA8) &&
            _.round(this.currentCandle.high) < _.round(this.EMA21)
        )
            return true;

        return false;
    }

    shouldWait(): boolean {
        // Don't continue(look for the trigger candle) if we already have an open position.
        if (currentPosition.isOpen()) return;

        // return if the previous candle is still valid:
        if ((this.lookToLong && this.currentCandle.low > this.EMA21) || (this.lookToShort && this.currentCandle.high < this.EMA21)) return;

        return false;
    }

    // shouldTakeLoss(): boolean {
    //     return false;
    // }
    // shouldTakeProfit(): boolean {
    //     return false;
    // }
    // shouldIncreasePosition(): boolean {
    //     return false;
    // }
    // shouldReducePosition(): boolean {
    //     return false;
    // }

    /**
     * Limits the risk.
     *
     * @param entryPrice number
     * @param stopPrice number
     * @param type string
     */
    limitStopLoss(entryPrice: number, stopPrice: number, type: string) {
        let risk: number = $.estimateRisk(entryPrice, stopPrice);
        let maxAllowedRisk: number = this.positionSize * 0.06;

        if (risk > maxAllowedRisk) {
            risk = maxAllowedRisk;
        }

        return type === 'long' ? entryPrice - risk : entryPrice + risk;
    }

    async onOpenPosition() {
        store.dispatch(actions.logWarning(`Detected open position. Setting stops now:`));

        if (currentPosition.type() === TradeTypes.LONG) {
            this.stopLossOrder = await this.trader.stopLossAt(
                Sides.SELL,
                this.stopLossPrice,
                this.openPositionOrder.quantity
            );

            this.takeProfitOrder = await this.trader.sellAt(this.openPositionOrder.quantity, this.takeProfitPrice);
        } else {
            this.stopLossOrder = await this.trader.stopLossAt(
                Sides.BUY,
                this.stopLossPrice,
                this.openPositionOrder.quantity
            );

            this.takeProfitOrder = await this.trader.buyAt(this.openPositionOrder.quantity, this.takeProfitPrice);
        }

        this.openPositionOrder = undefined;
        this.lookToLong = false;
        this.lookToShort = false;
    }

    async onStopLoss() {
        if ($.isDebugging())
            store.dispatch(
                actions.logWarning(`StopLoss has been executed. Cancel orders and keep looking for trigger candle.`)
            );
        await this.reset();
    }

    async onReducedPosition() {
        if ($.isDebugging()) {
            store.dispatch(actions.logWarning(`Half the position has been exited. Now let's go for the second exit.`));
        }

        this.stopLossPrice = store.getState().mainReducer.entryPrice;

        await this.trader.cancelOrder(this.stopLossOrder.id);
        this.stopLossOrder = await this.trader.stopLossAt(
            currentPosition.type() === 'long' ? Sides.SELL : Sides.BUY,
            this.stopLossPrice,
            Math.abs(store.getState().mainReducer.quantity)
        );
        this.reducePositionOrder = undefined;
    }

    emaTrend(): string {
        if (this.EMA8 > this.EMA21) {
            return 'bull';
        } else if (this.EMA8 < this.EMA21) {
            return 'bear';
        } else {
            return 'side';
        }
    }
}
