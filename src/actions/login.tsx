export const checkLogin = (status: boolean, user?: any) => {
  return {
    type: "CHECK_LOGIN",
    status: status,
    payload: user,
  };
};

export const logout = () => {
  return {
    type: "LOGOUT",
  };
};
