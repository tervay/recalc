import React from "react";
import { Link } from "react-router-dom";
import Auth from "../auth/Auth";

export default function Nav() {
  return (
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <Link to="/" className="navbar-item">
          <img src="/icon.png" width="32" height="32" />
        </Link>

        <Auth />
      </div>
      <div class="navbar-menu">
        <div class="navbar-start">
          <div class="navbar-item">
            <div class="buttons"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}
