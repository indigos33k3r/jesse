require('dotenv').config(); 

import store, { actions } from "../store";
import config from "../../config";

store.dispatch(actions.resetState());
config.app.tradingMode = 'backtest';
config.app.isTesting = true;