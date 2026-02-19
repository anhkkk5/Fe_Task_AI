import { combineReducers } from "redux";

import loginReducer from "./authen";

const allReducers = combineReducers({
  loginReducer,
});

export default allReducers;
