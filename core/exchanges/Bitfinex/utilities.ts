import { BitfinexPosition } from "./types";
import _ from 'lodash';

export function getOrderFlags(flags: string[]): number {
    const ReduceOnly: number = _.includes(flags, 'ReduceOnly') ? 2 ** 10 : 0;
    const Close: number = _.includes(flags, 'Close') ? 2 ** 9 : 0;
    const OCO: number = _.includes(flags, 'OCO') ? 2 ** 14 : 0;
    const Hidden: number = _.includes(flags, 'Hidden') ? 2 ** 6 : 0;
    const PostOnly: number = _.includes(flags, 'PostOnly') ? 2 ** 12 : 0;

    return ReduceOnly + Close + OCO + Hidden + PostOnly;
}

export function getError(code: number): string {
    switch (code) {
        case 11000:
            return 'Not ready, try again later';
        case 10200:
            return 'Error in un-authentication request';
        case 10114:
            return 'Error in authentication request nonce';
        case 10112:
            return 'Error in authentication request signature';
        case 10113:
            return 'Error in authentication request encryption';
        case 10111:
            return 'Error in authentication request payload';
        case 10100:
            return 'Failed authentication';
        case 10050:
            return 'Configuration setup failed';
        case 10020:
            return 'Request parameters error';
        case 10000:
            return 'Unknown event';
        case 10001:
            return 'Unknown pair';
        case 10305:
            return 'Reached limit of open channels';
        case 10300:
            return 'Subscription failed (generic)';
        case 10301:
            return 'Already subscribed';
        case 10302:
            return 'Unknown channel';
        case 10400:
            return 'Subscription failed (generic) channel not found';
        case 10401:
            return 'Not subscribed';
        case 20051:
            return 'Stop/Restart Websocket Server (please reconnect)';
        case 20060:
            return 'Entering in Maintenance mode. Please pause any activity and resume after receiving the info message 20061 (it should take 120 seconds at most).';
        case 20061:
            return 'Maintenance ended. You can resume normal activity. It is advised to unsubscribe/subscribe again all channels.';
        case 5000:
            return 'Info message';

        default:
            return 'unknown error';
    }
}

export function transformPositionData(data: any[]): BitfinexPosition {
    return {
        symbol: data[0][0] === 't' ? data[0].slice(1) : data[0],
        status: data[1],
        amount: data[2],
        basePrice: data[3],
        marginFunding: data[4],
        marginFundingType: data[5],
        pl: data[6],
        plPercentage: data[7],
        priceLiq: data[8],
        leverage: data[9]
    };
}