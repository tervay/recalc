import { cn } from '~/lib/utils';

interface LogoProps {
  color?: 'black' | 'white';
  alignment?: 'middle' | 'bottom';
}

export default function Logo({
  color = 'black',
  alignment = 'middle',
}: LogoProps) {
  return (
    <span className="inline-flex flex-col items-center">
      <div className="flex items-center gap-1">
        <img
          src="/logo/motor.svg"
          alt="ReCalc Logo"
          className={cn(
            'h-12 w-12',
            color === 'white' ? 'svg-white' : 'svg-black',
          )}
          style={{ verticalAlign: alignment === 'bottom' ? 'sub' : 'middle' }}
        />
        <span
          className={cn(
            'text-3xl font-light',
            color === 'white' ? 'text-white' : 'text-black',
          )}
        >
          ReCalc
        </span>
      </div>
      <div
        className={cn(
          'text-center text-lg font-extralight max-md:hidden',
          color === 'white' ? 'text-white' : 'text-black',
        )}
      >
        A collaboration focused mechanical design calculator.
      </div>
    </span>
  );
}
