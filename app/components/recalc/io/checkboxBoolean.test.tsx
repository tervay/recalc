// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
  useState,
} from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CheckboxBooleanInput from '~/components/recalc/io/checkboxBoolean';

type CheckboxBooleanInputProps = ComponentProps<typeof CheckboxBooleanInput>;

const LABEL = '20DP';

/**
 * Renders with a spy setter so tests can assert the exact value handed back to
 * the state hook. `value` stands in for the first half of the state tuple.
 */
function renderCheckbox({
  value,
  ...props
}: Omit<CheckboxBooleanInputProps, 'stateHook'> & { value: boolean }) {
  const setValue = vi.fn<Dispatch<SetStateAction<boolean>>>();
  render(<CheckboxBooleanInput stateHook={[value, setValue]} {...props} />);
  return { setValue, user: userEvent.setup() };
}

function StatefulCheckbox({
  initial,
  ...props
}: Omit<CheckboxBooleanInputProps, 'stateHook'> & { initial: boolean }) {
  const stateHook = useState(initial);
  return <CheckboxBooleanInput stateHook={stateHook} {...props} />;
}

function renderStateful(props: ComponentProps<typeof StatefulCheckbox>) {
  render(<StatefulCheckbox {...props} />);
  return { user: userEvent.setup() };
}

/** The Base UI checkbox is a button; its checked state lives on `aria-checked`. */
function checkboxEl() {
  return screen.getByRole('checkbox', { name: LABEL });
}

function indicator() {
  return document.querySelector('[data-slot="checkbox-indicator"]');
}

// RTL's automatic cleanup does not register because vitest runs without
// `globals: true`, and clearing innerHTML would leave the React root mounted.
afterEach(cleanup);

describe('CheckboxBooleanInput', () => {
  describe('accessible name', () => {
    it('names the checkbox with the label', () => {
      renderCheckbox({ value: false, label: LABEL });
      expect(checkboxEl()).toBeTruthy();
    });

    it('renders the label text', () => {
      renderCheckbox({ value: false, label: LABEL });
      expect(screen.getByText(LABEL).textContent).toBe(LABEL);
    });
  });

  describe('checked state', () => {
    it('reports an unchecked box when the value is false', () => {
      renderCheckbox({ value: false, label: LABEL });
      expect(checkboxEl().getAttribute('aria-checked')).toBe('false');
    });

    it('reports a checked box when the value is true', () => {
      renderCheckbox({ value: true, label: LABEL });
      expect(checkboxEl().getAttribute('aria-checked')).toBe('true');
    });

    it('renders no check indicator while unchecked', () => {
      renderCheckbox({ value: false, label: LABEL });
      expect(indicator()).toBeNull();
    });

    it('renders the check indicator while checked', () => {
      renderCheckbox({ value: true, label: LABEL });
      expect(indicator()).toBeTruthy();
    });
  });

  describe('setter contract', () => {
    it('sets true when an unchecked box is clicked', async () => {
      const { setValue, user } = renderCheckbox({ value: false, label: LABEL });
      await user.click(checkboxEl());
      expect(setValue.mock.calls[0][0]).toBe(true);
    });

    it('sets false when a checked box is clicked', async () => {
      const { setValue, user } = renderCheckbox({ value: true, label: LABEL });
      await user.click(checkboxEl());
      expect(setValue.mock.calls[0][0]).toBe(false);
    });

    // The component narrows the primitive's callback with `checked === true`,
    // so the state hook only ever sees a plain boolean -- never an
    // indeterminate value, and never the primitive's extra event argument.
    it('passes the boolean alone, with no extra arguments', async () => {
      const { setValue, user } = renderCheckbox({ value: false, label: LABEL });
      await user.click(checkboxEl());
      expect(setValue).toHaveBeenCalledWith(true);
    });

    it('calls the setter exactly once per click', async () => {
      const { setValue, user } = renderCheckbox({ value: false, label: LABEL });
      await user.click(checkboxEl());
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    it('does not call the setter on render', () => {
      const { setValue } = renderCheckbox({ value: false, label: LABEL });
      expect(setValue).not.toHaveBeenCalled();
    });
  });

  describe('testId', () => {
    it('applies the testId to the checkbox', () => {
      renderCheckbox({ value: false, label: LABEL, testId: 'twentyDp' });
      expect(screen.getByTestId('twentyDp')).toBe(checkboxEl());
    });

    it('renders no data-testid when testId is omitted', () => {
      renderCheckbox({ value: false, label: LABEL });
      expect(checkboxEl().hasAttribute('data-testid')).toBe(false);
    });
  });

  describe('with real state', () => {
    it('becomes checked after one click', async () => {
      const { user } = renderStateful({ initial: false, label: LABEL });
      await user.click(checkboxEl());
      expect(checkboxEl().getAttribute('aria-checked')).toBe('true');
    });

    it('returns to unchecked after two clicks', async () => {
      const { user } = renderStateful({ initial: false, label: LABEL });
      await user.click(checkboxEl());
      await user.click(checkboxEl());
      expect(checkboxEl().getAttribute('aria-checked')).toBe('false');
    });
  });
});
