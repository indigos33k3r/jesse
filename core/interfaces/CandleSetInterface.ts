import Candle from '../models/Candle';

export interface CandleSetTimeFrame {
    readonly timeFrame: string; 
    readonly candles: Candle[]; 
}

export interface CandleSetSymbol {
    readonly symbol: string;
    readonly timeFrames: CandleSetTimeFrame[];
}

export interface CandleSetInterface {
    readonly symbols: CandleSetSymbol[];
}