import _ from 'lodash';

interface NewCandleInterface {
    symbol: string; 
    timeFrame: string; 
    timestamp: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number; 
}

export default class Candle {
    id: number;
    timestamp: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number; 
    symbol: string; 
    timeFrame: string; 

    constructor(newCandle: NewCandleInterface) {
        _.forOwn(newCandle, (value, key) => this[key] = value);
    }

    isBullish(): boolean {
        return this.close >= this.open; 
    }

    isBearish(): boolean {
        return this.close < this.open; 
    }
}