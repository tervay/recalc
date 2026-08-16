// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { afterEach, describe, expect, it, type Mock } from 'vitest';

import { MotorInput, MotorNameSelect } from '~/components/recalc/io/motor';
import Motor, { ALL_MOTORS } from '~/lib/models/Motor';
import {
  Stateful,
  chooseOption,
  findSelectOption,
  layoutRoot,
  numberField,
  openSelect,
  selectOptions,
  selectTrigger,
  spyStateHook,
} from '~/testUtils';

type MotorInputProps = ComponentProps<typeof MotorInput>;
type MotorNameSelectProps = ComponentProps<typeof MotorNameSelect>;

/** MotorInput hardcodes its label, so it is also the field's accessible name. */
const LABEL = 'Motor';

/**
 * Every motor, in the order the two selectors present them: grouped by
 * intended program, and in `ALL_MOTORS` declaration order within a group.
 * Written out rather than derived, so adding a motor fails here and has to be
 * acknowledged -- deriving it with the component's own filter would assert
 * nothing. Note `Snowblower` is declared among the FTC motors but is an FRC
 * one, so grouping moves it to the end of the FRC block.
 */
const MOTOR_NAMES = [
  // FRC
  'Kraken X60',
  'Kraken X60 (FOC)',
  'NEO Vortex',
  'NEO 2.0',
  'NEO',
  'Kraken X44',
  'Kraken X44 (FOC)',
  'Falcon 500',
  'Falcon 500 (FOC)',
  'Minion',
  'Minion (Adv Hall)',
  'Thrifty Pulsar',
  'NEO 550',
  '775pro',
  '775 RedLine',
  'CIM',
  'MiniCIM',
  'BAG',
  'AM-9015',
  'BaneBots 550',
  'Snowblower',
  // FTC
  'NeveRest',
  'HD Hex',
  'Core Hex',
  'Modern Robotics',
  // Other
  'V5 Smart Motor (Red)',
];

/** One motor per group, to prove the grouping does not break selection. */
const ONE_PER_GROUP = [
  { group: 'FRC', name: 'Falcon 500' },
  { group: 'FTC', name: 'NeveRest' },
  { group: 'Other', name: 'V5 Smart Motor (Red)' },
];

const CURRENT = 'NEO';
const OTHER = 'Falcon 500';

/**
 * The name and the count together, which is all a Motor carries that this
 * component decides. Comparing whole Motors would compare by `eq`, which
 * ignores quantity and would call a 2x NEO and a 4x NEO the same.
 */
function reading(m: Motor) {
  return { name: m.identifier, quantity: m.quantity };
}

/** The last value handed to a spy setter, narrowed off the `SetStateAction`. */
function lastWrite(setValue: Mock) {
  const call = setValue.mock.calls.at(-1);
  if (call === undefined) throw new Error('the setter was never called');
  const [value] = call;
  if (!(value instanceof Motor)) {
    throw new Error('expected the setter to receive a Motor');
  }
  return value;
}

/** Popup contents are portalled, so they live outside the render container. */
function allBySlot(slot: string) {
  return Array.from(document.querySelectorAll(`[data-slot="${slot}"]`));
}

/**
 * Renders with a spy setter so tests can assert the exact value handed back to
 * the state hook. `value` stands in for the first half of the state tuple.
 */
function renderInput({
  value,
  ...props
}: Omit<MotorInputProps, 'stateHook'> & { value: Motor }) {
  const { stateHook, setValue } = spyStateHook(value);
  const { container, rerender } = render(
    <MotorInput stateHook={stateHook} {...props} />,
  );
  return { setValue, container, rerender, user: userEvent.setup() };
}

function renderStatefulInput({
  initial,
  ...props
}: Omit<MotorInputProps, 'stateHook'> & { initial: Motor }) {
  const { container } = render(
    <Stateful
      initial={initial}
      render={(stateHook) => <MotorInput stateHook={stateHook} {...props} />}
    />,
  );
  return { container, user: userEvent.setup() };
}

// RTL's automatic cleanup does not register because vitest runs without
// `globals: true`, and clearing innerHTML would leave the React root (and the
// portalled popup) mounted, so unmount explicitly.
afterEach(cleanup);

describe('MotorInput', () => {
  describe('label', () => {
    it('names the input with the label', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(numberField(LABEL)).toBeTruthy();
    });

    it('points the label at the input', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(screen.getByText(LABEL).getAttribute('for')).toBe(
        numberField(LABEL).id,
      );
    });
  });

  describe('displayed value', () => {
    it('shows the current quantity', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(numberField(LABEL).value).toBe('2');
    });

    it('shows the current motor in the trigger', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(selectTrigger().textContent).toBe(CURRENT);
    });

    it('starts with the motor popup collapsed', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(selectTrigger().getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('options', () => {
    it('renders no options while closed', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(selectOptions()).toEqual([]);
    });

    it('offers every motor, grouped by program and in declaration order', async () => {
      const { user } = renderInput({ value: Motor.NEO(2) });
      const opened = await openSelect(user);
      expect(opened.map((option) => option.textContent)).toEqual(MOTOR_NAMES);
    });

    // Guards the list above against a motor being added to ALL_MOTORS and
    // silently going unlisted here.
    it('offers as many options as there are motors', async () => {
      const { user } = renderInput({ value: Motor.NEO(2) });
      const opened = await openSelect(user);
      expect(opened.length).toBe(ALL_MOTORS.length);
    });

    it('heads each group with its program', async () => {
      const { user } = renderInput({ value: Motor.NEO(2) });
      await openSelect(user);
      expect(
        allBySlot('select-label').map((label) => label.textContent),
      ).toEqual(['FRC', 'FTC', 'Other']);
    });

    // Separators go between groups, not before them, so three groups take two.
    it('rules a line between the groups', async () => {
      const { user } = renderInput({ value: Motor.NEO(2) });
      await openSelect(user);
      expect(allBySlot('select-separator').length).toBe(2);
    });

    it('marks the current motor as selected', async () => {
      const { user } = renderInput({ value: Motor.NEO(2) });
      await user.click(selectTrigger());
      const option = await findSelectOption(CURRENT);
      expect(option.getAttribute('aria-selected')).toBe('true');
    });

    it('marks no other motor as selected', async () => {
      const { user } = renderInput({ value: Motor.NEO(2) });
      await user.click(selectTrigger());
      const current = await findSelectOption(CURRENT);
      const selected = selectOptions().filter(
        (option) => option.getAttribute('aria-selected') === 'true',
      );
      expect(selected).toEqual([current]);
    });
  });

  // Writes come from edits. A screen full of these inputs must not write to
  // shared state merely by mounting, which matches every sibling io input.
  describe('setter on mount', () => {
    it('does not call the setter on render', () => {
      const { setValue } = renderInput({ value: Motor.NEO(2) });
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter when the quantity is 0', () => {
      const { setValue } = renderInput({ value: Motor.NEO(0) });
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter merely on opening', async () => {
      const { setValue, user } = renderInput({ value: Motor.NEO(2) });
      await user.click(selectTrigger());
      expect(setValue).not.toHaveBeenCalled();
    });
  });

  describe('choosing a motor', () => {
    it('passes the chosen motor to the setter', async () => {
      const { setValue, user } = renderInput({ value: Motor.NEO(2) });
      await chooseOption(user, OTHER);
      expect(reading(lastWrite(setValue))).toEqual({
        name: OTHER,
        quantity: 2,
      });
    });

    it('calls the setter exactly once per selection', async () => {
      const { setValue, user } = renderInput({ value: Motor.NEO(2) });
      await chooseOption(user, OTHER);
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    // Re-picking the motor already in state changes nothing, so the guarded
    // effect has nothing to report.
    it('does not call the setter when the current motor is re-selected', async () => {
      const { setValue, user } = renderInput({ value: Motor.NEO(2) });
      await chooseOption(user, CURRENT);
      expect(setValue).not.toHaveBeenCalled();
    });

    it.each(ONE_PER_GROUP)(
      'passes a $group motor to the setter',
      async ({ name }) => {
        const { setValue, user } = renderInput({ value: Motor.NEO(2) });
        await chooseOption(user, name);
        expect(reading(lastWrite(setValue))).toEqual({ name, quantity: 2 });
      },
    );
  });

  describe('quantity', () => {
    it('passes the typed quantity to the setter', async () => {
      const { setValue, user } = renderInput({ value: Motor.NEO(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '3');
      expect(reading(lastWrite(setValue))).toEqual({
        name: CURRENT,
        quantity: 3,
      });
    });

    it('keeps the motor while the quantity changes', async () => {
      const { setValue, user } = renderInput({ value: Motor.Falcon500(1) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '4');
      expect(lastWrite(setValue).identifier).toBe('Falcon 500');
    });

    it('reports 0 to the setter when the box is cleared', async () => {
      const { setValue, user } = renderInput({ value: Motor.NEO(2) });
      await user.clear(numberField(LABEL));
      expect(lastWrite(setValue).quantity).toBe(0);
    });

    // "0" is treated as an unfinished edit, the same as an empty box.
    it('reports 0 to the setter when a zero is typed', async () => {
      const { setValue, user } = renderInput({ value: Motor.NEO(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '0');
      expect(lastWrite(setValue).quantity).toBe(0);
    });

    // An emptied box reads as 0 downstream, but the box itself stays empty:
    // the parent echoes that 0 straight back, and re-adopting it would refill
    // the box so the next keystroke landed after a zero.
    it('leaves the box empty after clearing it', async () => {
      const { user } = renderStatefulInput({ initial: Motor.NEO(2) });
      await user.clear(numberField(LABEL));
      expect(numberField(LABEL).value).toBe('');
    });

    it('types cleanly into a box cleared of a previous quantity', async () => {
      const { user } = renderStatefulInput({ initial: Motor.NEO(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '4');
      expect(numberField(LABEL).value).toBe('4');
    });
  });

  // A negative motor count is meaningless, so the browser is told never to
  // offer one.
  describe('min', () => {
    it('rejects a quantity below zero', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(numberField(LABEL).min).toBe('0');
    });
  });

  // The component keeps the motor split into a name and a count, so it has to
  // re-adopt a Motor that arrives from anywhere else -- a preset, a reset
  // button, a link. Without this it would push its stale value back instead.
  describe('a motor arriving from the parent', () => {
    it('shows the new motor in the trigger', () => {
      const { rerender } = renderInput({ value: Motor.NEO(2) });
      rerender(
        <MotorInput stateHook={spyStateHook(Motor.Falcon500(4)).stateHook} />,
      );
      expect(selectTrigger().textContent).toBe('Falcon 500');
    });

    it('shows the new quantity in the box', () => {
      const { rerender } = renderInput({ value: Motor.NEO(2) });
      rerender(
        <MotorInput stateHook={spyStateHook(Motor.Falcon500(4)).stateHook} />,
      );
      expect(numberField(LABEL).value).toBe('4');
    });

    // Motor.eq ignores quantity, so a guard written with it would drop this.
    it('shows a new quantity of the same motor', () => {
      const { rerender } = renderInput({ value: Motor.NEO(2) });
      rerender(<MotorInput stateHook={spyStateHook(Motor.NEO(4)).stateHook} />);
      expect(numberField(LABEL).value).toBe('4');
    });

    // The value the component itself just emitted is not news, and adopting it
    // again would overwrite whatever the user has typed since.
    it('does not overwrite an edit with the value it just emitted', async () => {
      const { rerender, user } = renderInput({ value: Motor.NEO(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '5');
      rerender(<MotorInput stateHook={spyStateHook(Motor.NEO(5)).stateHook} />);
      expect(numberField(LABEL).value).toBe('5');
    });
  });

  describe('with real state', () => {
    it('shows the chosen motor in the trigger', async () => {
      const { user } = renderStatefulInput({ initial: Motor.NEO(2) });
      await chooseOption(user, OTHER);
      expect(selectTrigger().textContent).toBe(OTHER);
    });

    it('marks the chosen motor as selected when reopened', async () => {
      const { user } = renderStatefulInput({ initial: Motor.NEO(2) });
      await chooseOption(user, OTHER);
      await user.click(selectTrigger());
      const option = await findSelectOption(OTHER);
      expect(option.getAttribute('aria-selected')).toBe('true');
    });

    it('keeps the typed quantity in the box', async () => {
      const { user } = renderStatefulInput({ initial: Motor.NEO(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '6');
      expect(numberField(LABEL).value).toBe('6');
    });

    it('keeps the typed quantity while the motor changes', async () => {
      const { user } = renderStatefulInput({ initial: Motor.NEO(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '6');
      await chooseOption(user, OTHER);
      expect(numberField(LABEL).value).toBe('6');
    });
  });

  // The ids the Playwright specs drive: `motor` reaches the box and
  // `selectmotor` the trigger.
  describe('testId', () => {
    it('applies the testId to the input', () => {
      renderInput({ value: Motor.NEO(2), testId: 'motor' });
      expect(screen.getByTestId('motor')).toBe(numberField(LABEL));
    });

    it('prefixes the trigger testId with select', () => {
      renderInput({ value: Motor.NEO(2), testId: 'motor' });
      expect(screen.getByTestId('selectmotor')).toBe(selectTrigger());
    });

    it('renders no data-testid on the input when testId is omitted', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(numberField(LABEL).hasAttribute('data-testid')).toBe(false);
    });

    it('renders no data-testid on the trigger when testId is omitted', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(selectTrigger().hasAttribute('data-testid')).toBe(false);
    });
  });

  // jsdom has no layout, so the stacking direction is only observable through
  // the classes the component picks.
  describe('labelAbove', () => {
    it('lays the label beside the input by default', () => {
      const { container } = renderInput({ value: Motor.NEO(2) });
      expect(layoutRoot(container).classList.contains('flex-row')).toBe(true);
    });

    it('stacks the label above the input when set', () => {
      const { container } = renderInput({
        value: Motor.NEO(2),
        labelAbove: true,
      });
      expect(layoutRoot(container).classList.contains('flex-col')).toBe(true);
    });

    it('spaces the label to the left of the input by default', () => {
      renderInput({ value: Motor.NEO(2) });
      expect(screen.getByText(LABEL).classList.contains('mr-2')).toBe(true);
    });

    it('spaces the label above the input when set', () => {
      renderInput({ value: Motor.NEO(2), labelAbove: true });
      expect(screen.getByText(LABEL).classList.contains('mb-1')).toBe(true);
    });
  });
});

describe('MotorNameSelect', () => {
  const SELECT_LABEL = 'Motor to compare';

  /** Unlike MotorInput, this one takes a plain name and a plain setter. */
  function renderSelect({
    value,
    ...props
  }: Partial<Omit<MotorNameSelectProps, 'stateHook'>> & { value: string }) {
    const { stateHook, setValue } = spyStateHook(value);
    const { container, rerender } = render(
      <MotorNameSelect stateHook={stateHook} {...props} />,
    );
    return { setValue, container, rerender, user: userEvent.setup() };
  }

  function renderStatefulSelect(
    props: Partial<Omit<MotorNameSelectProps, 'stateHook'>> = {},
  ) {
    render(
      <Stateful
        initial={CURRENT}
        render={(stateHook) => (
          <MotorNameSelect stateHook={stateHook} {...props} />
        )}
      />,
    );
    return { user: userEvent.setup() };
  }

  describe('label', () => {
    it('renders the given label', () => {
      renderSelect({ value: CURRENT, label: SELECT_LABEL });
      expect(screen.getByText(SELECT_LABEL).textContent).toBe(SELECT_LABEL);
    });

    // The label is optional here, unlike MotorInput's fixed one.
    it('renders no label when none is given', () => {
      const { container } = renderSelect({ value: CURRENT });
      expect(container.querySelector('label')).toBeNull();
    });
  });

  describe('displayed value', () => {
    it('shows the current motor in the trigger', () => {
      renderSelect({ value: CURRENT });
      expect(selectTrigger().textContent).toBe(CURRENT);
    });

    it('shows the new motor after the value changes', () => {
      const { rerender } = renderSelect({ value: CURRENT });
      rerender(<MotorNameSelect stateHook={spyStateHook(OTHER).stateHook} />);
      expect(selectTrigger().textContent).toBe(OTHER);
    });

    it('starts collapsed', () => {
      renderSelect({ value: CURRENT });
      expect(selectTrigger().getAttribute('aria-expanded')).toBe('false');
    });
  });

  // Both selectors render the same MotorSelectContent, so their option lists
  // must not drift apart.
  describe('options', () => {
    it('offers every motor, grouped by program and in declaration order', async () => {
      const { user } = renderSelect({ value: CURRENT });
      const opened = await openSelect(user);
      expect(opened.map((option) => option.textContent)).toEqual(MOTOR_NAMES);
    });

    it('heads each group with its program', async () => {
      const { user } = renderSelect({ value: CURRENT });
      await openSelect(user);
      expect(
        allBySlot('select-label').map((label) => label.textContent),
      ).toEqual(['FRC', 'FTC', 'Other']);
    });

    it('marks the current motor as selected', async () => {
      const { user } = renderSelect({ value: CURRENT });
      await user.click(selectTrigger());
      const option = await findSelectOption(CURRENT);
      expect(option.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('setter contract', () => {
    it('does not call the setter on render', () => {
      const { setValue } = renderSelect({ value: CURRENT });
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter merely on opening', async () => {
      const { setValue, user } = renderSelect({ value: CURRENT });
      await user.click(selectTrigger());
      expect(setValue).not.toHaveBeenCalled();
    });

    // The plain name, not a Motor -- this selector never builds one.
    it('passes the chosen name, and nothing else, to the setter', async () => {
      const { setValue, user } = renderSelect({ value: CURRENT });
      await chooseOption(user, OTHER);
      expect(setValue).toHaveBeenCalledWith(OTHER);
    });

    it('calls the setter exactly once per selection', async () => {
      const { setValue, user } = renderSelect({ value: CURRENT });
      await chooseOption(user, OTHER);
      expect(setValue).toHaveBeenCalledTimes(1);
    });
  });

  describe('with real state', () => {
    it('shows the chosen motor in the trigger', async () => {
      const { user } = renderStatefulSelect();
      await chooseOption(user, OTHER);
      expect(selectTrigger().textContent).toBe(OTHER);
    });
  });

  describe('testId', () => {
    it('applies the testId to the trigger', () => {
      renderSelect({ value: CURRENT, testId: 'motorName' });
      expect(screen.getByTestId('motorName')).toBe(selectTrigger());
    });

    it('renders no data-testid when testId is omitted', () => {
      renderSelect({ value: CURRENT });
      expect(selectTrigger().hasAttribute('data-testid')).toBe(false);
    });
  });

  describe('layout', () => {
    it('lays the label beside the select by default', () => {
      const { container } = renderSelect({ value: CURRENT });
      expect(layoutRoot(container).classList.contains('flex-row')).toBe(true);
    });

    it('stacks the label above the select when labelAbove is set', () => {
      const { container } = renderSelect({ value: CURRENT, labelAbove: true });
      expect(layoutRoot(container).classList.contains('flex-col')).toBe(true);
    });

    it('gives the trigger a fixed width by default', () => {
      renderSelect({ value: CURRENT });
      expect(selectTrigger().classList.contains('w-[180px]')).toBe(true);
    });

    it('widens the trigger to fill the column when labelAbove is set', () => {
      renderSelect({ value: CURRENT, labelAbove: true });
      expect(selectTrigger().classList.contains('w-full')).toBe(true);
    });

    it('lets triggerClassName replace the default width', () => {
      renderSelect({ value: CURRENT, triggerClassName: 'w-auto' });
      expect(selectTrigger().classList.contains('w-[180px]')).toBe(false);
    });

    // `triggerClassName ?? (labelAbove ? ... )` -- an explicit class wins over
    // the width `labelAbove` would otherwise pick.
    it('lets triggerClassName override the labelAbove width', () => {
      renderSelect({
        value: CURRENT,
        labelAbove: true,
        triggerClassName: 'w-auto',
      });
      expect(selectTrigger().classList.contains('w-full')).toBe(false);
    });

    it('applies triggerClassName to the trigger', () => {
      renderSelect({ value: CURRENT, triggerClassName: 'w-auto' });
      expect(selectTrigger().classList.contains('w-auto')).toBe(true);
    });
  });
});
