import { auth } from "db";
import React from "react";
import GoogleButton from "react-google-button";
import { useSelector } from "redux-zero/react";

export default function SignInOutButton() {
  const isSignedIn = useSelector(({ isSignedIn }) => isSignedIn);

  if (!isSignedIn) {
    return (
      <GoogleButton
        onClick={() => {
          auth.signInWithProvider("google.com");
        }}
      />
    );
  } else {
    return (
      <GoogleButton
        onClick={() => {
          auth.signOut();
        }}
        label="Sign Out"
      />
    );
  }
}
