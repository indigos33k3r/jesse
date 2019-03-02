import store, { actions } from "../../store";
import $ from "../Helpers";
import { supportedColors } from "../../store/types";

const Logger = {
    error(message: string): void {
        if ($.isBackTesting() && $.isDebugging()) {
            $.printToConsole(message, supportedColors.RED);
        }

        store.dispatch(actions.logError(message));
    },

    warning(message: string): void {
        if ($.isBackTesting() && $.isDebugging()) {
            $.printToConsole(message, supportedColors.MAGENTA);
        }
        
        store.dispatch(actions.logWarning(message));
    }
};

export default Logger;
