import { screen } from '@testing-library/react';
import { type UserEvent } from '@testing-library/user-event';
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

/**
 * The single element an io component renders, which carries its layout classes.
 * jsdom has no layout, so those classes are the only way to observe how the
 * component stacks its label against its field.
 */
export function layoutRoot(container: HTMLElement) {
  const root = container.firstElementChild;
  if (!root) throw new Error('the component rendered nothing');
  return root;
}

/**
 * A `type="number"` input, which maps to the spinbutton role. The io inputs tie
 * their label to the field with `useId`, so the label is its accessible name.
 */
export function numberField(name: string) {
  const el = screen.getByRole('spinbutton', { name });
  if (!(el instanceof HTMLInputElement)) {
    throw new Error('expected the spinbutton to be an <input>');
  }
  return el;
}

/**
 * The Base UI select trigger. It carries no accessible name -- the io
 * components label the field beside it, not the select -- so the role is the
 * only handle.
 */
export function selectTrigger() {
  return screen.getByRole('combobox');
}

/** Options only exist while the portalled popup is open. */
export function selectOptions() {
  return screen.queryAllByRole('option');
}

/**
 * Base UI wires up option labels and selection state in an effect after the
 * popup's first paint, so options are only queryable by name once settled.
 */
export function findSelectOption(name: string) {
  return screen.findByRole('option', { name });
}

/**
 * Opens the popup and waits for it. Base UI mounts the portal a frame after the
 * click, so reading the options straight afterwards races that mount.
 */
export async function openSelect(user: UserEvent) {
  await user.click(selectTrigger());
  return await screen.findAllByRole('option');
}

/** Opens the popup and picks the option carrying the given label. */
export async function chooseOption(user: UserEvent, name: string) {
  await user.click(selectTrigger());
  await user.click(await findSelectOption(name));
}
