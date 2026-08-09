// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import NumberInput, {
  NumberDisplayOutput,
  NumberOutput,
} from '~/components/recalc/io/number';
import {
  Stateful,
  bySlot,
  layoutRoot,
  numberField,
  spyStateHook,
} from '~/testUtils';

type NumberInputProps = ComponentProps<typeof NumberInput>;
type NumberOutputProps = ComponentProps<typeof NumberOutput>;
type NumberDisplayOutputProps = ComponentProps<typeof NumberDisplayOutput>;

const LABEL = 'Spool Diameter';

/**
 * Renders with a spy setter so tests can assert the exact value handed back to
 * the state hook. `value` stands in for the first half of the state tuple.
 */
function renderNumber({
  value,
  ...props
}: Omit<NumberInputProps, 'stateHook'> & { value: number }) {
  const { stateHook, setValue } = spyStateHook(value);
  const { container, rerender } = render(
    <NumberInput stateHook={stateHook} {...props} />,
  );
  return { setValue, container, rerender, user: userEvent.setup() };
}

function renderStateful({
  initial,
  ...props
}: Omit<NumberInputProps, 'stateHook'> & { initial: number }) {
  const { container } = render(
    <Stateful
      initial={initial}
      render={(stateHook) => <NumberInput stateHook={stateHook} {...props} />}
    />,
  );
  return { container, user: userEvent.setup() };
}

/** The rendered `<label>`, which carries the visible text. */
function labelEl() {
  return screen.getByText(LABEL);
}

// RTL's automatic cleanup does not register because vitest runs without
// `globals: true`, and clearing innerHTML would leave the React root (and any
// portalled tooltip) mounted, so unmount explicitly.
afterEach(cleanup);

describe('NumberInput', () => {
  describe('label', () => {
    it('names the input with the label', () => {
      renderNumber({ value: 12, label: LABEL });
      expect(numberField(LABEL)).toBeTruthy();
    });

    it('points the label at the input', () => {
      renderNumber({ value: 12, label: LABEL });
      expect(labelEl().getAttribute('for')).toBe(numberField(LABEL).id);
    });
  });

  describe('displayed value', () => {
    it('shows the current value', () => {
      renderNumber({ value: 12, label: LABEL });
      expect(numberField(LABEL).value).toBe('12');
    });

    it('shows the new value after the value changes', () => {
      const { rerender } = renderNumber({ value: 12, label: LABEL });
      rerender(
        <NumberInput stateHook={spyStateHook(7).stateHook} label={LABEL} />,
      );
      expect(numberField(LABEL).value).toBe('7');
    });

    // An empty box means 0, so a value arriving from elsewhere has to be
    // adopted on the strength of the number alone -- the guard that protects an
    // in-progress edit must not swallow a genuine change.
    it('fills an emptied box when a new value arrives', async () => {
      const { rerender, user } = renderNumber({ value: 0, label: LABEL });
      await user.clear(numberField(LABEL));
      rerender(
        <NumberInput stateHook={spyStateHook(5).stateHook} label={LABEL} />,
      );
      expect(numberField(LABEL).value).toBe('5');
    });
  });

  // A calculation upstream can divide by zero and hand this input a NaN. NaN is
  // never equal to itself, so a value/text comparison written with `!==` would
  // re-render forever and take the page down with it.
  describe('a NaN value', () => {
    it('renders instead of looping', () => {
      renderNumber({ value: Number.NaN, label: LABEL });
      expect(numberField(LABEL)).toBeTruthy();
    });

    it('renders instead of looping with real state', () => {
      renderStateful({ initial: Number.NaN, label: LABEL });
      expect(numberField(LABEL)).toBeTruthy();
    });
  });

  // Writes are driven by events, not by an effect, so a NumberInput that is
  // merely mounted reports nothing -- matching every sibling io input. A setter
  // call here would mean a screen full of these inputs writes to shared state
  // on load, before the user has touched anything.
  describe('setter on mount', () => {
    it('does not call the setter on render', () => {
      const { setValue } = renderNumber({ value: 12, label: LABEL });
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter when the value is 0', () => {
      const { setValue } = renderNumber({ value: 0, label: LABEL });
      expect(setValue).not.toHaveBeenCalled();
    });
  });

  describe('typing', () => {
    it('passes the typed number to the setter', async () => {
      const { setValue, user } = renderNumber({ value: 0, label: LABEL });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '25');
      expect(setValue).toHaveBeenLastCalledWith(25);
    });

    it('passes a typed decimal to the setter', async () => {
      const { setValue, user } = renderNumber({ value: 0, label: LABEL });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '2.5');
      expect(setValue).toHaveBeenLastCalledWith(2.5);
    });

    it('shows the typed decimal in the box', async () => {
      const { user } = renderStateful({ initial: 0, label: LABEL });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '2.5');
      expect(numberField(LABEL).value).toBe('2.5');
    });

    // A lone "-" is not a valid number, so the field reports it as empty and
    // the value stays put until a digit follows -- no NaN reaches the setter.
    it('accepts a negative typed from scratch', async () => {
      const { user } = renderStateful({ initial: 0, label: LABEL });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '-3');
      expect(numberField(LABEL).value).toBe('-3');
    });

    // What a half-typed number looks like on screen ("2.", "2.50") is not
    // assertable here: a real browser keeps the raw keystrokes in a text buffer
    // behind a number field, and jsdom models no such buffer -- it reports the
    // sanitized number instead. Any expectation about those intermediate frames
    // would pin the environment rather than the component.
  });

  // An emptied box reads as 0 downstream, but the box itself stays empty: the
  // text the user is editing is never overwritten by a value that already means
  // the same thing. Otherwise clearing a field would immediately refill it with
  // "0" and the next keystroke would land after that zero.
  describe('empty field', () => {
    it('reports 0 to the setter when the box is cleared', async () => {
      const { setValue, user } = renderNumber({ value: 12, label: LABEL });
      await user.clear(numberField(LABEL));
      expect(setValue).toHaveBeenLastCalledWith(0);
    });

    it('stays empty when clearing does not change the value', async () => {
      const { user } = renderStateful({ initial: 0, label: LABEL });
      await user.clear(numberField(LABEL));
      expect(numberField(LABEL).value).toBe('');
    });

    it('stays empty when clearing does change the value', async () => {
      const { user } = renderStateful({ initial: 12, label: LABEL });
      await user.clear(numberField(LABEL));
      expect(numberField(LABEL).value).toBe('');
    });

    it('types cleanly into a box cleared of a previous value', async () => {
      const { user } = renderStateful({ initial: 12, label: LABEL });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '4');
      expect(numberField(LABEL).value).toBe('4');
    });
  });

  // The handler calls `e.preventDefault()`, but jsdom implements no native
  // number-input stepping for it to suppress, so the guard is not observable
  // here -- only the step it applies itself is.
  describe('arrow keys', () => {
    it('steps up by one', async () => {
      const { user } = renderStateful({ initial: 5, label: LABEL });
      await user.type(numberField(LABEL), '{ArrowUp}');
      expect(numberField(LABEL).value).toBe('6');
    });

    it('steps down by one', async () => {
      const { user } = renderStateful({ initial: 5, label: LABEL });
      await user.type(numberField(LABEL), '{ArrowDown}');
      expect(numberField(LABEL).value).toBe('4');
    });

    it('steps up by ten while shift is held', async () => {
      const { user } = renderStateful({ initial: 5, label: LABEL });
      await user.type(numberField(LABEL), '{Shift>}{ArrowUp}{/Shift}');
      expect(numberField(LABEL).value).toBe('15');
    });

    it('steps down by ten while shift is held', async () => {
      const { user } = renderStateful({ initial: 5, label: LABEL });
      await user.type(numberField(LABEL), '{Shift>}{ArrowDown}{/Shift}');
      expect(numberField(LABEL).value).toBe('-5');
    });

    it('steps below zero into negatives', async () => {
      const { user } = renderStateful({ initial: 0, label: LABEL });
      await user.type(numberField(LABEL), '{ArrowDown}');
      expect(numberField(LABEL).value).toBe('-1');
    });

    it('steps a decimal without rounding it', async () => {
      const { user } = renderStateful({ initial: 2.5, label: LABEL });
      await user.type(numberField(LABEL), '{ArrowUp}');
      expect(numberField(LABEL).value).toBe('3.5');
    });

    // `Number(proxyValue) || 0` -- an empty box steps from zero rather than
    // from NaN.
    it('steps up from zero when the box is empty', async () => {
      const { user } = renderStateful({ initial: 0, label: LABEL });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '{ArrowUp}');
      expect(numberField(LABEL).value).toBe('1');
    });

    it('passes the stepped value to the setter', async () => {
      const { setValue, user } = renderNumber({ value: 5, label: LABEL });
      await user.type(numberField(LABEL), '{ArrowUp}');
      expect(setValue).toHaveBeenLastCalledWith(6);
    });
  });

  describe('testId', () => {
    it('applies the testId to the input', () => {
      renderNumber({ value: 12, label: LABEL, testId: 'spoolDiameter' });
      expect(screen.getByTestId('spoolDiameter')).toBe(numberField(LABEL));
    });

    it('renders no data-testid when testId is omitted', () => {
      renderNumber({ value: 12, label: LABEL });
      expect(numberField(LABEL).hasAttribute('data-testid')).toBe(false);
    });
  });

  // jsdom has no layout, so the stacking direction is only observable through
  // the classes the component picks.
  describe('labelAbove', () => {
    it('lays the label beside the input by default', () => {
      const { container } = renderNumber({ value: 12, label: LABEL });
      expect(layoutRoot(container).classList.contains('flex-row')).toBe(true);
    });

    it('stacks the label above the input when set', () => {
      const { container } = renderNumber({
        value: 12,
        label: LABEL,
        labelAbove: true,
      });
      expect(layoutRoot(container).classList.contains('flex-col')).toBe(true);
    });

    it('spaces the label to the left of the input by default', () => {
      renderNumber({ value: 12, label: LABEL });
      expect(labelEl().classList.contains('mr-2')).toBe(true);
    });

    it('spaces the label above the input when set', () => {
      renderNumber({ value: 12, label: LABEL, labelAbove: true });
      expect(labelEl().classList.contains('mb-1')).toBe(true);
    });
  });

  describe('tooltip', () => {
    const TOOLTIP = 'Measured at the center of the wrap';

    it('shows no tooltip on hover when none is provided', async () => {
      const { user } = renderNumber({ value: 12, label: LABEL });
      await user.hover(labelEl());
      expect(bySlot('tooltip-content')).toBeNull();
    });

    it('does not render the tooltip text before hover', () => {
      renderNumber({ value: 12, label: LABEL, tooltip: TOOLTIP });
      expect(screen.queryByText(TOOLTIP)).toBeNull();
    });

    it('reveals the tooltip text on hover', async () => {
      const { user } = renderNumber({
        value: 12,
        label: LABEL,
        tooltip: TOOLTIP,
      });
      await user.hover(labelEl());
      expect(await screen.findByText(TOOLTIP)).toBeTruthy();
    });

    // The tooltip branch nests the label inside a TooltipTrigger button, which
    // must not come between the label and the field it names.
    it('still names the input when a tooltip is provided', () => {
      renderNumber({ value: 12, label: LABEL, tooltip: TOOLTIP });
      expect(numberField(LABEL)).toBeTruthy();
    });

    it('still accepts typing when a tooltip is provided', async () => {
      const { user } = renderStateful({
        initial: 0,
        label: LABEL,
        tooltip: TOOLTIP,
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '25');
      expect(numberField(LABEL).value).toBe('25');
    });
  });
});

describe('NumberOutput', () => {
  function renderOutput(props: NumberOutputProps) {
    const { container, rerender } = render(<NumberOutput {...props} />);
    return { container, rerender };
  }

  describe('label', () => {
    it('points the label at the input', () => {
      renderOutput({ state: 1.23456, label: LABEL });
      expect(labelEl().getAttribute('for')).toBe(numberField(LABEL).id);
    });

    it('uses the label as the placeholder', () => {
      renderOutput({ state: 1.23456, label: LABEL });
      expect(numberField(LABEL).getAttribute('placeholder')).toBe(LABEL);
    });
  });

  describe('rounding', () => {
    it('rounds to three decimals by default', () => {
      renderOutput({ state: 1.23456, label: LABEL });
      expect(numberField(LABEL).value).toBe('1.235');
    });

    it('rounds to the requested number of decimals', () => {
      renderOutput({ state: 1.23456, label: LABEL, roundTo: 1 });
      expect(numberField(LABEL).value).toBe('1.2');
    });

    it('pads a whole number out to the requested decimals', () => {
      renderOutput({ state: 2, label: LABEL });
      expect(numberField(LABEL).value).toBe('2.000');
    });
  });

  describe('updates', () => {
    it('shows the new value after the state changes', () => {
      const { rerender } = renderOutput({ state: 1.23456, label: LABEL });
      rerender(<NumberOutput state={9.87654} label={LABEL} />);
      expect(numberField(LABEL).value).toBe('9.877');
    });

    it('re-rounds after roundTo changes', () => {
      const { rerender } = renderOutput({ state: 1.23456, label: LABEL });
      rerender(<NumberOutput state={1.23456} label={LABEL} roundTo={1} />);
      expect(numberField(LABEL).value).toBe('1.2');
    });
  });

  it('disables the input', () => {
    renderOutput({ state: 1.23456, label: LABEL });
    expect(numberField(LABEL).disabled).toBe(true);
  });

  describe('testId', () => {
    it('applies the testId to the input', () => {
      renderOutput({ state: 1.23456, label: LABEL, testId: 'spoolDiameter' });
      expect(screen.getByTestId('spoolDiameter')).toBe(numberField(LABEL));
    });

    it('renders no data-testid when testId is omitted', () => {
      renderOutput({ state: 1.23456, label: LABEL });
      expect(numberField(LABEL).hasAttribute('data-testid')).toBe(false);
    });
  });
});

describe('NumberDisplayOutput', () => {
  function renderDisplay(props: NumberDisplayOutputProps) {
    const { container, rerender } = render(<NumberDisplayOutput {...props} />);
    return { container, rerender };
  }

  it('renders the label text', () => {
    renderDisplay({ state: 1.6, label: LABEL });
    expect(labelEl().textContent).toBe(LABEL);
  });

  describe('rounding', () => {
    // Unlike NumberOutput, this one defaults to whole numbers.
    it('rounds to a whole number by default', () => {
      renderDisplay({ state: 1.6, label: LABEL, testId: 'spoolDiameter' });
      expect(screen.getByTestId('spoolDiameter').textContent).toBe('2');
    });

    it('rounds to the requested number of decimals', () => {
      renderDisplay({
        state: 1.6,
        label: LABEL,
        roundTo: 2,
        testId: 'spoolDiameter',
      });
      expect(screen.getByTestId('spoolDiameter').textContent).toBe('1.60');
    });
  });

  it('shows the new value after the state changes', () => {
    const { rerender } = renderDisplay({
      state: 1.6,
      label: LABEL,
      testId: 'spoolDiameter',
    });
    rerender(
      <NumberDisplayOutput state={4.2} label={LABEL} testId="spoolDiameter" />,
    );
    expect(screen.getByTestId('spoolDiameter').textContent).toBe('4');
  });

  describe('testId', () => {
    // The label and the value are sibling spans; only the value carries the id.
    it('applies the testId to the value, not the label', () => {
      renderDisplay({ state: 1.6, label: LABEL, testId: 'spoolDiameter' });
      expect(screen.getByTestId('spoolDiameter').textContent).toBe('2');
    });

    it('renders no data-testid when testId is omitted', () => {
      const { container } = renderDisplay({ state: 1.6, label: LABEL });
      expect(container.querySelector('[data-testid]')).toBeNull();
    });
  });
});
