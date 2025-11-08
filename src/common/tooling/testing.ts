import { LocationMock } from "@jedmao/location";

export function mockLocation(url: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).location;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).location = new LocationMock(url);
}
