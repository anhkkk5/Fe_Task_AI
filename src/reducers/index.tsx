import { combineReducers } from "redux";

import loginReducer from "./authen";
import notificationReducer from "./notifications";

const allReducers = combineReducers({
  loginReducer,
  notifications: notificationReducer,
});

export default allReducers;
