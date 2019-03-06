import $ from '../services/Helpers';
import { Sides, TradeTypes } from '../store/types';

it('Should estimate profit for a long trade', () => {
    expect($.estimateProfit(2, 50, 60, 'long')).toBe(20);
});
it('Should estimate profit for a short trade', () => {
    expect($.estimateProfit(2, 60, 50, 'short')).toBe(20);
});
it('Should estimate loss for a long trade', () => {
    expect($.estimateProfit(2, 50, 60, 'short')).toBe(-20);
});
it('Should estimate loss for a short trade', () => {
    expect($.estimateProfit(2, 60, 50, 'long')).toBe(-20);
});

it('Should estimate pnl', () => {
    // profit 
    expect($.estimatePNL(1, 200, 220, 'long')).toEqual(10);
    expect($.estimatePNL(1, 200, 180, 'long')).toEqual(-10);
    
    // loss 
    expect($.estimatePNL(1, 200, 220, 'short')).toEqual(-10);
    expect($.estimatePNL(1, 200, 180, 'short')).toEqual(10);
});

it('Should estimate entry price', () => {
    expect($.estimateAveragePrice(100, 7200, 1000, 7100)).toBe(7109.090909090909);
});
it('Should estimate entry price at the beginning', () => {
    expect($.estimateAveragePrice(100, 7200, 0, 0)).toBe(7200);
});

it('Should convert side to positionType', () => {
    expect($.sideToType(Sides.BUY)).toBe(TradeTypes.LONG);
    expect($.sideToType(Sides.SELL)).toBe(TradeTypes.SHORT);
});

it('Should convert positionType to side', () => {
    expect($.typeToSide(TradeTypes.LONG)).toBe(Sides.BUY);
    expect($.typeToSide(TradeTypes.SHORT)).toBe(Sides.SELL);
});

it('Should should return position size based on risk', () => {
    expect(
        Math.round(
            $.riskToSize(10000, 1, 0.70, 8.60)
        )
    ).toEqual(1229);
});