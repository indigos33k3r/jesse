import DefaultStrategy from "./DefaultStrategy";
import { RouterInterface } from "./types";
// import { supportedSymbols } from "../core/store/types";
// import TestStrategy from "../core/test/data/TestStrategy";

const Router: RouterInterface = {
    // if the strategy per symbol is not set, this default strategy will be used
    default: new DefaultStrategy(), 
    
    // Set which strategy must be used per symbol. If not set, the above default will be used
    symbols: [
        // {
        //     symbol: supportedSymbols.ETHUSD, strategy: new TestStrategy()
        // }, 
    ]
}

export default Router; 