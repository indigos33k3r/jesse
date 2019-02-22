import store, { actions } from "../../store";
import { getOrderFlags } from "./utilities";

beforeEach(() => {
    store.dispatch(actions.resetState());
});

it('Should return flags in integer format', () => {
    expect(getOrderFlags(['ReduceOnly'])).toEqual(1024);
    expect(getOrderFlags(['Hidden'])).toEqual(64);
    expect(getOrderFlags(['Close'])).toEqual(512);
    expect(getOrderFlags(['PostOnly'])).toEqual(4096);
    expect(getOrderFlags(['OCO'])).toEqual(16384);

    expect(getOrderFlags(['OCO', 'PostOnly', 'Close', 'Hidden', 'ReduceOnly'])).toEqual(
        1024 + 64 + 512 + 4096 + 16384
    );
});