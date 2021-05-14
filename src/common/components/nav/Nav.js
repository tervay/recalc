import { Link } from "react-router-dom";

export default function Nav() {
  return (
    <nav className="navbar level is-primary">
      <div className="level-item has-text-centered">
        <Link to="/" className="navbar-item">
          <div className="nav-title">
            <b>⎰ReCalc (Alpha)</b>
          </div>
        </Link>
      </div>
    </nav>
  );
}
