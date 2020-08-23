import createStore from "redux-zero";
import { bindActions } from "redux-zero/utils";

import db from "./db";

const initialState = { isSignedIn: false, id: null };
const store = createStore(initialState);

export const actions = () => ({
  signIn: async (_, id) => {
    const userRef = db.ref(`users/${id}`);
    await userRef.get().catch(() => {
      userRef.set({ id, configs: [] });
    });
    return { isSignedIn: true, id };
  },
  signOut: () => ({ isSignedIn: false, id: null }),
});

export const boundActions = bindActions(actions, store);

export default store;
