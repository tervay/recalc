import Logo from "common/components/styling/Logo";
import { Link } from "react-router-dom";

export default function Nav(): JSX.Element {
  return (
    <nav className="navbar level is-primary">
      <div className="level-item has-text-centered">
        <Link to="/" className="navbar-item">
          <div className="nav-title">
            <Logo color="white" />
          </div>
        </Link>
      </div>
    </nav>
  );
}
