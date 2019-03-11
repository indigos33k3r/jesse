import Candle from '../Candle';
import { supportedTimeFrames, supportedSymbols } from '../../store/types';
import _ from 'lodash';
import $ from '../../services/Helpers';

export default function fakeCandle(
    timeFrame: string = supportedTimeFrames.oneMinute,
    symbol: string = supportedSymbols.BTCUSD
): Candle {
    const open: number = _.random(40, 100); 
    const close: number = $.randomBoolean() ? _.random(open, 110) : _.random(30, open); 
    const high: number = $.randomBoolean() ? _.max([open, close]) : _.random(_.max([open, close]), _.max([open, close]) + 10);
    const low: number = $.randomBoolean() ? _.min([open, close]) : _.random(_.min([open, close]), _.min([open, close]) - 10);
    const volume: number = _.random(1, 100);

    return new Candle({
        open,
        close,
        high,
        low,
        symbol,
        timeFrame,
        timestamp: Date.now(),
        volume
    });
}
