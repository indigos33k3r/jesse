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
    timestamp: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number; 
    symbol: string; 
    timeFrame: string; 

    constructor(newCandle: NewCandleInterface) {
        this.timeFrame = newCandle.timeFrame;
        this.symbol = newCandle.symbol;
        this.timestamp = newCandle.timestamp;
        this.open = newCandle.open;
        this.close = newCandle.close;
        this.high = newCandle.high;
        this.low = newCandle.low;
        this.volume = newCandle.volume;
    }

    isBullish(): boolean {
        return this.close >= this.open; 
    }
    isBearish(): boolean {
        return this.close < this.open; 
    }

    // isDogi(): boolean {
        // TODO 
    // }
    // ...other candle types TODO
}