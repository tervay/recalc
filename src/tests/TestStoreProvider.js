import createStore from "redux-zero";
import { Provider } from "redux-zero/react";

const initialState = { isSignedIn: false, id: null };
const store = createStore(initialState);

export function TestingProvider(props) {
  return <Provider store={store}>{props.children}</Provider>;
}
