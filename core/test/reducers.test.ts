import store, { actions } from "../store";
import { mainReducer, initialState } from "../store/reducers/mainReducer";
import { ActionTypes } from "../store/types";
import Candle from "../models/Candle";
import fakeCandle from "../models/factories/CandleFactory";
import { candlesReducer } from "../store/reducers/candlesReducer";


beforeEach(() => {
    store.dispatch(actions.resetState());
});

it('should handle SET_STARTING_BALANCE', () => {
    expect(
        mainReducer(initialState, {
            type: ActionTypes.SET_STARTING_BALANCE,
            payload: 123
        })
    ).toEqual({
        ...initialState,
        startingBalance: 123
    });
});

it('Should handle INCREASE_CURRENT_BALANCE', () => {
    const currentBalance: number = initialState.currentBalance;

    expect(
        mainReducer(initialState, {
            type: ActionTypes.INCREASE_CURRENT_BALANCE,
            payload: 10
        })
    ).toEqual({
        ...initialState,
        currentBalance: currentBalance + 10
    });
});

it('Should handle REDUCE_CURRENT_BALANCE', () => {
    const currentBalance: number = initialState.currentBalance;

    expect(
        mainReducer(initialState, {
            type: ActionTypes.REDUCE_CURRENT_BALANCE,
            payload: 10
        })
    ).toEqual({
        ...initialState,
        currentBalance: currentBalance - 10
    });
});

it('should handle ADD_CANDLE action.', () => {
    const candle: Candle = fakeCandle();

    expect(
        candlesReducer(
            { symbols: [] },
            {
                type: ActionTypes.ADD_CANDLE,
                payload: candle
            }
        )
    ).toEqual({
        symbols: [
            {
                symbol: 'BTCUSD',
                timeFrames: [
                    {
                        timeFrame: '1m',
                        candles: [candle]
                    }
                ]
            }
        ]
    });
});
