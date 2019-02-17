export default class ConflictingOrders extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConflictingOrders';
    }
}