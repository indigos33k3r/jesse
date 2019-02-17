import Order from "../models/Order";

export default interface EventDataInterface {
    time: string, 
    order: Order
}