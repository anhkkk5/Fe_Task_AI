const loginReducer = (state = false, action: any) => {
  switch (action.type) {
    case "CHECK_LOGIN":
      return action.status;
    default:
      return state;
  }
};
export default loginReducer;
