import config from "../../config";

it('Should be doing setup stuff before the unit test in executed', () => {
    expect(config.isTesting).toBeTruthy();
    expect(config.tradingMode).toBe('backtest');
});