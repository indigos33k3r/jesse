import _ from 'lodash';
import { orderTypes } from '../exchanges/Bitfinex/types';
import EventDataInterface from '../interfaces/EventDataInterface';
import Event from '../services/Event';
import $ from '../services/Helpers';
import store, { actions } from '../store';
import { orderFlags, orderStatuses } from '../store/types';

interface NewOrderInterface {
    id: number;
    symbol: string;
    side: string;
    type: string;
    flag: string;
    quantity: number;
    price: number;
    trailingPrice?: number;
    status: string;
    updatedAt?: number; 
    createdAt?: number; 
    executedAt?: number; 
    canceledAt?: number; 
}

export default class Order {
    readonly id: number;
    readonly symbol: string;
    readonly side: string;
    readonly type: string;
    readonly flag: string;
    readonly quantity: number;
    readonly price: number;
    readonly trailingPrice: number;
    readonly status: string;
    readonly createdAt: number; 
    readonly updatedAt: number; 
    readonly executedAt: number; 
    readonly canceledAt: number; 

    constructor(newOrder: NewOrderInterface) {
        this.id = newOrder.id;
        this.symbol = newOrder.symbol;
        this.side = newOrder.side;
        this.type = newOrder.type;
        this.flag = newOrder.flag;
        this.quantity = newOrder.quantity;
        this.price = newOrder.price;
        this.status = newOrder.status;
        this.trailingPrice = (_.isUndefined(newOrder.trailingPrice) ? null : newOrder.trailingPrice);
        
        this.createdAt = newOrder.createdAt || ($.isBackTesting() ? (store.getState().mainReducer.currentTime ? store.getState().mainReducer.currentTime : $.now()) : $.now()); 
        this.updatedAt = newOrder.updatedAt || null; 
        this.executedAt = newOrder.executedAt || null; 
        this.canceledAt = newOrder.canceledAt || null; 
    }
    
    cancel() {
        if (this.isCanceled() || this.isExecuted()) return;
        
        store.dispatch(actions.cancelOrder(this.id));
    }

    execute() {
        if (this.isExecuted()) return;

        if ($.isLiveTrading()) {
            const event: EventDataInterface = {
                time: $.now(), 
                order: this
            }; 

            Event.emit('orderExecuted', event); 
        }

        store.dispatch(actions.executeOrder(this.id));
    }

    updatePrice(price: number) {
        if (this.price === price) return; 
        
        store.dispatch(actions.updateOrderPrice(this.id, price));
    }

    updateQuantity(quantity: number) {
        if (this.quantity === quantity) return; 

        store.dispatch(actions.updateOrderQuantity(this.id, quantity));
    }

    isActive(): boolean {
        return this.status === orderStatuses.ACTIVE;
    }

    isNew(): boolean {
        return this.isActive();
    }

    isCanceled(): boolean {
        return this.status === orderStatuses.CANCELED;
    }

    isExecuted(): boolean {
        return this.status.startsWith(orderStatuses.EXECUTED);
    }

    isFilled(): boolean {
        return this.isExecuted();
    }
    
    isPartiallyFilled(): boolean {
        return this.status.startsWith(orderStatuses.PARTIALLY_FILLED);
    }

    isReduceOnly(): boolean {
        return this.flag === orderFlags.REDUCE_ONLY;
    }
    
    isClose(): boolean {
        return this.flag === orderFlags.CLOSE;
    }

    isTrailingStop(): boolean {
        return this.type === orderTypes.TRAILING_STOP;
    }

    isUpdated(): boolean {
        return ! _.isNull(this.updatedAt);
    }
}