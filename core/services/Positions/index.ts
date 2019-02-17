import $ from '../Helpers';
import _ from 'lodash';
import EmptyPosition from '../../exceptions/EmptyPosition';
import Notifier from '../Notifier';
import store, { actions } from '../../store';
import { TradeTypes } from '../../store/types';
import config from '../../../config';

const currentPosition = {
    symbol(): string {
        return store.getState().mainReducer.symbol;
    },

    /**
     * The value of the position in USD.
     *
     * @param currentPrice number
     */
    value(currentPrice: number = store.getState().mainReducer.currentPrice): number {
        return store.getState().mainReducer.quantity * currentPrice;
    },

    /**
     * Returns the realized PNL in percentage.
     *
     * @param exitPrice number
     */
    pnl(exitPrice: number = store.getState().mainReducer.currentPrice): number {
        if (store.getState().mainReducer.quantity === 0) return 0;

        return $.estimatePNL(
            store.getState().mainReducer.quantity,
            store.getState().mainReducer.entryPrice,
            exitPrice,
            this.type()
        );
    },

    /**
     * What is the type of current position. If positive, you are long, if
     * negative, you are short.
     */
    type(): string {
        if (store.getState().mainReducer.quantity === 0) {
            return 'close';
        }

        return store.getState().mainReducer.quantity > 0 ? TradeTypes.LONG : TradeTypes.SHORT;
    },

    /**
     * Is the position open?
     *
     * @returns boolean
     */
    isOpen(): boolean {
        return store.getState().mainReducer.quantity !== 0;
    },

    /**
     * Updates the store values.
     *
     * @param price number
     * @param quantity number
     */
    update(quantity: number, price: number = store.getState().mainReducer.currentPrice): void {
        // We don't need to manually update the store in
        // liveTrade mode. Instead, we fetch it form
        // the exchange market itself via WS.
        if ($.isLiveTrading()) return;

        let size: number = $.quantityToPositionSize(quantity, price);

        if (store.getState().mainReducer.quantity * quantity < 0) {
            if (Math.abs(quantity) === Math.abs(store.getState().mainReducer.quantity)) {
                this.close(price);
                return;
            } else {
                let differenceQuantity: number = Math.abs(store.getState().mainReducer.quantity) - Math.abs(quantity);
                if (differenceQuantity > 0) {
                    this.reduce(quantity, price);
                    return;
                } else {
                    this.close(price);
                    this.update(differenceQuantity, price);
                    return;
                }
            }
        } else if (!this.isOpen() || store.getState().mainReducer.quantity * quantity > 0) {
            store.dispatch(actions.reduceCurrentBalance(size))
        }

        store.dispatch(
            actions.updateEntryPrice(
                $.estimateAveragePrice(
                    quantity,
                    price,
                    store.getState().mainReducer.quantity,
                    store.getState().mainReducer.entryPrice
                )
            )
        );

        store.dispatch(actions.updateQuantity(store.getState().mainReducer.quantity + quantity));
    },

    /**
     * Close the current open position.
     *
     * @param closePrice number
     */
    close(closePrice: number = store.getState().mainReducer.currentPrice): void {
        if (!this.isOpen()) {
            throw new EmptyPosition(`The position is already closed.`);
        }

        // just to prevent confusions:
        let closeQuantity = Math.abs(store.getState().mainReducer.quantity);

        let estimatedProfit: number = $.estimateProfit(
            closeQuantity,
            store.getState().mainReducer.entryPrice,
            closePrice,
            this.type()
        );

        store.dispatch(actions.addProfit(estimatedProfit));
        store.dispatch(actions.increaseCurrentBalance(closeQuantity * store.getState().mainReducer.entryPrice + estimatedProfit));
        store.dispatch(actions.updateQuantity(0));
    },

    /**
     * reduce the size of position.
     *
     * @param quantity number
     * @param price number
     */
    reduce(quantity: number, price: number = store.getState().mainReducer.currentPrice): void {
        if (store.getState().mainReducer.quantity === 0) {
            throw new EmptyPosition(`The position is already closed.`);
        }

        // just to prevent confusions:
        quantity = Math.abs(quantity);

        let estimatedProfit: number = $.estimateProfit(
            quantity,
            store.getState().mainReducer.entryPrice,
            price,
            this.type()
        );

        store.dispatch(actions.addProfit(estimatedProfit));
        store.dispatch(actions.increaseCurrentBalance(quantity * store.getState().mainReducer.entryPrice + estimatedProfit));

        if (this.type() === 'long') {
            store.dispatch(actions.updateQuantity(store.getState().mainReducer.quantity - quantity));
        } else if (this.type() === 'short') {
            store.dispatch(actions.updateQuantity(store.getState().mainReducer.quantity + quantity));
        }
    },

    /**
     * Prints the position stats to the console in a beautiful format.
     */
    printToConsole(): void {
        if (!$.isDebuggable('activePosition')) return;

        if (!this.isOpen()) {
            $.printToConsole('No open positions.');
            return;
        }

        let text: string =
            _.repeat(`-`, 70) +
            '\n' +
            `|| ${store.getState().mainReducer.symbol} || ` +
            `Qty:` +
            $.greenOrRed(store.getState().mainReducer.quantity > 0, `${store.getState().mainReducer.quantity}`) +
            ` | EntryPrice:${store.getState().mainReducer.entryPrice}` +
            ` | PNL:` +
            $.greenOrRed(this.pnl() > 0, `${_.round(this.pnl(), 2)}%`) +
            '\n' +
            _.repeat(`-`, 70);

        console.log(text);

        if (config.notifications.events.updatedPosition) {
            Notifier.send('\n' + text);
        }
    }
};

export default currentPosition;
