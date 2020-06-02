import createStore from "redux-zero";

const initialState = { isSignedIn: false, id: null };
const store = createStore(initialState);

export default store;
