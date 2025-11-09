import { Link } from 'react-router';

import Logo from './logo';

export default function Nav() {
  return (
    <nav className="w-full bg-primary py-4">
      <div className="flex items-center justify-center">
        <Link to="/" className="flex items-center justify-center">
          <Logo color="white" />
        </Link>
      </div>
    </nav>
  );
}
