import { auth } from "db";
import React from "react";
import { Redirect } from "react-router-dom";
import { useAction } from "redux-zero/react";

export default function AuthRedirect() {
  const signIn = useAction((state, id) => ({ isSignedIn: true, id }));
  const signOut = useAction((state) => ({ isSignedIn: false, id: null }));
  auth.listen((user) => {
    if (user === null) {
      signOut();
    } else {
      signIn(user.localId);
    }
  });

  auth.handleSignInRedirect();
  return <Redirect to="/" />;
}
