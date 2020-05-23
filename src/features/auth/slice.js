import { createSlice } from "@reduxjs/toolkit";
import db from "../db";

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
    tellFirestoreAboutUser: (state, action) => {
      const userRef = db.collection("users").doc(state.id);
      userRef.get().then((snapshot) => {
        if (!snapshot.exists) {
          console.log("Creating new user in firebase");
          userRef.set({ id: state.id });
        }
      });
    },
  },
});

export const { signIn, signOut, tellFirestoreAboutUser } = authSlice.actions;
export default authSlice.reducer;
