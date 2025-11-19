import { AlertTriangleIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { cn } from '~/lib/utils';

function Warning() {
  return (
    <Alert
      className={cn(
        `mx-auto w-full border-yellow-200 bg-yellow-50 text-yellow-900 md:w-1/3
        dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100`,
      )}
    >
      <AlertTriangleIcon />
      <AlertTitle className="text-yellow-900 dark:text-yellow-100">
        Warning
      </AlertTitle>
      <AlertDescription
        className="text-yellow-800 *:contents dark:text-yellow-200"
      >
        These calculators are provided as reference&nbsp;<b>only</b>. These
        should not be taken as the holy truth of the universe - they are
        estimates created in order to guide you to the best solution. I cannot
        guarantee the math is perfectly accurate in all scenarios.
      </AlertDescription>
    </Alert>
  );
}

export { Warning };
