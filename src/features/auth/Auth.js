import React from "react";
import { GoogleLogin, GoogleLogout } from "react-google-login";
import { useDispatch, useSelector } from "react-redux";
import { isLocalhost } from "../../utils";
import db, { firebaseAuth } from "../db";
import { signIn, signOut } from "./slice";

const localhostClientId =
  "411934684683-agkmu38ndl2ovnsrocpcr2b1opmc7ap0.apps.googleusercontent.com";
const prodClientId =
  "411934684683-034ssgvppgghiv9iipftsjo4bogtthtk.apps.googleusercontent.com";

export function IsSignedIn() {
  return useSelector((s) => s.auth.signedIn);
}

export function GetUser() {
  return useSelector((s) => s.auth.id);
}

export default function Auth() {
  const dispatch = useDispatch();
  function onSuccess(resp) {
    const credential = firebaseAuth.GoogleAuthProvider.credential(resp.tokenId);
    firebaseAuth()
      .signInWithCredential(credential)
      .then((r) => {
        dispatch(signIn({ id: r.user.uid }));
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
    dispatch(signOut());
    firebaseAuth()
      .signOut()
      .then((r) => console.log("Signout success"))
      .catch((e) => console.log("signout failed"));
  }

  const signedIn = useSelector((state) => state.auth.signedIn);

  if (!signedIn) {
    return (
      <GoogleLogin
        clientId={isLocalhost() ? localhostClientId : prodClientId}
        onSuccess={onSuccess}
        onFailure={(r) => console.log("Login failed", r)}
        isSignedIn={true}
      />
    );
  } else {
    return (
      <GoogleLogout
        clientId={isLocalhost() ? localhostClientId : prodClientId}
        onLogoutSuccess={onLogoutSuccess}
      />
    );
  }
}
