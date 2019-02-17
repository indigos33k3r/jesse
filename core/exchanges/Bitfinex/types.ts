export const enum orderTypes {
    EXCHANGE = 'EXCHANGE',
    LIMIT = 'LIMIT',
    STOP = 'STOP',
    TRAILING_STOP = 'TRAILING STOP',
    FOK = 'FOK',
    STOP_LIMIT = 'STOP LIMIT'
}

export interface BitfinexOrder {
    gid?: number;
    cid?: number;
    type: string;
    symbol: string;
    amount: number;
    price?: number;
    price_trailing?: number;
    price_aux_limit?: number;
    price_oco_stop?: number;
    flags?: string[];
    tif?: string;
}

export interface BitfinexPosition {
    symbol: string;
    status: string;
    amount: number;
    basePrice: number;
    marginFunding: number;
    marginFundingType: number;
    pl: number;
    plPercentage: number;
    priceLiq: number;
    leverage?: number;
}

export interface BitfinexError {
    event: string;
    msg: string;
    code: number;
}

export interface CandlesChannel {
    name: string;
    id: number;
    key: string;
    symbol: string;
    timeFrame: string;
}