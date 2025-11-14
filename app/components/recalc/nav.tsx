import Logo from 'app/components/recalc/logo';
import { Suspense, lazy } from 'react';
import { Link } from 'react-router';

const _ModeToggle = lazy(() =>
  import('~/components/recalc/modeToggle').then((m) => ({
    default: m.ModeToggle,
  })),
);

export default function Nav() {
  return (
    <nav className="w-full bg-primary py-4">
      <div className="flex items-center justify-between px-4">
        <div className="flex-1" />
        <Link to="/" className="group flex items-center justify-center">
          <Logo color="white" />
        </Link>
        <div className="flex flex-1 justify-end">
          <Suspense fallback={null}>{/* <ModeToggle /> */}</Suspense>
        </div>
      </div>
    </nav>
  );
}
