import Strategy from "../core/strategies/Strategy";

export interface RouterSymbolsInterface {
    symbol: string; 
    strategy: Strategy; 
}

export interface RouterInterface {
    default: Strategy; 
    symbols: RouterSymbolsInterface[];
}