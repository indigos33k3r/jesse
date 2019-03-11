import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import _ from 'lodash';
import NewCandleInterface from './types';

@Entity()
@Index(['symbol', 'exchange', 'timeFrame', 'timestamp'], { unique: true })
export default class Candle extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    timestamp: number;

    @Column()
    open: number;

    @Column()
    close: number;

    @Column()
    high: number;

    @Column()
    low: number;

    @Column()
    volume: number;

    @Column()
    symbol: string;

    @Column()
    timeFrame: string;

    @Column()
    exchange: string;

    /**
     * Creates an instance of Candle.
     *
     * @param {NewCandleInterface} newCandle
     * @memberof Candle
     */
    constructor(newCandle: NewCandleInterface) {
        super(); 
        
        _.forOwn(newCandle, (value, key) => (this[key] = value));
    }

    /**
     * is a bullish candle?
     *
     * @returns {boolean}
     * @memberof Candle
     */
    isBullish(): boolean {
        return this.close >= this.open;
    }

    /**
     * is a bearish candle?
     *
     * @returns {boolean}
     * @memberof Candle
     */
    isBearish(): boolean {
        return this.close < this.open;
    }
}
