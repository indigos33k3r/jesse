import Order from "../models/Order";

export default interface EventDataInterface {
    time: number, 
    order: Order
}