import { auth } from "db";
import React from "react";
import { Redirect } from "react-router-dom";

export default function AuthRedirect() {
  auth.handleSignInRedirect();
  return <Redirect to="/" />;
}
