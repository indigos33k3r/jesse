import Strategy from '../../strategies/Strategy';

/**
 * A custom strategy
 *
 * @export
 * @class ExampleStrategy
 * @extends {Strategy}
 */
export default class ExampleStrategy extends Strategy {
    constructor() {
        super(`${ExampleStrategy.name}`, '0.0.1', 0);
    }

    async update() {
        // 
    }
    
    shouldBuy(): boolean {
        return false; 
    }

    shouldSell(): boolean {
        return false;
    }

    async executeBuy(): Promise<void> {
        // 
    }

    async executeSell(): Promise<void> {
        // 
    }

    shouldCancel(): boolean {
        return false;
    }

    shouldWait(): boolean {
        return false;
    }
}
