import Logo from "./Logo";

export default function Nav(): JSX.Element {
  return (
    // <nav className="navbar level is-primary">
    //   <div className="level-item has-text-centered">
    //     <Link to="/" className="navbar-item">
    //       <div className="nav-title">
    //         <Logo color="white" />
    //       </div>
    //     </Link>
    //   </div>
    // </nav>
    <div className="navbar bg-primary">
      <div className="navbar-start"></div>
      <div className="navbar-center">
        <Logo link color="white" />
      </div>
      <div className="navbar-end"></div>
    </div>
  );
}
