import { ActionInterface } from '../../interfaces/ActionInterface';
import { ErrorInterface, WarningInterface } from '../../interfaces/LogInterfaces';
import { ActionTypes as types } from './../types';

interface StateInterface {
    readonly errors: ErrorInterface[];
    readonly warnings: WarningInterface[];
}

const initialState: StateInterface = {
    errors: [], 
    warnings: []
}

export function logsReducer(state: StateInterface = initialState, action?: ActionInterface): StateInterface {
    switch (action.type) {
        case types.RESET_STATE:
            return initialState;
            
        case types.LOG_ERROR:
            return { ...state, errors: [...state.errors, action.payload] };
        case types.LOG_WARNING:
            return { ...state, warnings: [...state.warnings, action.payload] };

        default:
            return state;
    }
}
