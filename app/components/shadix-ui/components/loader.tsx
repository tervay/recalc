import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'motion/react';
import { useMemo } from 'react';

import { cn } from '~/lib/utils';

const loaderSizes = cva('', {
  variants: {
    size: {
      default: 'size-10',
      sm: 'size-6',
      md: 'size-10',
      lg: 'size-14',
      xl: 'size-18',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

// feat: bar loader sizes with more width for horizontal layout
const barLoaderSizes = cva('', {
  variants: {
    size: {
      default: 'h-1 w-24',
      sm: 'h-0.5 w-16',
      md: 'h-1.5 w-32',
      lg: 'h-2 w-40',
      xl: 'h-3 w-48',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

type LoaderVariant =
  | 'arc'
  | 'circle-dots'
  | 'two-dots'
  | 'three-dots'
  | 'triangle'
  | 'dual-arc'
  | 'bounce'
  | 'clip'
  | 'bar'
  | 'beat'
  | 'puff';

interface LoaderProps extends React.HTMLAttributes<HTMLElement> {
  /** @public (optional) - The className of the loader container */
  className?: string;
  /** @public (optional) - The variant of the loader */
  variant?: LoaderVariant;
  /** @public (optional) - The size of the loader */
  size?: VariantProps<typeof loaderSizes>['size'];
}

const Loader: React.FC<LoaderProps> = ({
  variant = 'arc',
  size = 'default',
  className,
  ...props
}) => {
  const Component = useMemo(() => {
    switch (variant) {
      case 'arc':
        return ArcLoader;
      case 'circle-dots':
        return CircleDotsLoader;
      case 'two-dots':
        return TwoDotsLoader;
      case 'three-dots':
        return ThreeDotsLoader;
      case 'triangle':
        return TriangleLoader;
      case 'dual-arc':
        return DualArcLoader;
      case 'bounce':
        return BounceLoader;
      case 'clip':
        return ClipLoader;
      case 'bar':
        return BarLoader;
      case 'beat':
        return BeatLoader;
      case 'puff':
        return PuffLoader;
      default:
        return ArcLoader;
    }
  }, [variant]);

  // refactor: apply variant-specific sizing (bar needs more width)
  const sizeClasses = useMemo(() => {
    if (variant === 'bar') {
      return barLoaderSizes({ size });
    }
    return loaderSizes({ size });
  }, [variant, size]);

  return (
    <div
      className={cn('flex items-center justify-center', sizeClasses, className)}
      {...props}
    >
      <Component size={size} />
    </div>
  );
};

const ArcLoader = ({
  size,
}: {
  size: VariantProps<typeof loaderSizes>['size'];
}) => {
  const borderSize = useMemo(() => {
    switch (size) {
      case 'default':
        return 'border-[3px]';
      case 'sm':
        return 'border-[2px]';
      case 'md':
      case 'lg':
        return 'border-[3px]';
      case 'xl':
        return 'border-[4px]';
      default:
        return 'border-[3px]';
    }
  }, [size]);

  return (
    <motion.div
      className={cn(
        'h-full w-full rounded-full border-2 border-primary border-t-transparent',
        borderSize,
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 3,
        ease: 'linear',
        repeat: Infinity,
      }}
    />
  );
};

const DualArcLoader = ({
  size,
}: {
  size: VariantProps<typeof loaderSizes>['size'];
}) => {
  const borderSize = useMemo(() => {
    switch (size) {
      case 'default':
        return 'border-[3px]';
      case 'sm':
        return 'border-[2px]';
      case 'md':
      case 'lg':
        return 'border-[3px]';
      case 'xl':
        return 'border-[4px]';
      default:
        return 'border-[3px]';
    }
  }, [size]);

  const insetSize = useMemo(() => {
    switch (size) {
      case 'default':
        return 'inset-0.5';
      case 'sm':
        return 'inset-1';
      case 'md':
      case 'lg':
        return 'inset-1.5';
      case 'xl':
        return 'inset-2';
      default:
        return 'inset-0.5';
    }
  }, [size]);

  return (
    <div className="relative h-full w-full">
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full border-4 border-primary border-t-transparent',
          borderSize,
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, ease: 'linear', repeat: Infinity }}
      />
      <motion.div
        className={cn(
          'absolute rounded-full border-4 border-primary border-b-transparent',
          borderSize,
          insetSize,
        )}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.2, ease: 'linear', repeat: Infinity }}
      />
    </div>
  );
};

const CircleDotsLoader = () => {
  const dots = Array.from({ length: 8 });

  return (
    <div className="relative h-full w-full">
      {dots.map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const radius = 35; // percentage from center
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        return (
          <motion.span
            key={i.toString()}
            className={cn('absolute h-[20%] w-[20%] rounded-full bg-primary')}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              x: '-50%',
              y: '-50%',
            }}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.6,
              ease: [0.4, 0, 0.6, 1],
              repeat: Infinity,
              repeatType: 'loop',
              delay: i * 0.2,
            }}
          />
        );
      })}
    </div>
  );
};

const TwoDotsLoader = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="h-[25%] w-[25%] rounded-full bg-primary"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
};

const ThreeDotsLoader = () => {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="aspect-square w-[25%] rounded-full bg-primary"
          animate={{ y: ['0%', '-50%', '0%'] }}
          transition={{
            ease: 'easeInOut',
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

const TriangleLoader = () => {
  const positions = [
    { x: 0, y: '-100%' },
    { x: '-70%', y: 0 },
    { x: '70%', y: 0 },
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {positions.map((p, i) => (
        <motion.span
          key={i.toString()}
          className="absolute h-[25%] w-[25%] rounded-full bg-primary"
          style={{
            transform: `translate(${p.x}, ${p.y})`,
          }}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

const BounceLoader = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="absolute h-full w-full rounded-full bg-primary/60"
        animate={{
          scale: [0, 1, 0],
        }}
        transition={{
          duration: 2.1,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute h-full w-full rounded-full bg-primary/60"
        animate={{
          scale: [0, 1, 0],
        }}
        transition={{
          duration: 2.1,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
          delay: 1,
        }}
      />
    </div>
  );
};

const ClipLoader = ({
  size,
}: {
  size: VariantProps<typeof loaderSizes>['size'];
}) => {
  const borderSize = useMemo(() => {
    switch (size) {
      case 'default':
        return 'border-[4px]';
      case 'sm':
        return 'border-[3px]';
      case 'md':
      case 'lg':
        return 'border-[4px]';
      case 'xl':
        return 'border-[5px]';
      default:
        return 'border-[4px]';
    }
  }, [size]);

  return (
    <motion.div
      className={cn(
        'h-full w-full rounded-full border-primary border-t-transparent',
        borderSize,
      )}
      animate={{
        rotate: 360,
        scale: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 1,
        ease: 'linear',
        repeat: Infinity,
      }}
    />
  );
};

const BarLoader = ({
  size: _size,
}: {
  size: VariantProps<typeof loaderSizes>['size'];
}) => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-sm bg-primary/30">
      <motion.span
        className="absolute inset-y-0 z-10 h-full bg-primary"
        animate={{
          left: ['-35%', '100%', '100%'],
          right: ['100%', '-90%', '-90%'],
        }}
        style={{
          willChange: 'left,right',
        }}
        transition={{
          duration: 1.5,
          ease: [0.65, 0.815, 0.735, 0.395],
          times: [0, 0.6, 1],
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />
      <motion.span
        className="absolute inset-y-0 z-10 h-full bg-primary"
        animate={{
          left: ['-200%', '107%', '107%'],
          right: ['100%', '-8%', '-8%'],
        }}
        style={{
          willChange: 'left,right',
        }}
        transition={{
          duration: 1.5,
          ease: [0.165, 0.84, 0.44, 1],
          times: [0, 0.6, 1],
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />
    </div>
  );
};

const BeatLoader = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-0">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="aspect-square w-[25%] rounded-full bg-primary"
          initial={{
            opacity: 0.5,
            scale: 0.75,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.75, 1, 0.75],
          }}
          transition={{
            ease: 'easeInOut',
            duration: 1,
            repeat: Infinity,
            delay: i === 1 ? 0.5 : 0,
          }}
        />
      ))}
    </div>
  );
};

const PuffLoader = ({
  size,
}: {
  size: VariantProps<typeof loaderSizes>['size'];
}) => {
  const borderSize = useMemo(() => {
    switch (size) {
      case 'default':
        return 'border-[4px]';
      case 'sm':
        return 'border-[3px]';
      case 'md':
      case 'lg':
        return 'border-[4px]';
      case 'xl':
        return 'border-[5px]';
      default:
        return 'border-[4px]';
    }
  }, [size]);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.span
        className={cn(
          'absolute inset-0 h-full w-full rounded-full border-secondary',
          borderSize,
        )}
        initial={{
          opacity: 0,
          scale: 0,
        }}
        animate={{
          scale: [0, 1, 0],
          opacity: [1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />

      <motion.span
        className={cn(
          'absolute inset-0 h-full w-full rounded-full border-primary',
          borderSize,
        )}
        initial={{
          opacity: 0,
          scale: 0,
        }}
        animate={{
          scale: [0, 1, 0],
          opacity: [1, 0],
        }}
        transition={{
          duration: 2,
          delay: 1,
          repeat: Infinity,
        }}
      />
    </div>
  );
};

export { Loader };
