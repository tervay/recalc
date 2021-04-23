import { Link } from "react-router-dom";

export default function Nav() {
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
    </nav>
  );
}
