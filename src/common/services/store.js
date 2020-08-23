import { maybeInitializeUserData } from "common/services/db";
import createStore from "redux-zero";
import { bindActions } from "redux-zero/utils";

const initialState = { isSignedIn: false, id: null };
const store = createStore(initialState);

export const actions = () => ({
  signIn: async (_, id) => {
    // const userRef = db.ref(`users/${id}`);
    // await userRef.get().catch(() => {
    //   userRef.set({ id, configs: [] });
    // });

    maybeInitializeUserData(id);

    return { isSignedIn: true, id };
  },
  signOut: () => ({ isSignedIn: false, id: null }),
});

export const boundActions = bindActions(actions, store);

export default store;
