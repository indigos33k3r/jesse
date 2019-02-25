import Strategy from "../core/models/Strategy";

export interface RouterSymbolsInterface {
    symbol: string; 
    strategy: Strategy; 
}

export interface RouterInterface {
    default: Strategy; 
    symbols: RouterSymbolsInterface[];
}