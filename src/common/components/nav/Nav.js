import React from "react";
import { Link } from "react-router-dom";
import SignInOutButton from "auth/SignInOutButton";

export default function Nav() {
  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link to="/" className="navbar-item">
          <img src="/favicon.png" width="32" height="32" />
          <div className="nav-title">ReCalc</div>
        </Link>
        <SignInOutButton />
      </div>
      <div className="navbar-menu">
        <div className="navbar-start">
          <div className="navbar-item">
            <div className="buttons"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}
