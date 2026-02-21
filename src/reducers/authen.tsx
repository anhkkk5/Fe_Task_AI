const initialState = {
  isLogin: false,
  user: null,
};

const loginReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "CHECK_LOGIN":
      return { ...state, isLogin: action.status };
    case "UPDATE_USER":
      return { ...state, user: { ...(state.user || {}), ...action.payload } };
    default:
      return state;
  }
};

export default loginReducer;
