// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { afterEach, describe, expect, it, type Mock } from 'vitest';

import {
  MeasurementDisplayOutput,
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import Measurement from '~/lib/models/Measurement';
import {
  Stateful,
  bySlot,
  chooseOption,
  findSelectOption,
  layoutRoot,
  numberField,
  openSelect,
  selectOptions,
  selectTrigger,
  spyStateHook,
} from '~/testUtils';

type MeasurementInputProps = ComponentProps<typeof MeasurementInput>;
type MeasurementOutputProps = ComponentProps<typeof MeasurementOutput>;
type MeasurementDisplayOutputProps = ComponentProps<
  typeof MeasurementDisplayOutput
>;

const LABEL = 'Spool Diameter';

/**
 * One row per branch of `Measurement.choices`, so a kind added there without a
 * row here is visible. `other` is a second unit of the same kind, or the same
 * unit again for the kinds that offer only one.
 */
const KINDS: { kind: string; unit: string; other: string }[] = [
  { kind: 'length', unit: 'in', other: 'ft' },
  { kind: 'mass', unit: 'lbs', other: 'kg' },
  { kind: 'area', unit: 'in^2', other: 'm^2' },
  { kind: 'volume', unit: 'in^3', other: 'm^3' },
  { kind: 'speed', unit: 'ft/s', other: 'm/s' },
  { kind: 'time', unit: 's', other: 'ms' },
  { kind: 'time in hours', unit: 'hr', other: 'min' },
  { kind: 'pressure', unit: 'psi', other: 'Pa' },
  { kind: 'current', unit: 'A', other: 'A' },
  { kind: 'potential', unit: 'V', other: 'V' },
  { kind: 'resistance', unit: 'Ohm', other: 'Ohm' },
  { kind: 'energy', unit: 'J', other: 'N*m' },
  { kind: 'force', unit: 'N', other: 'lbf' },
  { kind: 'frequency', unit: 'Hz', other: 'Hz' },
  { kind: 'angle', unit: 'deg', other: 'rad' },
  { kind: 'angular velocity', unit: 'rpm', other: 'rpm' },
  { kind: 'power', unit: 'W', other: 'hp' },
  { kind: 'acceleration', unit: 'in/s2', other: 'm/s2' },
  // The branches `Measurement.choices` reaches only when `kind()` is undefined.
  { kind: 'moment of inertia', unit: 'in2*lbs', other: 'kg*m2' },
  { kind: 'linear kV', unit: 'V*s/m', other: 'V*s/in' },
  { kind: 'linear kA', unit: 'V*s^2/m', other: 'V*s^2/in' },
  { kind: 'angular kV', unit: 'V*s/rad', other: 'V*s/rotation' },
  { kind: 'angular kA', unit: 'V*s^2/rad', other: 'V*s^2/rotation' },
  { kind: 'linear kP', unit: 'V/m', other: 'V/in' },
  { kind: 'angular kP', unit: 'V/rad', other: 'V/rotation' },
  { kind: 'voltage ramp', unit: 'V/s', other: 'V/s' },
];

/** The kinds that offer somewhere to switch to. */
const MULTI_UNIT_KINDS = KINDS.filter(({ unit, other }) => unit !== other);

/** The kinds whose dropdown holds their only unit. */
const SINGLE_UNIT_KINDS = KINDS.filter(({ unit, other }) => unit === other);

/**
 * The number and the unit together, which is the pair every one of these
 * components actually decides on. Comparing whole `Measurement`s would compare
 * physical quantity instead, and call `12 in` and `1 ft` the same.
 */
function reading(m: Measurement) {
  return { scalar: m.scalar, unit: m.units() };
}

/** The last value handed to a spy setter, narrowed off the `SetStateAction`. */
function lastWrite(setValue: Mock) {
  const call = setValue.mock.calls.at(-1);
  if (call === undefined) throw new Error('the setter was never called');
  const [value] = call;
  if (!(value instanceof Measurement)) {
    throw new Error('expected the setter to receive a Measurement');
  }
  return value;
}

/**
 * Renders with a spy setter so tests can assert the exact value handed back to
 * the state hook. `value` stands in for the first half of the state tuple.
 */
function renderInput({
  value,
  ...props
}: Omit<MeasurementInputProps, 'stateHook'> & { value: Measurement }) {
  const { stateHook, setValue } = spyStateHook(value);
  const { container, rerender } = render(
    <MeasurementInput stateHook={stateHook} {...props} />,
  );
  return { setValue, container, rerender, user: userEvent.setup() };
}

function renderStatefulInput({
  initial,
  ...props
}: Omit<MeasurementInputProps, 'stateHook'> & { initial: Measurement }) {
  const { container } = render(
    <Stateful
      initial={initial}
      render={(stateHook) => (
        <MeasurementInput stateHook={stateHook} {...props} />
      )}
    />,
  );
  return { container, user: userEvent.setup() };
}

/** The rendered `<label>`, which carries the visible text. */
function labelEl() {
  return screen.getByText(LABEL);
}

// RTL's automatic cleanup does not register because vitest runs without
// `globals: true`, and clearing innerHTML would leave the React root (and the
// portalled popup) mounted, so unmount explicitly.
afterEach(cleanup);

describe('MeasurementInput', () => {
  describe('label', () => {
    it('names the input with the label', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(numberField(LABEL)).toBeTruthy();
    });

    it('points the label at the input', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(labelEl().getAttribute('for')).toBe(numberField(LABEL).id);
    });

    it('uses the label as the placeholder', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(numberField(LABEL).getAttribute('placeholder')).toBe(LABEL);
    });
  });

  describe('displayed value', () => {
    it('shows the current scalar', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(numberField(LABEL).value).toBe('12');
    });

    it('shows the current unit in the trigger', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(selectTrigger().textContent).toBe('in');
    });

    it('starts with the unit popup collapsed', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(selectTrigger().getAttribute('aria-expanded')).toBe('false');
    });
  });

  // Writes come from edits. A screen full of these inputs must not write to
  // shared state merely by mounting, which matches every sibling io input.
  describe('setter on mount', () => {
    it('does not call the setter on render', () => {
      const { setValue } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter when the scalar is 0', () => {
      const { setValue } = renderInput({
        value: new Measurement(0, 'in'),
        label: LABEL,
      });
      expect(setValue).not.toHaveBeenCalled();
    });

    // Swept because the mount write depends on the unit string surviving a
    // round trip through the `Measurement` constructor.
    it.each(KINDS)(
      'does not call the setter on render for a $kind measurement',
      ({ unit }) => {
        const { setValue } = renderInput({
          value: new Measurement(5, unit),
          label: LABEL,
        });
        expect(setValue).not.toHaveBeenCalled();
      },
    );
  });

  describe('typing', () => {
    it('passes the typed number to the setter', async () => {
      const { setValue, user } = renderInput({
        value: new Measurement(0, 'in'),
        label: LABEL,
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '25');
      expect(reading(lastWrite(setValue))).toEqual({ scalar: 25, unit: 'in' });
    });

    it('keeps the unit while the number changes', async () => {
      const { setValue, user } = renderInput({
        value: new Measurement(0, 'ft'),
        label: LABEL,
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '25');
      expect(reading(lastWrite(setValue))).toEqual({ scalar: 25, unit: 'ft' });
    });

    it('passes a typed decimal to the setter', async () => {
      const { setValue, user } = renderInput({
        value: new Measurement(0, 'in'),
        label: LABEL,
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '2.5');
      expect(reading(lastWrite(setValue))).toEqual({ scalar: 2.5, unit: 'in' });
    });

    it('shows the typed decimal in the box', async () => {
      const { user } = renderStatefulInput({
        initial: new Measurement(0, 'in'),
        label: LABEL,
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '2.5');
      expect(numberField(LABEL).value).toBe('2.5');
    });

    it('accepts a negative typed from scratch', async () => {
      const { user } = renderStatefulInput({
        initial: new Measurement(0, 'in'),
        label: LABEL,
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '-3');
      expect(numberField(LABEL).value).toBe('-3');
    });
  });

  // An emptied box reads as zero downstream, but the box itself stays empty:
  // the text the user is editing is never overwritten by a value that already
  // means the same thing.
  describe('empty field', () => {
    it('reports zero in the current unit when the box is cleared', async () => {
      const { setValue, user } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      await user.clear(numberField(LABEL));
      expect(reading(lastWrite(setValue))).toEqual({ scalar: 0, unit: 'in' });
    });

    it('stays empty after clearing', async () => {
      const { user } = renderStatefulInput({
        initial: new Measurement(12, 'in'),
        label: LABEL,
      });
      await user.clear(numberField(LABEL));
      expect(numberField(LABEL).value).toBe('');
    });

    it('types cleanly into a box cleared of a previous value', async () => {
      const { user } = renderStatefulInput({
        initial: new Measurement(12, 'in'),
        label: LABEL,
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '4');
      expect(numberField(LABEL).value).toBe('4');
    });
  });

  // The input re-interprets the number in the new unit rather than converting
  // it. Picking "ft" under a 12 means twelve feet, not one foot. The outputs
  // convert instead -- that contrast is deliberate.
  describe('changing the unit', () => {
    it('re-interprets the number rather than converting it', async () => {
      const { setValue, user } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      await chooseOption(user, 'ft');
      expect(reading(lastWrite(setValue))).toEqual({ scalar: 12, unit: 'ft' });
    });

    it('calls the setter exactly once per selection', async () => {
      const { setValue, user } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      await chooseOption(user, 'ft');
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    // Zero inches and zero feet are the same physical quantity, so a guard that
    // compares quantity swallows this write and leaves the parent holding "in"
    // while the dropdown reads "ft".
    it('reports a unit change made while the number is zero', async () => {
      const { setValue, user } = renderInput({
        value: new Measurement(0, 'in'),
        label: LABEL,
      });
      await chooseOption(user, 'ft');
      expect(reading(lastWrite(setValue))).toEqual({ scalar: 0, unit: 'ft' });
    });

    it('shows the chosen unit in the trigger', async () => {
      const { user } = renderStatefulInput({
        initial: new Measurement(12, 'in'),
        label: LABEL,
      });
      await chooseOption(user, 'ft');
      expect(selectTrigger().textContent).toBe('ft');
    });

    it('leaves the number alone in the box', async () => {
      const { user } = renderStatefulInput({
        initial: new Measurement(12, 'in'),
        label: LABEL,
      });
      await chooseOption(user, 'ft');
      expect(numberField(LABEL).value).toBe('12');
    });
  });

  describe('updates from the parent', () => {
    it('adopts a new number', () => {
      const { rerender } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      rerender(
        <MeasurementInput
          stateHook={spyStateHook(new Measurement(7, 'in')).stateHook}
          label={LABEL}
        />,
      );
      expect(numberField(LABEL).value).toBe('7');
    });

    // `1 ft` and `12 in` are the same quantity but not the same reading. The
    // parent asked for feet, so the box has to follow.
    it('adopts an equal quantity written in another unit', () => {
      const { rerender } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      rerender(
        <MeasurementInput
          stateHook={spyStateHook(new Measurement(1, 'ft')).stateHook}
          label={LABEL}
        />,
      );
      expect(numberField(LABEL).value).toBe('1');
    });

    it('adopts the unit of an equal quantity written in another unit', () => {
      const { rerender } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      rerender(
        <MeasurementInput
          stateHook={spyStateHook(new Measurement(1, 'ft')).stateHook}
          label={LABEL}
        />,
      );
      expect(selectTrigger().textContent).toBe('ft');
    });

    it('adopts a new unit at the same number', () => {
      const { rerender } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      rerender(
        <MeasurementInput
          stateHook={spyStateHook(new Measurement(12, 'ft')).stateHook}
          label={LABEL}
        />,
      );
      expect(selectTrigger().textContent).toBe('ft');
    });
  });

  describe('unit choices', () => {
    it('renders no options while closed', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(selectOptions()).toEqual([]);
    });

    // Guards against the dropdown drifting away from `Measurement.choices`,
    // which is the single source of truth for what a unit may become.
    it.each(KINDS)(
      'offers every choice for a $kind measurement, in order',
      async ({ unit }) => {
        const value = new Measurement(5, unit);
        const { user } = renderInput({ value, label: LABEL });
        const opened = await openSelect(user);
        expect(opened.map((option) => option.textContent)).toEqual(
          Measurement.choices(value),
        );
      },
    );

    // A unit the dropdown cannot select is a unit the user cannot get back to.
    it.each(KINDS)(
      'marks the current unit of a $kind measurement as selected',
      async ({ unit }) => {
        const value = new Measurement(5, unit);
        const { user } = renderInput({ value, label: LABEL });
        await openSelect(user);
        const option = await findSelectOption(unit);
        expect(option.getAttribute('aria-selected')).toBe('true');
      },
    );

    it.each(KINDS)(
      'shows the unit of a $kind measurement in the trigger',
      ({ unit }) => {
        renderInput({ value: new Measurement(5, unit), label: LABEL });
        expect(selectTrigger().textContent).toBe(unit);
      },
    );

    it.each(MULTI_UNIT_KINDS)(
      'hands the parent the chosen unit for a $kind measurement',
      async ({ unit, other }) => {
        const { setValue, user } = renderInput({
          value: new Measurement(5, unit),
          label: LABEL,
        });
        await chooseOption(user, other);
        expect(reading(lastWrite(setValue)).unit).toBe(
          new Measurement(5, other).units(),
        );
      },
    );

    it.each(SINGLE_UNIT_KINDS)(
      'offers a $kind measurement its one unit and nothing else',
      async ({ unit }) => {
        const { user } = renderInput({
          value: new Measurement(5, unit),
          label: LABEL,
        });
        const opened = await openSelect(user);
        expect(opened.length).toBe(1);
      },
    );

    it('offers no options for a unitless measurement', async () => {
      const { user } = renderInput({ value: new Measurement(5), label: LABEL });
      await user.click(selectTrigger());
      expect(selectOptions()).toEqual([]);
    });
  });

  describe('disabled', () => {
    it('disables the input when the predicate is true', () => {
      renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        disabled: () => true,
      });
      expect(numberField(LABEL).disabled).toBe(true);
    });

    it('leaves the input enabled when the predicate is false', () => {
      renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        disabled: () => false,
      });
      expect(numberField(LABEL).disabled).toBe(false);
    });

    it('leaves the input enabled when no predicate is given', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(numberField(LABEL).disabled).toBe(false);
    });

    it('does not write when a disabled input is typed into', async () => {
      const { setValue, user } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        disabled: () => true,
      });
      await user.type(numberField(LABEL), '5');
      expect(setValue).not.toHaveBeenCalled();
    });
  });

  describe('testId', () => {
    it('applies the testId to the input', () => {
      renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        testId: 'spoolDiameter',
      });
      expect(screen.getByTestId('spoolDiameter')).toBe(numberField(LABEL));
    });

    it('applies a prefixed testId to the unit trigger', () => {
      renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        testId: 'spoolDiameter',
      });
      expect(screen.getByTestId('selectspoolDiameter')).toBe(selectTrigger());
    });

    it('renders no data-testid on the input when testId is omitted', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(numberField(LABEL).hasAttribute('data-testid')).toBe(false);
    });

    it('renders no data-testid on the trigger when testId is omitted', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(selectTrigger().hasAttribute('data-testid')).toBe(false);
    });
  });

  // jsdom has no layout, so the stacking direction is only observable through
  // the classes the component picks.
  describe('labelAbove', () => {
    it('lays the label beside the row by default', () => {
      const { container } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      expect(layoutRoot(container).classList.contains('flex-row')).toBe(true);
    });

    it('stacks the label above the row when set', () => {
      const { container } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        labelAbove: true,
      });
      expect(layoutRoot(container).classList.contains('flex-col')).toBe(true);
    });

    it('spaces the label to the left of the row by default', () => {
      renderInput({ value: new Measurement(12, 'in'), label: LABEL });
      expect(labelEl().classList.contains('mr-2')).toBe(true);
    });

    it('spaces the label above the row when set', () => {
      renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        labelAbove: true,
      });
      expect(labelEl().classList.contains('mb-1')).toBe(true);
    });
  });

  describe('tooltip', () => {
    const TOOLTIP = 'Measured at the center of the wrap';

    it('shows no tooltip on hover when none is provided', async () => {
      const { user } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
      });
      await user.hover(labelEl());
      expect(bySlot('tooltip-content')).toBeNull();
    });

    it('does not render the tooltip text before hover', () => {
      renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        tooltip: TOOLTIP,
      });
      expect(screen.queryByText(TOOLTIP)).toBeNull();
    });

    it('reveals the tooltip text on hover', async () => {
      const { user } = renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        tooltip: TOOLTIP,
      });
      await user.hover(labelEl());
      expect(await screen.findByText(TOOLTIP)).toBeTruthy();
    });

    // The tooltip branch nests the label inside a TooltipTrigger button, which
    // must not come between the label and the field it names.
    it('still names the input when a tooltip is provided', () => {
      renderInput({
        value: new Measurement(12, 'in'),
        label: LABEL,
        tooltip: TOOLTIP,
      });
      expect(numberField(LABEL)).toBeTruthy();
    });

    it('still accepts typing when a tooltip is provided', async () => {
      const { user } = renderStatefulInput({
        initial: new Measurement(0, 'in'),
        label: LABEL,
        tooltip: TOOLTIP,
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '25');
      expect(numberField(LABEL).value).toBe('25');
    });
  });
});

describe('MeasurementOutput', () => {
  function renderOutput(props: MeasurementOutputProps) {
    const { container, rerender } = render(<MeasurementOutput {...props} />);
    return { container, rerender, user: userEvent.setup() };
  }

  describe('label', () => {
    it('points the label at the input', () => {
      renderOutput({ state: new Measurement(1.23456, 'in'), label: LABEL });
      expect(labelEl().getAttribute('for')).toBe(numberField(LABEL).id);
    });

    it('uses the label as the placeholder', () => {
      renderOutput({ state: new Measurement(1.23456, 'in'), label: LABEL });
      expect(numberField(LABEL).getAttribute('placeholder')).toBe(LABEL);
    });
  });

  it('disables the input', () => {
    renderOutput({ state: new Measurement(1.23456, 'in'), label: LABEL });
    expect(numberField(LABEL).disabled).toBe(true);
  });

  describe('rounding', () => {
    it('rounds to three decimals by default', () => {
      renderOutput({ state: new Measurement(1.23456, 'in'), label: LABEL });
      expect(numberField(LABEL).value).toBe('1.235');
    });

    it('rounds to the requested number of decimals', () => {
      renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
        roundTo: 1,
      });
      expect(numberField(LABEL).value).toBe('1.2');
    });

    it('pads a whole number out to the requested decimals', () => {
      renderOutput({ state: new Measurement(2, 'in'), label: LABEL });
      expect(numberField(LABEL).value).toBe('2.000');
    });
  });

  describe('defaultUnit', () => {
    it('shows the measurement in the requested unit', () => {
      renderOutput({
        state: new Measurement(12, 'in'),
        label: LABEL,
        defaultUnit: 'ft',
      });
      expect(numberField(LABEL).value).toBe('1.000');
    });

    it('shows the requested unit in the trigger', () => {
      renderOutput({
        state: new Measurement(12, 'in'),
        label: LABEL,
        defaultUnit: 'ft',
      });
      expect(selectTrigger().textContent).toBe('ft');
    });

    it("falls back to the measurement's own unit", () => {
      renderOutput({ state: new Measurement(12, 'in'), label: LABEL });
      expect(selectTrigger().textContent).toBe('in');
    });
  });

  // The outputs convert. This is the deliberate contrast with the input, which
  // re-interprets the number under the new unit.
  describe('changing the unit', () => {
    it('converts the displayed value', async () => {
      const { user } = renderOutput({
        state: new Measurement(12, 'in'),
        label: LABEL,
      });
      await chooseOption(user, 'ft');
      expect(numberField(LABEL).value).toBe('1.000');
    });

    it.each(MULTI_UNIT_KINDS)(
      'converts a $kind measurement into the chosen unit',
      async ({ unit, other }) => {
        const state = new Measurement(5, unit);
        const { user } = renderOutput({ state, label: LABEL });
        await chooseOption(user, other);
        expect(numberField(LABEL).value).toBe(
          state.to(other).scalar.toFixed(3),
        );
      },
    );

    it.each(KINDS)(
      'offers every choice for a $kind measurement, in order',
      async ({ unit }) => {
        const state = new Measurement(5, unit);
        const { user } = renderOutput({ state, label: LABEL });
        const opened = await openSelect(user);
        expect(opened.map((option) => option.textContent)).toEqual(
          Measurement.choices(state),
        );
      },
    );
  });

  describe('updates', () => {
    it('shows the new value after the state changes', () => {
      const { rerender } = renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
      });
      rerender(
        <MeasurementOutput
          state={new Measurement(9.87654, 'in')}
          label={LABEL}
        />,
      );
      expect(numberField(LABEL).value).toBe('9.877');
    });

    it('re-rounds after roundTo changes', () => {
      const { rerender } = renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
      });
      rerender(
        <MeasurementOutput
          state={new Measurement(1.23456, 'in')}
          label={LABEL}
          roundTo={1}
        />,
      );
      expect(numberField(LABEL).value).toBe('1.2');
    });

    it('keeps the chosen unit when the state changes', async () => {
      const { rerender, user } = renderOutput({
        state: new Measurement(12, 'in'),
        label: LABEL,
      });
      await chooseOption(user, 'ft');
      rerender(
        <MeasurementOutput state={new Measurement(24, 'in')} label={LABEL} />,
      );
      expect(numberField(LABEL).value).toBe('2.000');
    });
  });

  describe('testId', () => {
    it('applies the testId to the input', () => {
      renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
        testId: 'spoolDiameter',
      });
      expect(screen.getByTestId('spoolDiameter')).toBe(numberField(LABEL));
    });

    it('applies a prefixed testId to the unit trigger', () => {
      renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
        testId: 'spoolDiameter',
      });
      expect(screen.getByTestId('selectspoolDiameter')).toBe(selectTrigger());
    });

    it('renders no data-testid on the input when testId is omitted', () => {
      renderOutput({ state: new Measurement(1.23456, 'in'), label: LABEL });
      expect(numberField(LABEL).hasAttribute('data-testid')).toBe(false);
    });
  });

  describe('labelAbove', () => {
    it('lays the label beside the row by default', () => {
      const { container } = renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
      });
      expect(layoutRoot(container).classList.contains('flex-row')).toBe(true);
    });

    it('stacks the label above the row when set', () => {
      const { container } = renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
        labelAbove: true,
      });
      expect(layoutRoot(container).classList.contains('flex-col')).toBe(true);
    });
  });

  describe('tooltip', () => {
    const TOOLTIP = 'Derived from the ratio and the spool';

    it('does not render the tooltip text before hover', () => {
      renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
        tooltip: TOOLTIP,
      });
      expect(screen.queryByText(TOOLTIP)).toBeNull();
    });

    it('reveals the tooltip text on hover', async () => {
      const { user } = renderOutput({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
        tooltip: TOOLTIP,
      });
      await user.hover(labelEl());
      expect(await screen.findByText(TOOLTIP)).toBeTruthy();
    });
  });
});

describe('MeasurementDisplayOutput', () => {
  const TEST_ID = 'spoolDiameter';

  function renderDisplay(props: MeasurementDisplayOutputProps) {
    const { container, rerender } = render(
      <MeasurementDisplayOutput {...props} />,
    );
    return { container, rerender, user: userEvent.setup() };
  }

  /** The value lives in a span, not an input, so there is no role to query. */
  function value() {
    return screen.getByTestId(TEST_ID);
  }

  it('renders the label text', () => {
    renderDisplay({ state: new Measurement(1.6, 'in'), label: LABEL });
    expect(labelEl().textContent).toBe(LABEL);
  });

  describe('rounding', () => {
    // Unlike NumberDisplayOutput, which defaults to whole numbers.
    it('rounds to three decimals by default', () => {
      renderDisplay({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
        testId: TEST_ID,
      });
      expect(value().textContent).toBe('1.235');
    });

    it('rounds to the requested number of decimals', () => {
      renderDisplay({
        state: new Measurement(1.23456, 'in'),
        label: LABEL,
        roundTo: 1,
        testId: TEST_ID,
      });
      expect(value().textContent).toBe('1.2');
    });
  });

  describe('defaultUnit', () => {
    it('shows the measurement in the requested unit', () => {
      renderDisplay({
        state: new Measurement(12, 'in'),
        label: LABEL,
        defaultUnit: 'ft',
        testId: TEST_ID,
      });
      expect(value().textContent).toBe('1.000');
    });

    it("falls back to the measurement's own unit", () => {
      renderDisplay({
        state: new Measurement(12, 'in'),
        label: LABEL,
        testId: TEST_ID,
      });
      expect(selectTrigger().textContent).toBe('in');
    });
  });

  describe('changing the unit', () => {
    it('converts the displayed value', async () => {
      const { user } = renderDisplay({
        state: new Measurement(12, 'in'),
        label: LABEL,
        testId: TEST_ID,
      });
      await chooseOption(user, 'ft');
      expect(value().textContent).toBe('1.000');
    });

    it('shows the chosen unit in the trigger', async () => {
      const { user } = renderDisplay({
        state: new Measurement(12, 'in'),
        label: LABEL,
        testId: TEST_ID,
      });
      await chooseOption(user, 'ft');
      expect(selectTrigger().textContent).toBe('ft');
    });
  });

  it('shows the new value after the state changes', () => {
    const { rerender } = renderDisplay({
      state: new Measurement(1.6, 'in'),
      label: LABEL,
      testId: TEST_ID,
    });
    rerender(
      <MeasurementDisplayOutput
        state={new Measurement(4.2, 'in')}
        label={LABEL}
        testId={TEST_ID}
      />,
    );
    expect(value().textContent).toBe('4.200');
  });

  describe('testId', () => {
    it('applies the testId to the value, not the label', () => {
      renderDisplay({
        state: new Measurement(1.6, 'in'),
        label: LABEL,
        testId: TEST_ID,
      });
      expect(value().textContent).toBe('1.600');
    });

    it('applies a prefixed testId to the unit trigger', () => {
      renderDisplay({
        state: new Measurement(1.6, 'in'),
        label: LABEL,
        testId: TEST_ID,
      });
      expect(screen.getByTestId(`select${TEST_ID}`)).toBe(selectTrigger());
    });

    it('renders no data-testid when testId is omitted', () => {
      const { container } = renderDisplay({
        state: new Measurement(1.6, 'in'),
        label: LABEL,
      });
      expect(container.querySelector('[data-testid]')).toBeNull();
    });
  });

  // This component wraps the whole card in the trigger rather than just the
  // label, so hovering anywhere on the card has to reveal the tooltip.
  describe('tooltip', () => {
    const TOOLTIP = 'Derived from the ratio and the spool';

    it('shows no tooltip on hover when none is provided', async () => {
      const { user } = renderDisplay({
        state: new Measurement(1.6, 'in'),
        label: LABEL,
        testId: TEST_ID,
      });
      await user.hover(value());
      expect(bySlot('tooltip-content')).toBeNull();
    });

    it('does not render the tooltip text before hover', () => {
      renderDisplay({
        state: new Measurement(1.6, 'in'),
        label: LABEL,
        testId: TEST_ID,
        tooltip: TOOLTIP,
      });
      expect(screen.queryByText(TOOLTIP)).toBeNull();
    });

    it('reveals the tooltip text when the value is hovered', async () => {
      const { user } = renderDisplay({
        state: new Measurement(1.6, 'in'),
        label: LABEL,
        testId: TEST_ID,
        tooltip: TOOLTIP,
      });
      await user.hover(value());
      expect(await screen.findByText(TOOLTIP)).toBeTruthy();
    });

    it('still shows the value when a tooltip is provided', () => {
      renderDisplay({
        state: new Measurement(1.6, 'in'),
        label: LABEL,
        testId: TEST_ID,
        tooltip: TOOLTIP,
      });
      expect(value().textContent).toBe('1.600');
    });
  });
});
