import React from "react";
import { Redirect } from "react-router-dom";
import { useSelector } from "redux-zero/react";

export default function Profile() {
  const isSignedIn = useSelector(({ isSignedIn }) => isSignedIn);
  if (!isSignedIn) {
    return <Redirect to={"/"} />;
  }

  return <>hi</>;
}
