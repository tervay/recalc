import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { signIn, signOut, tellFirestoreAboutUser } from "./slice";
import { GoogleLogin, GoogleLogout } from "react-google-login";
import { isLocalhost } from "../../utils";
import { firebaseAuth, googleProvider } from "../db";

const localhostClientId =
  "411934684683-agkmu38ndl2ovnsrocpcr2b1opmc7ap0.apps.googleusercontent.com";
const prodClientId =
  "411934684683-034ssgvppgghiv9iipftsjo4bogtthtk.apps.googleusercontent.com";

const testId =
  "411934684683-2hfqodehpc51pplgg21l26uslatrm3oc.apps.googleusercontent.com";

export default function Auth() {
  const dispatch = useDispatch();
  function onSuccess(resp) {
    const id = resp.tokenId;
    dispatch(signIn({ id }));
    // dispatch(tellFirestoreAboutUser());
    const credential = firebaseAuth.GoogleAuthProvider.credential(
        resp.tokenId
    );
    firebaseAuth().signInWithCredential(credential).then((r) => {
        console.log('yay')
        console.log(r);
    }).catch((err) => {
        console.log(err);
    });
  }

  function onLogoutSuccess() {
    dispatch(signOut());
  }

  const signedIn = useSelector((state) => state.auth.signedIn);

  if (!signedIn) {
    return (
      <GoogleLogin
        clientId={isLocalhost() ? localhostClientId : prodClientId}
        onSuccess={onSuccess}
        onFailure={(r) => console.log("Login failed", r)}
        cookiePolicy={"single_host_origin"}
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
