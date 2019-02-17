import Order from './Order';
import $ from '../services/Helpers';
import moment from 'moment-timezone';
import _ from 'lodash';

/**
 * A trade is made when a position is opened AND closed.
 *
 * @export
 * @class Trade
 */
export default class Trade {
    id: number; 
    strategy: string;
    strategyVersion: string; 
    symbol: string;
    type: string;
    entryPrice: number; 
    exitPrice: number; 
    takeProfitPrice: number; 
    stopLossPrice: number; 
    quantity: number; 
    fee: number; 
    orders: Order[];
    openedAt: string;
    closedAt: string; 

    /**
     * Creates an instance of Trade.
     * 
     * @param {object} [parameters={}]
     * @memberof Trade
     */
    constructor(parameters: object = {}) {
        _.forOwn(parameters, (value, key) => this[key] = value);
    }

    /**
     * The targeted profit that was this trade made for. 
     *
     * @returns {number}
     * @memberof Trade
     */
    reward(): number {
        return Math.abs(this.takeProfitPrice - this.entryPrice) * this.quantity; 
    }

    /**
     * The amount of capital risking on this trade. 
     *
     * @returns {number}
     * @memberof Trade
     */
    risk(): number {
        return Math.abs(this.stopLossPrice - this.entryPrice) * this.quantity; 
    }

    /**
     * "R".
     *
     * @returns {number}
     * @memberof Trade
     */
    riskRewardRatio(): number {
        return this.reward() / this.risk();
    }

    /**
     * Alias of riskRewardRation()
     *
     * @returns {number}
     * @memberof Trade
     */
    R(): number {
        return this.riskRewardRatio(); 
    }

    /**
     * The size of the trade.
     *
     * @returns {number}
     * @memberof Trade
     */
    size(): number {
        return this.quantity * this.entryPrice;
    }

    /**
     * "PNL".
     *
     * @returns {number}
     * @memberof Trade
     */
    pnl(): number {
        return $.estimateProfit(this.quantity, this.entryPrice, this.exitPrice, this.type);
    }

    /**
     * The PNL%.
     *
     * @returns {number}
     * @memberof Trade
     */
    percentagePNL(): number {
        return (this.pnl() / this.size()) * 100;
    }

    /**
     * How many SECONDS has it taken for the trade to be done.
     *
     * @returns {number}
     * @memberof Trade
     */
    holdingPeriod(): number {
        return (moment(this.closedAt).valueOf() - moment(this.openedAt).valueOf()) / 1000;
    }
}
