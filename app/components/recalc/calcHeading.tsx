import LinkIcon from '~icons/lucide/link';

import { Button } from '~/components/ui/button';

export default function CalcHeading({
  title,
  getSerializedState,
}: {
  title: string;
  getSerializedState: () => string;
}) {
  return (
    <div className="mb-6 flex flex-row items-center justify-between border-b pt-6 pb-5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          void navigator.clipboard.writeText(
            window.location.origin +
              window.location.pathname +
              '?' +
              getSerializedState(),
          );
        }}
      >
        <LinkIcon className="size-3.5" />
        Copy Link
      </Button>
    </div>
  );
}
