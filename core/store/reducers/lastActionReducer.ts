import { ActionInterface } from "../../interfaces/ActionInterface";

/**
 *records the last action fired. Useful when watching store.
 *
 * @param {ActionInterface} [state=null]
 * @param {ActionInterface} action
 * @returns {ActionInterface}
 */
export function lastActionReducer(state: ActionInterface = null, action: ActionInterface): ActionInterface {
    return action;
}