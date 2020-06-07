import React from "react";
import { Link } from "react-router-dom";
import SignInOutButton from "auth/SignInOutButton";

export default function Nav() {
  return (
    <nav className="navbar level has-shadow">
      <div className="level-item has-text-centered">
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
          <div className="nav-title"><b>ReCalc (Alpha)</b></div>
        </Link>
      </div>

      <div className="level-item has-text-centered is-hidden-mobile"></div>
      <div className="level-item has-text-centered is-hidden-mobile"></div>
      <div className="level-item has-text-centered is-hidden-mobile"></div>
      <div className="level-item has-text-centered is-hidden-mobile"></div>
      <div className="level-item has-text-centered is-hidden-mobile"></div>
      <div className="level-item has-text-centered is-hidden-mobile"></div>
      <div className="level-item has-text-centered is-hidden-mobile"></div>

      <div className="level-item has-text-centered">
        <SignInOutButton />
      </div>
    </nav>
  );
}
