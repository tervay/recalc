// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import { RatioInput } from '~/components/recalc/io/ratio';
import Ratio, { RatioType } from '~/lib/models/Ratio';
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

type RatioInputProps = ComponentProps<typeof RatioInput>;

/** The label the component falls back to when the caller gives none. */
const LABEL = 'Ratio';

/** Both members of RatioType, in the order the dropdown lists them. */
const TYPE_LABELS = ['Reduction', 'Step-up'];

/** The last value handed to a spy setter, narrowed off the `SetStateAction`. */
function lastWrite(setValue: Mock) {
  const call = setValue.mock.calls.at(-1);
  if (call === undefined) throw new Error('the setter was never called');
  const [value] = call;
  if (!(value instanceof Ratio)) {
    throw new Error('expected the setter to receive a Ratio');
  }
  return value;
}

/** Every magnitude the setter has been handed, oldest first. */
function writtenMagnitudes(setValue: Mock) {
  return setValue.mock.calls.map(([value]) => {
    if (!(value instanceof Ratio)) {
      throw new Error('expected the setter to receive a Ratio');
    }
    return value.magnitude;
  });
}

/**
 * The magnitude is debounced, so even at the default delay of 0 an edit only
 * reaches the setter on a later macrotask. Waiting one out is deterministic
 * where polling for the write would not be.
 */
async function flushDebounce() {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

/**
 * Renders with a spy setter so tests can assert the exact value handed back to
 * the state hook. `value` stands in for the first half of the state tuple.
 */
function renderInput({
  value,
  ...props
}: Omit<RatioInputProps, 'stateHook'> & { value: Ratio }) {
  const { stateHook, setValue } = spyStateHook(value);
  const { container, rerender } = render(
    <RatioInput stateHook={stateHook} {...props} />,
  );
  return { setValue, container, rerender, user: userEvent.setup() };
}

function renderStatefulInput({
  initial,
  ...props
}: Omit<RatioInputProps, 'stateHook'> & { initial: Ratio }) {
  const { container } = render(
    <Stateful
      initial={initial}
      render={(stateHook) => <RatioInput stateHook={stateHook} {...props} />}
    />,
  );
  return { container, user: userEvent.setup() };
}

// RTL's automatic cleanup does not register because vitest runs without
// `globals: true`, and clearing innerHTML would leave the React root (and the
// portalled popup) mounted, so unmount explicitly.
afterEach(cleanup);

describe('RatioInput', () => {
  describe('label', () => {
    it('names the input with the default label', () => {
      renderInput({ value: new Ratio(2) });
      expect(numberField(LABEL)).toBeTruthy();
    });

    it('points the label at the input', () => {
      renderInput({ value: new Ratio(2) });
      expect(screen.getByText(LABEL).getAttribute('for')).toBe(
        numberField(LABEL).id,
      );
    });

    it('names the input with a caller-supplied label', () => {
      renderInput({ value: new Ratio(2), label: 'Gearbox reduction' });
      expect(numberField('Gearbox reduction')).toBeTruthy();
    });
  });

  describe('displayed value', () => {
    it('shows the current magnitude', () => {
      renderInput({ value: new Ratio(2) });
      expect(numberField(LABEL).value).toBe('2');
    });

    it('shows the current type in the trigger', () => {
      renderInput({ value: new Ratio(2, RatioType.STEP_UP) });
      expect(selectTrigger().textContent).toBe('Step-up');
    });

    it('defaults the type to a reduction', () => {
      renderInput({ value: new Ratio(2) });
      expect(selectTrigger().textContent).toBe('Reduction');
    });

    it('starts with the type popup collapsed', () => {
      renderInput({ value: new Ratio(2) });
      expect(selectTrigger().getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('options', () => {
    it('renders no options while closed', () => {
      renderInput({ value: new Ratio(2) });
      expect(selectOptions()).toEqual([]);
    });

    it('offers both ratio types, in enum order', async () => {
      const { user } = renderInput({ value: new Ratio(2) });
      const opened = await openSelect(user);
      expect(opened.map((option) => option.textContent)).toEqual(TYPE_LABELS);
    });

    it('marks the current type as selected', async () => {
      const { user } = renderInput({ value: new Ratio(2) });
      await user.click(selectTrigger());
      const option = await findSelectOption('Reduction');
      expect(option.getAttribute('aria-selected')).toBe('true');
    });

    it('marks the other type as not selected', async () => {
      const { user } = renderInput({ value: new Ratio(2) });
      await user.click(selectTrigger());
      const option = await findSelectOption('Step-up');
      expect(option.getAttribute('aria-selected')).toBe('false');
    });
  });

  // Writes come from edits. A screen full of these inputs must not write to
  // shared state merely by mounting, which matches every sibling io input.
  describe('setter on mount', () => {
    it('does not call the setter on render', async () => {
      const { setValue } = renderInput({ value: new Ratio(2) });
      await flushDebounce();
      expect(setValue).not.toHaveBeenCalled();
    });

    // 0 is the value the empty-box branch also produces, so this is the case
    // most likely to slip past the guard and write on mount.
    it('does not call the setter when the magnitude is 0', async () => {
      const { setValue } = renderInput({ value: new Ratio(0) });
      await flushDebounce();
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter for a step-up ratio', async () => {
      const { setValue } = renderInput({
        value: new Ratio(2, RatioType.STEP_UP),
      });
      await flushDebounce();
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter merely on opening', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(2) });
      await user.click(selectTrigger());
      expect(setValue).not.toHaveBeenCalled();
    });
  });

  describe('choosing a type', () => {
    it('passes the chosen type to the setter', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(2) });
      await chooseOption(user, 'Step-up');
      expect(lastWrite(setValue).toDict()).toEqual({
        magnitude: 2,
        ratioType: RatioType.STEP_UP,
      });
    });

    it('keeps the magnitude while the type changes', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(7) });
      await chooseOption(user, 'Step-up');
      expect(lastWrite(setValue).magnitude).toBe(7);
    });

    it('switches back to a reduction', async () => {
      const { setValue, user } = renderInput({
        value: new Ratio(2, RatioType.STEP_UP),
      });
      await chooseOption(user, 'Reduction');
      expect(lastWrite(setValue).ratioType).toBe(RatioType.REDUCTION);
    });

    it('calls the setter exactly once per selection', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(2) });
      await chooseOption(user, 'Step-up');
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    // Re-picking the type already in state changes nothing, so the guarded
    // effect has nothing to report.
    it('does not call the setter when the current type is re-selected', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(2) });
      await chooseOption(user, 'Reduction');
      await flushDebounce();
      expect(setValue).not.toHaveBeenCalled();
    });
  });

  describe('magnitude', () => {
    it('passes the typed magnitude to the setter', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '3');
      await flushDebounce();
      expect(lastWrite(setValue).magnitude).toBe(3);
    });

    it('passes a typed decimal to the setter', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '3.5');
      await flushDebounce();
      expect(lastWrite(setValue).magnitude).toBe(3.5);
    });

    it('keeps the type while the magnitude changes', async () => {
      const { setValue, user } = renderInput({
        value: new Ratio(2, RatioType.STEP_UP),
      });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '3');
      await flushDebounce();
      expect(lastWrite(setValue).ratioType).toBe(RatioType.STEP_UP);
    });

    it('reports 0 to the setter when the box is cleared', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await flushDebounce();
      expect(lastWrite(setValue).magnitude).toBe(0);
    });

    // "0" is treated as an unfinished edit, the same as an empty box.
    it('reports 0 to the setter when a zero is typed', async () => {
      const { setValue, user } = renderInput({ value: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '0');
      await flushDebounce();
      expect(lastWrite(setValue).magnitude).toBe(0);
    });

    // An emptied box reads as 0 downstream, but the box itself stays empty:
    // the parent echoes that 0 straight back, and re-adopting it would refill
    // the box so the next keystroke landed after a zero.
    it('leaves the box empty after clearing it', async () => {
      const { user } = renderStatefulInput({ initial: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await flushDebounce();
      expect(numberField(LABEL).value).toBe('');
    });

    it('types cleanly into a box cleared of a previous magnitude', async () => {
      const { user } = renderStatefulInput({ initial: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '4');
      await flushDebounce();
      expect(numberField(LABEL).value).toBe('4');
    });
  });

  // Callers that recompute on every write pass a delay so a multi-digit edit
  // costs one recomputation, not one per keystroke. Fake timers here because
  // the whole point is what has *not* happened yet, which a wall-clock
  // assertion could not pin down.
  describe('a debounced magnitude', () => {
    const DELAY = 300;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function renderDebounced() {
      const { stateHook, setValue } = spyStateHook(new Ratio(2));
      render(<RatioInput stateHook={stateHook} debounceDelay={DELAY} />);
      return { setValue };
    }

    /**
     * One change event per digit, which is what restarts the debounce.
     * userEvent is not used in this block: its internal waits never settle
     * under fake timers, and it is the debounce being tested here, not the
     * keyboard.
     */
    function typeDigits(digits: string) {
      const field = numberField(LABEL);
      for (let i = 1; i <= digits.length; i += 1) {
        fireEvent.change(field, { target: { value: digits.slice(0, i) } });
      }
    }

    it('holds the write back until the delay elapses', () => {
      const { setValue } = renderDebounced();
      typeDigits('123');
      expect(setValue).not.toHaveBeenCalled();
    });

    it('still holds the write back one tick short of the delay', () => {
      const { setValue } = renderDebounced();
      typeDigits('123');
      act(() => {
        vi.advanceTimersByTime(DELAY - 1);
      });
      expect(setValue).not.toHaveBeenCalled();
    });

    it('writes once the delay elapses', () => {
      const { setValue } = renderDebounced();
      typeDigits('123');
      act(() => {
        vi.advanceTimersByTime(DELAY);
      });
      expect(lastWrite(setValue).magnitude).toBe(123);
    });

    // The reason the delay exists: each keystroke restarts the timer, so 1 and
    // 12 never reach the setter at all.
    it('reports only the finished number, never the digits along the way', () => {
      const { setValue } = renderDebounced();
      typeDigits('123');
      act(() => {
        vi.advanceTimersByTime(DELAY);
      });
      expect(writtenMagnitudes(setValue)).toEqual([123]);
    });

    it('shows every keystroke in the box while the write waits', () => {
      renderDebounced();
      typeDigits('123');
      expect(numberField(LABEL).value).toBe('123');
    });
  });

  // The component keeps the ratio split into a magnitude and a type, so it has
  // to re-adopt a Ratio that arrives from anywhere else -- a preset, a reset
  // button, a link. Without this it would push its stale value back instead.
  describe('a ratio arriving from the parent', () => {
    it('shows the new magnitude in the box', () => {
      const { rerender } = renderInput({ value: new Ratio(2) });
      rerender(<RatioInput stateHook={spyStateHook(new Ratio(9)).stateHook} />);
      expect(numberField(LABEL).value).toBe('9');
    });

    it('shows the new type in the trigger', () => {
      const { rerender } = renderInput({ value: new Ratio(2) });
      rerender(
        <RatioInput
          stateHook={spyStateHook(new Ratio(2, RatioType.STEP_UP)).stateHook}
        />,
      );
      expect(selectTrigger().textContent).toBe('Step-up');
    });

    // The value the component itself just emitted is not news, and adopting it
    // again would overwrite whatever the user has typed since.
    it('does not overwrite an edit with the value it just emitted', async () => {
      const { rerender, user } = renderInput({ value: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '5');
      await flushDebounce();
      rerender(<RatioInput stateHook={spyStateHook(new Ratio(5)).stateHook} />);
      expect(numberField(LABEL).value).toBe('5');
    });
  });

  describe('with real state', () => {
    it('shows the chosen type in the trigger', async () => {
      const { user } = renderStatefulInput({ initial: new Ratio(2) });
      await chooseOption(user, 'Step-up');
      expect(selectTrigger().textContent).toBe('Step-up');
    });

    it('marks the chosen type as selected when reopened', async () => {
      const { user } = renderStatefulInput({ initial: new Ratio(2) });
      await chooseOption(user, 'Step-up');
      await user.click(selectTrigger());
      const option = await findSelectOption('Step-up');
      expect(option.getAttribute('aria-selected')).toBe('true');
    });

    it('keeps the typed magnitude in the box', async () => {
      const { user } = renderStatefulInput({ initial: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '6');
      await flushDebounce();
      expect(numberField(LABEL).value).toBe('6');
    });

    it('keeps the typed magnitude while the type changes', async () => {
      const { user } = renderStatefulInput({ initial: new Ratio(2) });
      await user.clear(numberField(LABEL));
      await user.type(numberField(LABEL), '6');
      await flushDebounce();
      await chooseOption(user, 'Step-up');
      expect(numberField(LABEL).value).toBe('6');
    });
  });

  // The ids the Playwright specs drive: `ratio` reaches the box and
  // `selectratio` the trigger.
  describe('testId', () => {
    it('applies the testId to the input', () => {
      renderInput({ value: new Ratio(2), testId: 'ratio' });
      expect(screen.getByTestId('ratio')).toBe(numberField(LABEL));
    });

    it('prefixes the trigger testId with select', () => {
      renderInput({ value: new Ratio(2), testId: 'ratio' });
      expect(screen.getByTestId('selectratio')).toBe(selectTrigger());
    });

    it('renders no data-testid on the input when testId is omitted', () => {
      renderInput({ value: new Ratio(2) });
      expect(numberField(LABEL).hasAttribute('data-testid')).toBe(false);
    });

    it('renders no data-testid on the trigger when testId is omitted', () => {
      renderInput({ value: new Ratio(2) });
      expect(selectTrigger().hasAttribute('data-testid')).toBe(false);
    });
  });

  // A negative ratio magnitude is physically meaningless, so the browser is
  // told never to offer one.
  describe('min', () => {
    it('rejects a magnitude below zero', () => {
      renderInput({ value: new Ratio(2) });
      expect(numberField(LABEL).min).toBe('0');
    });
  });

  // jsdom has no layout, so the stacking direction is only observable through
  // the classes the component picks.
  describe('labelAbove', () => {
    it('lays the label beside the input by default', () => {
      const { container } = renderInput({ value: new Ratio(2) });
      expect(layoutRoot(container).classList.contains('flex-row')).toBe(true);
    });

    it('stacks the label above the input when set', () => {
      const { container } = renderInput({
        value: new Ratio(2),
        labelAbove: true,
      });
      expect(layoutRoot(container).classList.contains('flex-col')).toBe(true);
    });

    it('spaces the label to the left of the input by default', () => {
      renderInput({ value: new Ratio(2) });
      expect(screen.getByText(LABEL).classList.contains('mr-2')).toBe(true);
    });

    it('spaces the label above the input when set', () => {
      renderInput({ value: new Ratio(2), labelAbove: true });
      expect(screen.getByText(LABEL).classList.contains('mb-1')).toBe(true);
    });
  });
});
