import { auth } from "db";
import createStore from "redux-zero";
import { bindActions } from "redux-zero/utils";

const initialState = { isSignedIn: false, id: null };
const store = createStore(initialState);

const actions = () => ({
  signIn: (_, id) => ({ isSignedIn: true, id }),
  signOut: () => ({ isSignedIn: false, id: null }),
});

const boundActions = bindActions(actions, store);

auth.listen((user) => {
  if (user === null) {
    boundActions.signOut();
  } else {
    boundActions.signIn(user.localId);
  }
});

export default store;
