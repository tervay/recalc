// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import BooleanInput from '~/components/recalc/io/boolean';
import { Stateful, bySlot, spyStateHook } from '~/testUtils';

type BooleanInputProps = ComponentProps<typeof BooleanInput>;

const LABEL = 'Allow Half Links';

/**
 * Renders with a spy setter so tests can assert the exact value handed back to
 * the state hook. `value` stands in for the first half of the state tuple.
 */
function renderBoolean({
  value,
  ...props
}: Omit<BooleanInputProps, 'stateHook'> & { value: boolean }) {
  const { stateHook, setValue } = spyStateHook(value);
  render(<BooleanInput stateHook={stateHook} {...props} />);
  return { setValue, user: userEvent.setup() };
}

function renderStateful({
  initial,
  ...props
}: Omit<BooleanInputProps, 'stateHook'> & { initial: boolean }) {
  render(
    <Stateful
      initial={initial}
      render={(stateHook) => <BooleanInput stateHook={stateHook} {...props} />}
    />,
  );
  return { user: userEvent.setup() };
}

/** The Base UI switch is a button; its checked state lives on `aria-checked`. */
function switchEl() {
  return screen.getByRole('switch', { name: LABEL });
}

/** The rendered `<label>`, which carries the visible text. */
function labelEl() {
  return screen.getByText(LABEL);
}

function precedes(first: Element, second: Element) {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

// RTL's automatic cleanup does not register because vitest runs without
// `globals: true`, and clearing innerHTML would leave the React root (and any
// portalled tooltip) mounted, so unmount explicitly.
afterEach(cleanup);

describe('BooleanInput', () => {
  describe('accessible name', () => {
    it('names the switch with the label', () => {
      renderBoolean({ value: false, label: LABEL });
      expect(switchEl()).toBeTruthy();
    });

    it('renders the label text', () => {
      renderBoolean({ value: false, label: LABEL });
      expect(labelEl().textContent).toBe(LABEL);
    });
  });

  describe('checked state', () => {
    it('reports an unchecked switch when the value is false', () => {
      renderBoolean({ value: false, label: LABEL });
      expect(switchEl().getAttribute('aria-checked')).toBe('false');
    });

    it('reports a checked switch when the value is true', () => {
      renderBoolean({ value: true, label: LABEL });
      expect(switchEl().getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('setter contract', () => {
    it('sets true when an unchecked switch is clicked', async () => {
      const { setValue, user } = renderBoolean({ value: false, label: LABEL });
      await user.click(switchEl());
      expect(setValue.mock.calls[0][0]).toBe(true);
    });

    it('sets false when a checked switch is clicked', async () => {
      const { setValue, user } = renderBoolean({ value: true, label: LABEL });
      await user.click(switchEl());
      expect(setValue.mock.calls[0][0]).toBe(false);
    });

    it('calls the setter exactly once per click', async () => {
      const { setValue, user } = renderBoolean({ value: false, label: LABEL });
      await user.click(switchEl());
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    it('does not call the setter on render', () => {
      const { setValue } = renderBoolean({ value: false, label: LABEL });
      expect(setValue).not.toHaveBeenCalled();
    });
  });

  describe('testId', () => {
    it('applies the testId to the switch', () => {
      renderBoolean({ value: false, label: LABEL, testId: 'enableCustomBelt' });
      expect(screen.getByTestId('enableCustomBelt')).toBe(switchEl());
    });

    it('renders no data-testid when testId is omitted', () => {
      renderBoolean({ value: false, label: LABEL });
      expect(switchEl().hasAttribute('data-testid')).toBe(false);
    });
  });

  describe('with real state', () => {
    it('becomes checked after one click', async () => {
      const { user } = renderStateful({ initial: false, label: LABEL });
      await user.click(switchEl());
      expect(switchEl().getAttribute('aria-checked')).toBe('true');
    });

    it('returns to unchecked after two clicks', async () => {
      const { user } = renderStateful({ initial: false, label: LABEL });
      await user.click(switchEl());
      await user.click(switchEl());
      expect(switchEl().getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('labelAbove layout', () => {
    it('renders the switch before the label by default', () => {
      renderBoolean({ value: false, label: LABEL });
      expect(precedes(switchEl(), labelEl())).toBe(true);
    });

    it('renders the label before the switch when labelAbove is set', () => {
      renderBoolean({ value: false, label: LABEL, labelAbove: true });
      expect(precedes(labelEl(), switchEl())).toBe(true);
    });

    it('still names the switch when labelAbove is set', () => {
      renderBoolean({ value: false, label: LABEL, labelAbove: true });
      expect(switchEl()).toBeTruthy();
    });

    it('still toggles when labelAbove is set', async () => {
      const { user } = renderStateful({
        initial: false,
        label: LABEL,
        labelAbove: true,
      });
      await user.click(switchEl());
      expect(switchEl().getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('tooltip', () => {
    const TOOLTIP = 'Half links weaken the chain';

    it('shows no tooltip on hover when none is provided', async () => {
      const { user } = renderBoolean({ value: false, label: LABEL });
      await user.hover(labelEl());
      expect(bySlot('tooltip-content')).toBeNull();
    });

    it('does not render the tooltip text before hover', () => {
      renderBoolean({ value: false, label: LABEL, tooltip: TOOLTIP });
      expect(screen.queryByText(TOOLTIP)).toBeNull();
    });

    it('reveals the tooltip text on hover', async () => {
      const { user } = renderBoolean({
        value: false,
        label: LABEL,
        tooltip: TOOLTIP,
      });
      await user.hover(labelEl());
      expect(await screen.findByText(TOOLTIP)).toBeTruthy();
    });

    it('still names the switch when a tooltip is provided', () => {
      renderBoolean({ value: false, label: LABEL, tooltip: TOOLTIP });
      expect(switchEl()).toBeTruthy();
    });

    it('still toggles when a tooltip is provided', async () => {
      const { user } = renderStateful({
        initial: false,
        label: LABEL,
        tooltip: TOOLTIP,
      });
      await user.click(switchEl());
      expect(switchEl().getAttribute('aria-checked')).toBe('true');
    });
  });
});
