import { ErrorDisplay } from '~/components/recalc/errorDisplay';

export default function DevErrorPage() {
  const fakeError = new Error(
    'Something went terribly wrong while computing gear ratios.',
  );
  fakeError.name = 'ExampleError';
  fakeError.stack = [
    'ExampleError: Something went terribly wrong while computing gear ratios.',
    '    at computeGearRatio (~/lib/math/gears.ts:42:7)',
    '    at GearCalculator (~/routes/gears.tsx:88:3)',
    '    at renderWithHooks (react-dom.development.js:14985:18)',
    '    at mountIndeterminateComponent (react-dom.development.js:17811:13)',
    '    at beginWork (react-dom.development.js:19049:20)',
  ].join('\n');

  return <ErrorDisplay error={fakeError} />;
}
