import { getClientId } from "auth/config";
import { AuthStore } from "auth/store";
import db, { firebaseAuth } from "db";
import { useStoreState } from "pullstate";
import React from "react";
import { GoogleLogin, GoogleLogout } from "react-google-login";

export default function SignInOutButton() {
  const id = useStoreState(AuthStore, s => s.id);
  const isSignedIn = useStoreState(AuthStore, s => s.isSignedIn);

  function onSuccess(resp) {
    const credential = firebaseAuth.GoogleAuthProvider.credential(resp.tokenId);
    firebaseAuth()
      .signInWithCredential(credential)
      .then((r) => {
        AuthStore.update(s => {
          s.isSignedIn = true;
          s.id = r.user.uid;
        })
        const userRef = db.collection("users").doc(r.user.uid);
        userRef.get().then((snapshot) => {
          if (!snapshot.exists) {
            userRef.set({ id: r.user.uid });
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function onLogoutSuccess() {
    AuthStore.update(s => {
      s.isSignedIn = false;
      s.id = undefined;
    });
    firebaseAuth()
      .signOut()
      .then((r) => console.log("Signout success"))
      .catch((e) => console.log("signout failed"));
  }

  console.log(isSignedIn, id);
  if (!isSignedIn) {
    return (
      <GoogleLogin
        clientId={getClientId()}
        onSuccess={onSuccess}
        onFailure={(r) => console.log("Login failed", r)}
        isSignedIn={true}
      />
    );
  } else {
    return (
      <GoogleLogout
        clientId={getClientId()}
        onLogoutSuccess={onLogoutSuccess}
      />
    );
  }
}
