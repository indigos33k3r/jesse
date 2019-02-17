import store, { actions } from "../../store";
import api from "./API";

beforeEach(() => {
    store.dispatch(actions.resetState());
});

it('Should return flags in integer format', () => {
    expect(api.getOrderFlags(['ReduceOnly'])).toEqual(1024);
    expect(api.getOrderFlags(['Hidden'])).toEqual(64);
    expect(api.getOrderFlags(['Close'])).toEqual(512);
    expect(api.getOrderFlags(['PostOnly'])).toEqual(4096);
    expect(api.getOrderFlags(['OCO'])).toEqual(16384);

    expect(api.getOrderFlags(['OCO', 'PostOnly', 'Close', 'Hidden', 'ReduceOnly'])).toEqual(
        1024 + 64 + 512 + 4096 + 16384
    );
});