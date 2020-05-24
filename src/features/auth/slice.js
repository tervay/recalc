import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    signedIn: false,
    id: null,
  },
  reducers: {
    signIn: (state, action) => {
      state.signedIn = true;
      state.id = action.payload.id;
    },
    signOut: (state, action) => {
      state.signedIn = false;
      state.id = null;
    },
  },
});

export const { signIn, signOut } = authSlice.actions;
export default authSlice.reducer;
