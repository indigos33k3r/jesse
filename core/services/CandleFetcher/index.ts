// import axios from 'axios';
// import jsonfile from 'jsonfile';
// import _ from 'lodash';
// import Candle from '../../models/Candle';
// import $ from '../Helpers';
// import sleep from 'sleep';
// import moment from 'moment-timezone';
// import chalk from 'chalk';
// moment.tz.setDefault('UTC');

// export default class CandleGetter {
//     symbols: string[] = ['BTCUSD', 'ETHUSD', 'EOSUSD'];
//     candleSizesToGet: string[] = ['5m', '15m', '30m', '1h', '3h'];
//     daysCount: number = 2 * 30;
//     fromDaysAgo: number = 2 * 30 + 2;

//     runDay = moment().startOf('day');

//     startTime() {
//         return this.runDay.clone().subtract(this.fromDaysAgo, 'days');
//     }

//     candleCount(candleSize: string): number {
//         switch (candleSize) {
//             case '1d':
//                 return 1;

//             case '4h':
//                 return 6;

//             case '3h':
//                 return 8;

//             case '1h':
//                 return 1440 / 60;

//             case '30m':
//                 return 1440 / 30;

//             case '15m':
//                 return 1440 / 15;

//             case '5m':
//                 return 1440 / 5;

//             case '3m':
//                 return 1440 / 3;

//             case '1m':
//                 return 720;

//             default:
//                 throw new Error(`invalid candle size`);
//         }
//     }

//     getData(symbol: string, candleSize: string, startTime): Promise<Candle[]> {
//         let count: number = this.candleCount(candleSize);

//         return new Promise((resolve, reject) => {
//             axios
//                 .get(`https://api.bitfinex.com/v2/candles/trade:${candleSize}:t${symbol}/hist`, {
//                     params: {
//                         start: startTime.valueOf(),
//                         limit: count,
//                         sort: 1
//                     }
//                 })
//                 .then(response => {
//                     let data = response.data;
//                     let candles: Candle[] = [];

//                     for (let index = 0; index < data.length; index++) {
//                         candles.push(
//                             new Candle({
//                                 symbol,
//                                 timeFrame: candleSize,
//                                 timestamp: data[index][0],
//                                 open: data[index][1],
//                                 close: data[index][2],
//                                 high: data[index][3],
//                                 low: data[index][4],
//                                 volume: data[index][5]
//                             })
//                         );
//                     }

//                     resolve(candles);
//                 })
//                 .catch(error => {
//                     console.log(error);
//                     reject();
//                 });
//         });
//     }

//     saveCandles(symbol: string, candleSize: string, candles: Candle[]) {
//         const period: string =
//             candles[0].timestamp.split('T')[0] + '.' + candles[candles.length - 1].timestamp.split('T')[0];
//         const directory: string = `./storage/history/BitFinex/${symbol}/${period}`;

//         $.createDirectoryIfNotExists(directory);

//         let fileName: string = directory + `/${candleSize}.json`;
//         jsonfile.writeFile(fileName, candles, error => {
//             if (error !== null) {
//                 console.error(error);
//             }
//         });

//         console.log(chalk.green(fileName));
//     }

//     async getOneMinuteCandles(symbol: string, startingDay) {
//         let candles: Candle[] = [];
//         for (let i = 0; i < this.daysCount * 2; i++) {
//             sleep.sleep(6);
//             const data = await this.getData(symbol, '1m', startingDay.valueOf());
//             candles.push(...data);
//             console.log(`${_.round((candles.length / (this.daysCount * 1440)) * 100, 1)}%`);
//             startingDay.add(12, 'hours');
//         }
//         return candles;
//     }

//     /**
//      * Generates timeFrames from 1m candles. 
//      *
//      * @param {string} symbol
//      * @param {Candle[]} oneMinuteCandles
//      * @param {string} candleSize
//      * @memberof CandleGetter
//      */
//     generateCandlesBySize(symbol: string, oneMinuteCandles: Candle[], candleSize: string): void {
//         const candles = [];

//         let count: number = this.candleCount(candleSize);
//         const windowSize = 1440 / count;
//         const parts = _.chunk(oneMinuteCandles, windowSize);

//         for (let i = 0; i < parts.length; i++) {
//             const windowCandles = parts[i];
//             candles.push({
//                 timestamp: windowCandles[0].timestamp,
//                 open: windowCandles[0].open,
//                 close: windowCandles[windowSize - 1].close,
//                 high: _.maxBy(windowCandles, 'high').high,
//                 low: _.minBy(windowCandles, 'low').low,
//                 volume: _.sumBy(windowCandles, 'volume')
//             });
//         }

//         this.saveCandles(symbol, candleSize, candles);
//     }

//     /**
//      * The main class baby! 
//      *
//      * @memberof CandleGetter
//      */
//     async main() {
//         for (let i = 0; i < this.symbols.length; i++) {
//             const symbol = this.symbols[i];
//             const startingDay = this.startTime();
//             const tempCandles = await this.getOneMinuteCandles(symbol, startingDay);
//             const candlesObject = _.groupBy(tempCandles, 'timestamp');
//             const oneMinuteCandles = [];
//             const minute = this.startTime();
//             const firstCandle = _.minBy(tempCandles, 'timestamp');
//             let started = false;
//             for (let j = 0; j < tempCandles.length; j++) {
//                 const timestampCandles = candlesObject[minute.format()];
//                 if (timestampCandles === undefined) {
//                     if (started) {
//                         const lastClose = oneMinuteCandles[oneMinuteCandles.length - 1].close;
//                         oneMinuteCandles.push({
//                             timestamp: minute.format(),
//                             open: lastClose,
//                             high: lastClose,
//                             low: lastClose,
//                             close: lastClose,
//                             volume: 0
//                         });
//                     } else {
//                         oneMinuteCandles.push({
//                             timestamp: minute.format(),
//                             open: firstCandle.open,
//                             high: firstCandle.open,
//                             low: firstCandle.open,
//                             close: firstCandle.open,
//                             volume: 0
//                         });
//                     }
//                 } else {
//                     started = true;
//                     oneMinuteCandles.push(timestampCandles[0]);
//                 }
//                 minute.add(1, 'minutes');
//             }
//             this.saveCandles(symbol, '1m', oneMinuteCandles);
//             for (let index = 0; index < this.candleSizesToGet.length; index++) {
//                 this.generateCandlesBySize(symbol, oneMinuteCandles, this.candleSizesToGet[index]);
//             }
//         }
//     }
// }

// const candleGetter: CandleGetter = new CandleGetter();
// candleGetter.main();
