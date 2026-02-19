export const checkLogin = (status: boolean) => {
  return {
    type: "CHECK_LOGIN",
    status: status,
  };
};
