import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isLogin: boolean;
  user: any;
}

const initialState: AuthState = {
  isLogin: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    checkLogin: (state, action: PayloadAction<{ status: boolean; user?: any }>) => {
      state.isLogin = action.payload.status;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    updateUser: (state, action: PayloadAction<any>) => {
      state.user = { ...(state.user || {}), ...action.payload };
    },
    logout: () => initialState,
  },
});

export const { checkLogin, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
