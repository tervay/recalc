import createStore from "redux-zero";
import { bindActions } from "redux-zero/utils";

const initialState = { isSignedIn: false, id: null };
const store = createStore(initialState);

export const actions = () => ({
  signIn: (_, id) => ({ isSignedIn: true, id }),
  signOut: () => ({ isSignedIn: false, id: null }),
});

export const boundActions = bindActions(actions, store);

export default store;
