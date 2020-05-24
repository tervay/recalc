import React from "react";
import { Link } from "react-router-dom";
import Auth from "../auth/Auth";

export default function Nav() {
  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link to="/" className="navbar-item">
          <img src="/icon.png" width="32" height="32" />
        </Link>

        <Auth />
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
