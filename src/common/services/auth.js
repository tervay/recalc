import key from "common/services/gkey";
import { boundActions } from "common/services/store";
import Auth from "firebase-auth-lite";

const auth = new Auth({
  apiKey: key.apiKey,
  redirectUri: window.location.origin + "/auth",
});

auth.listen((user) => {
  if (user === null) {
    boundActions.signOut();
  } else {
    boundActions.signIn(user.localId);
  }
});

export default auth;
