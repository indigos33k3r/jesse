import { CandleSetInterface } from '../../interfaces/CandleSetInterface';
import { ActionTypes } from '../types';
import _ from 'lodash';
import Candle from '../../models/Candle';
import { ActionInterface } from '../../interfaces/ActionInterface';

const initialState: CandleSetInterface = {
    symbols: []
}

/**
 * Performs reducing candles.
 *
 * @param {CandleSetInterface} state
 * @param {ActionInterface} [action]
 * @returns {CandleSetInterface}
 */
export function candlesReducer(state: CandleSetInterface = initialState, action?: ActionInterface): CandleSetInterface {
    switch (action.type) {
        case ActionTypes.RESET_STATE:
            return {
                symbols: []
            };
        case ActionTypes.BATCH_ADD_CANDLES:
            const candles: Candle[] = action.payload;
            let clonedState: CandleSetInterface = _.cloneDeep(state);

            for (let index = 0; index < candles.length; index++) {
                clonedState = addCandle(clonedState, candles[index]);
            }

            return clonedState; 
        case ActionTypes.ADD_CANDLE:
            return addCandle(state, action.payload);
        // case ActionTypes.QUICK_ADD_CANDLE:
        //     const symbols = _.clone(state.symbols);
        //     symbols[0].timeFrames[0].candles.push(action.payload);

        //     return {
        //         symbols
        //     }; 
            // state.symbols[0].timeFrames[0].candles.push(action.payload);

            // return {
            //     symbols: state.symbols
            // }; 

        default:
            return state;
    }

    function addCandle(state, candle: Candle): CandleSetInterface {
        const symbols = _.clone(state.symbols);
        const symbol = symbols.find(item => item.symbol === candle.symbol);
        if (symbol !== undefined) {
            const timeFrame = symbol.timeFrames.find(item => item.timeFrame === candle.timeFrame);
            if (timeFrame !== undefined) {
                const candleIndex = timeFrame.candles.findIndex(item => item.timestamp === candle.timestamp);
                if (timeFrame.candles[candleIndex] !== undefined) {
                    timeFrame.candles[candleIndex] = candle;
                } else {
                    timeFrame.candles.push(candle);
                }
            } else {
                symbol.timeFrames.push({
                    timeFrame: candle.timeFrame,
                    candles: [candle]
                });
            }
        } else {
            symbols.push({
                symbol: candle.symbol,
                timeFrames: [
                    {
                        timeFrame: candle.timeFrame,
                        candles: [candle]
                    }
                ]
            });
        }
        
        return {
            symbols
        };
    }
}
