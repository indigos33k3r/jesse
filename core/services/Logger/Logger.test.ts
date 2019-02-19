import { ErrorInterface, WarningInterface } from '../../interfaces/LogInterfaces';
import store, { actions } from '../../store';
import $ from '../Helpers';
import Logger from '.';

beforeEach(() => {
    store.dispatch(actions.resetState());
});

it('Should log errors', () => {
    const error: ErrorInterface = {
        message: 'some text',
        time: $.now()
    };

    Logger.error(error.message); 

    expect(store.getState().logs.errors).toEqual([error]);
});

it('Should log warnings', () => {
    const warning: WarningInterface = {
        message: 'some warning text',
        time: $.now()
    };

    Logger.warning(warning.message); 

    expect(store.getState().logs.warnings).toEqual([warning]);
});