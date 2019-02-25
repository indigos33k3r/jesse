import ScalpingStrategy from "./ScalpingStrategy";
import { RouterInterface } from "./types";

const Router: RouterInterface = {
    // if the strategy per symbol is not set, this default strategy will be used
    default: new ScalpingStrategy(), 
    
    // Set which strategy must be used per symbol. If not set, the above default will be used
    symbols: [
        // {
        //     symbol: supportedSymbols.ETHUSD, strategy: new ExampleStrategy()
        // }, 
    ]
}

export default Router; 