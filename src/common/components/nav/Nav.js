import React from "react";
import { Link } from "react-router-dom";
import SignInOutButton from "auth/SignInOutButton";

export default function Nav() {
  return (
    <nav
      className="navbar has-shadow"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="navbar-brand">
        <Link to="/" className="navbar-item">
          <img
            src="/icons/onyx/sliders.svg"
            width="32"
            height="32"
            onError={() => {
              this.onError = null;
              this.src = "/icons/onyx/sliders_512.png";
            }}
          />
          <div className="nav-title">ReCalc (Alpha)</div>
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
