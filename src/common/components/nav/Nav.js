import React from "react";
import { Link } from "react-router-dom";
import SignInOutButton from "auth/SignInOutButton";

export default function Nav() {
  return (
    <nav class="navbar level has-shadow">
      <div class="level-item has-text-centered">
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
      </div>

      <div class="level-item has-text-centered is-hidden-mobile"></div>
      <div class="level-item has-text-centered is-hidden-mobile"></div>
      <div class="level-item has-text-centered is-hidden-mobile"></div>
      <div class="level-item has-text-centered is-hidden-mobile"></div>
      <div class="level-item has-text-centered is-hidden-mobile"></div>
      <div class="level-item has-text-centered is-hidden-mobile"></div>
      <div class="level-item has-text-centered is-hidden-mobile"></div>

      <div class="level-item has-text-centered">
        <SignInOutButton />
      </div>
    </nav>
  );
}
