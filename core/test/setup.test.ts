import config from "../../config";

it('Should be doing setup stuff before the unit test in executed', () => {
    expect(config.app.isTesting).toBeTruthy();
    expect(config.app.tradingMode).toBe('backtest');
});