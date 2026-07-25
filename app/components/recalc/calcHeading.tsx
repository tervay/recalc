import { useEffect, useRef, useState } from 'react';
import CheckIcon from '~icons/lucide/check';
import LinkIcon from '~icons/lucide/link';

import { Button } from '~/components/ui/button';
import { useAnalytics } from '~/hooks/useAnalytics';
import { handleCopyLink } from '~/lib/copyLink';

// rounded-md = calc(var(--radius) - 2px) = calc(0.75rem - 2px) = 10px
const RADIUS = 10;
const INSET = 1; // half stroke width, keeps the stroke inside the button bounds

function buildBorderPaths(w: number, h: number): [string, string] {
  const cx = w / 2;
  const r = RADIUS;
  const s = INSET;
  const left = `M ${cx},${h - s} L ${r + s},${h - s} Q ${s},${h - s} ${s},${h - r - s} L ${s},${r + s} Q ${s},${s} ${r + s},${s} L ${cx},${s}`;
  const right = `M ${cx},${h - s} L ${w - r - s},${h - s} Q ${w - s},${h - s} ${w - s},${h - r - s} L ${w - s},${r + s} Q ${w - s},${s} ${w - r - s},${s} L ${cx},${s}`;
  return [left, right];
}

export default function CalcHeading({
  title,
  getSerializedState,
}: {
  title: string;
  getSerializedState: () => string;
}) {
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const { track } = useAnalytics();

  useEffect(() => {
    if (copied && wrapperRef.current) {
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      setDims({ w: width, h: height });
    } else {
      setDims(null);
    }
  }, [copied]);

  return (
    <div className="mb-6 flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pt-6 pb-5">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h1>
      <div ref={wrapperRef} className="relative inline-flex">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            handleCopyLink({
              title,
              serializedState: getSerializedState(),
              track,
            });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <span className="relative size-3.5">
            <LinkIcon
              className={`absolute inset-0 size-3.5 transition-opacity duration-150 ${copied ? 'opacity-0' : 'opacity-100'}`}
            />
            <CheckIcon
              className={`absolute inset-0 size-3.5 text-green-500 transition-opacity duration-150 ${copied ? 'opacity-100' : 'opacity-0'}`}
            />
          </span>
          <span className="inline-grid">
            <span
              className="col-start-1 row-start-1 opacity-0 select-none"
              aria-hidden
            >
              Copy Link
            </span>
            <span className="col-start-1 row-start-1">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </span>
        </Button>
        {copied && dims && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={dims.w}
            height={dims.h}
            aria-hidden="true"
          >
            {buildBorderPaths(dims.w, dims.h).map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="100"
                style={{ animation: 'draw-border 1.2s ease-out forwards' }}
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
