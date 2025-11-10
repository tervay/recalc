import { Button } from '~/components/ui/button';

export default function CalcHeading({
  title,
  getSerializedState,
}: {
  title: string;
  getSerializedState: () => string;
}) {
  return (
    <div className="my-10 flex flex-row justify-around">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Button
        onClick={() => {
          void navigator.clipboard.writeText(
            window.location.href + '?' + getSerializedState(),
          );
        }}
      >
        Copy Link
      </Button>
    </div>
  );
}
