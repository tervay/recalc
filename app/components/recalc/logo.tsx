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
      <div className="relative flex items-center gap-1">
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
            'relative text-3xl font-light transition-all duration-300',
            color === 'white' ? 'text-white' : 'text-black',
          )}
        >
          <span className="relative z-10 inline-block">ReCalc</span>
          {color === 'white' ? (
            <>
              {/* Shiny gradient overlay */}
              <span
                className="absolute inset-0 z-20 block overflow-hidden opacity-0
                  transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ReCalc
              </span>
            </>
          ) : (
            <>
              {/* Shiny gradient overlay for black text */}
              <span
                className="absolute inset-0 z-20 block overflow-hidden opacity-0
                  transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ReCalc
              </span>
            </>
          )}
        </span>
        {/* Animated underline spanning both SVG and text */}
        <span
          className={cn(
            `absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2
            transition-all duration-500 group-hover:w-full`,
            color === 'white' ? 'bg-white' : 'bg-black',
          )}
        />
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
