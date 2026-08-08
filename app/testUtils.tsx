import {
  type ReactNode,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { vi } from 'vitest';

import type { StateHook } from '~/lib/types/common';

/**
 * A state hook whose setter is a spy, so tests can assert the exact value a
 * component hands back. `value` stands in for the first half of the tuple and
 * never changes -- use {@link Stateful} when the component needs to re-render.
 */
export function spyStateHook<T>(value: T) {
  const setValue = vi.fn<Dispatch<SetStateAction<T>>>();
  const stateHook: StateHook<T> = [value, setValue];
  return { stateHook, setValue };
}

/**
 * Gives a component a real `useState` hook. Render-prop rather than a generic
 * wrapper component so the child's own props stay type-checked at the call
 * site.
 */
export function Stateful<T>({
  initial,
  render,
}: {
  initial: T;
  render: (stateHook: StateHook<T>) => ReactNode;
}) {
  const stateHook = useState(initial);
  return render(stateHook);
}

/**
 * Base UI renders popups (tooltips, select content) through a portal, so they
 * live outside the render container and carry no queryable role. Their
 * `data-slot` is the stable handle.
 */
export function bySlot(slot: string) {
  return document.querySelector(`[data-slot="${slot}"]`);
}
