import store, { actions } from "../../store";

const Logger = {
    error(message: string): void {
        store.dispatch(actions.logError(message));
    },

    warning(message: string): void {
        store.dispatch(actions.logWarning(message));
    }
};

export default Logger;
