import { LocationMock } from "@jedmao/location";

export function mockLocation(url: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).location;
  window.location = new LocationMock(url);
}
