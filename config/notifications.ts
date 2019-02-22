import Driver from 'jesse-notifications-telegram';
import NotificationsDriverInterface from "../core/services/Notifier/types";

interface NotificationsConfigInterface {
    enable: boolean;
    driver: NotificationsDriverInterface;
    events: eventsInterface;
}

interface eventsInterface {
    errors: boolean;
    liveTradeStarted: boolean;
    liveTradeStopped: boolean;
    submittedOrders: boolean;
    cancelledOrders: boolean;
    executedOrders: boolean;
    openedPosition: boolean;
    updatedPosition: boolean;
}

const notifications: NotificationsConfigInterface = {
    // setting this to 0 will disable notifications entirely
    enable: !!(parseInt(process.env.ENABLE_NOTIFICATIONS)), 

    // set the imported notifications driver 
    driver: new Driver(), 

    // events to report reported
    events: {
        errors: true, 
        liveTradeStarted: true, 
        liveTradeStopped: true,     
        submittedOrders: true, 
        cancelledOrders: true, 
        executedOrders: true, 
        openedPosition: true, 
        updatedPosition: true,
    }, 
}

export default notifications; 