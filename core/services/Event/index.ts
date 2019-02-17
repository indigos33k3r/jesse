import events from 'events';

const Event: events.EventEmitter = new events.EventEmitter();

// turn off the limit
Event.setMaxListeners(0);

export default Event;