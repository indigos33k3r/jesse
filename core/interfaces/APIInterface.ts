import Order from "../models/Order";

export default interface APIInterface {
    initiallyOpened: boolean; 

    /**
     * Submits a EXCHANGE order to the market. 
     * 
     * @param symbol string 
     * @param quantity number 
     * @param side string 
     * @param flags string[]
     */
    marketOrder(symbol: string, quantity: number, side: string, flags: string[]): Promise<Order>;

    /**
     * Submits a LIMIT order to the market. 
     * 
     * @param symbol string 
     * @param quantity number 
     * @param price number 
     * @param side string 
     * @param flags string[]
     */
    limitOrder(symbol: string, quantity: number, price: number, side: string, flags: string[]): Promise<Order>;

    /**
     * Submits a TRAILING STOP order to the market. 
     * 
     * @param symbol string 
     * @param quantity number 
     * @param price number 
     * @param trailingPrice number 
     * @param side string 
     * @param flags string[]
     */
    trailingStopOrder(symbol: string, quantity: number, trailingPrice: number, side: string, flags: string[]): Promise<Order>;

    /**
     * Submits a STOP order to the market. 
     * 
     * @param symbol string 
     * @param quantity number 
     * @param price number 
     * @param side string 
     * @param flags string[]
     */
    stopOrder(symbol: string, quantity: number, price: number, side: string, flags: string[]): Promise<Order>;

    /**
     * Cancels all the active orders. 
     */
    cancelAllOrders();

    /**
     * Cancels a single order. 
     * 
     * @param orderID 
     */
    cancelOrder(orderID: number); 
}