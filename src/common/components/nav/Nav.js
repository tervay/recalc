import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "redux-zero/react";
import { URL as profileURL } from "web/profile";

export default function Nav() {
  const isSignedIn = useSelector(({ isSignedIn }) => isSignedIn);

  return (
    <nav className="navbar level is-primary">
      <div className="level-item has-text-centered">
        <Link to="/" className="navbar-item">
          <img
            src="/icons/white/sliders.svg"
            width="32"
            height="32"
            onError={() => {
              this.onError = null;
              this.src = "/icons/white/sliders_512.png";
            }}
            alt="ReCalc logo"
          />
          <div className="nav-title">
            <b>ReCalc (Alpha)</b>
          </div>
        </Link>
      </div>

      <div className="level-item has-text-centered is-hidden-mobile" />
      <div className="level-item has-text-centered">
        {isSignedIn && (
          <Link to={profileURL}>
            <button className="button mr-4 is-outlined has-background-primary has-text-white">
              Profile
            </button>
          </Link>
        )}

        {/*<SignInOutButton />*/}
      </div>
    </nav>
  );
}
