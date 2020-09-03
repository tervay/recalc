import "firebase/auth";

import provider from "common/services/gauth";
import firebase from "firebase/app";
import React from "react";
import GoogleButton from "react-google-button/dist/react-google-button";
import { useSelector } from "redux-zero/react";

export default function SignInOutButton() {
  const isSignedIn = useSelector(({ isSignedIn }) => isSignedIn);

  if (!isSignedIn) {
    return (
      <GoogleButton
        onClick={() => {
          // auth.signInWithProvider("google.com");
          firebase.auth().signInWithRedirect(provider);
        }}
      />
    );
  } else {
    return (
      <GoogleButton
        onClick={() => {
          // auth.signOut();
          firebase.auth().signOut();
        }}
        label="Sign Out"
      />
    );
  }
}
