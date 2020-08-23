import firebase from "common/services/firebase";
import { boundActions } from "common/services/store";
const provider = new firebase.auth.GoogleAuthProvider();

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    boundActions.signIn(user.uid);
  } else {
    boundActions.signOut();
  }
});

export default provider;
