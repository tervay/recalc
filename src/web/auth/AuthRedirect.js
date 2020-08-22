import auth from "common/services/auth";
import React from "react";
import { Redirect } from "react-router-dom";

export default function AuthRedirect() {
  auth.handleSignInRedirect();
  return <Redirect to="/" />;
}
