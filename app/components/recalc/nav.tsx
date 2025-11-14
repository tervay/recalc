import Logo from 'app/components/recalc/logo';
import { Link } from 'react-router';

import { ModeToggle } from '~/components/recalc/modeToggle';

export default function Nav() {
  return (
    <nav className="w-full bg-primary py-4">
      <div className="flex items-center justify-between px-4">
        <div className="flex-1" />
        <Link to="/" className="group flex items-center justify-center">
          <Logo color="white" />
        </Link>
        <div className="flex flex-1 justify-end">
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
