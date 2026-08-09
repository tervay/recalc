// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { StringSelectInput } from '~/components/recalc/io/stringSelect';
import {
  Stateful,
  chooseOption,
  findSelectOption,
  layoutRoot,
  openSelect,
  selectOptions,
  selectTrigger,
  spyStateHook,
} from '~/testUtils';

type StringSelectInputProps = ComponentProps<typeof StringSelectInput>;

const LABEL = 'Type';

// The flywheel shooter-mode choices, whose labels differ from their values --
// the distinction this suite exists to pin down.
const CHOICES = [
  { label: 'Single Shooter Wheel + Hood', value: 'single-hooded' },
  { label: 'Dual Shooter Wheel', value: 'dual-shooter' },
  { label: 'Compound (Single + Dual)', value: 'compound' },
];
const CURRENT = CHOICES[0];
const OTHER = CHOICES[1];

/**
 * Renders with a spy setter so tests can assert the exact value handed back to
 * the state hook. `value` stands in for the first half of the state tuple.
 */
function renderSelect({
  value,
  ...props
}: Partial<Omit<StringSelectInputProps, 'stateHook'>> & { value: string }) {
  const { stateHook, setValue } = spyStateHook(value);
  const { container, rerender } = render(
    <StringSelectInput
      stateHook={stateHook}
      choices={CHOICES}
      label={LABEL}
      {...props}
    />,
  );
  return { setValue, container, rerender, user: userEvent.setup() };
}

function renderStateful(
  props: Partial<Omit<StringSelectInputProps, 'stateHook'>> = {},
) {
  render(
    <Stateful
      initial={CURRENT.value}
      render={(stateHook) => (
        <StringSelectInput
          stateHook={stateHook}
          choices={CHOICES}
          label={LABEL}
          {...props}
        />
      )}
    />,
  );
  return { user: userEvent.setup() };
}

// RTL's automatic cleanup does not register because vitest runs without
// `globals: true`, and clearing innerHTML would leave the React root (and the
// portalled popup) mounted, so unmount explicitly.
afterEach(cleanup);

describe('StringSelectInput', () => {
  describe('label', () => {
    it('renders the given label', () => {
      renderSelect({ value: CURRENT.value });
      expect(screen.getByText(LABEL).textContent).toBe(LABEL);
    });
  });

  describe('displayed value', () => {
    // The component passes `items={choices}` to the Base UI root, which is what
    // lets the trigger resolve a value's label before the popup has ever
    // opened. Without it the trigger would sit empty until first open.
    it('shows the current choice by label, not by value', () => {
      renderSelect({ value: CURRENT.value });
      expect(selectTrigger().textContent).toBe(CURRENT.label);
    });

    it('shows the new label after the value changes', () => {
      const { rerender } = renderSelect({ value: CURRENT.value });
      rerender(
        <StringSelectInput
          stateHook={spyStateHook(OTHER.value).stateHook}
          choices={CHOICES}
          label={LABEL}
        />,
      );
      expect(selectTrigger().textContent).toBe(OTHER.label);
    });

    it('starts collapsed', () => {
      renderSelect({ value: CURRENT.value });
      expect(selectTrigger().getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('testId', () => {
    it('applies the testId to the trigger', () => {
      renderSelect({ value: CURRENT.value, testId: 'shooterMode' });
      expect(screen.getByTestId('shooterMode')).toBe(selectTrigger());
    });

    it('renders no data-testid when testId is omitted', () => {
      renderSelect({ value: CURRENT.value });
      expect(selectTrigger().hasAttribute('data-testid')).toBe(false);
    });
  });

  describe('options', () => {
    it('renders no options while closed', () => {
      renderSelect({ value: CURRENT.value });
      expect(selectOptions()).toEqual([]);
    });

    it('offers every choice by label, in choices order', async () => {
      const { user } = renderSelect({ value: CURRENT.value });
      const opened = await openSelect(user);
      expect(opened.map((option) => option.textContent)).toEqual(
        CHOICES.map((choice) => choice.label),
      );
    });

    it('marks the current choice as selected', async () => {
      const { user } = renderSelect({ value: CURRENT.value });
      await user.click(selectTrigger());
      const option = await findSelectOption(CURRENT.label);
      expect(option.getAttribute('aria-selected')).toBe('true');
    });

    it('marks no other choice as selected', async () => {
      const { user } = renderSelect({ value: CURRENT.value });
      await user.click(selectTrigger());
      const current = await findSelectOption(CURRENT.label);
      const selected = selectOptions().filter(
        (option) => option.getAttribute('aria-selected') === 'true',
      );
      expect(selected).toEqual([current]);
    });
  });

  // The setter is guarded by `v !== null`, but nothing here renders a clear or
  // deselect affordance, so the select can only ever emit one of the rendered
  // choice values -- the null branch is unreachable through the UI and is not
  // tested here.
  describe('setter contract', () => {
    it('does not call the setter on render', () => {
      const { setValue } = renderSelect({ value: CURRENT.value });
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter merely on opening', async () => {
      const { setValue, user } = renderSelect({ value: CURRENT.value });
      await user.click(selectTrigger());
      expect(setValue).not.toHaveBeenCalled();
    });

    // The choice's value, never its label -- the trigger and the options show
    // labels, but the state hook only ever sees values.
    it('passes the chosen value, and nothing else, to the setter', async () => {
      const { setValue, user } = renderSelect({ value: CURRENT.value });
      await chooseOption(user, OTHER.label);
      expect(setValue).toHaveBeenCalledWith(OTHER.value);
    });

    it('calls the setter exactly once per selection', async () => {
      const { setValue, user } = renderSelect({ value: CURRENT.value });
      await chooseOption(user, OTHER.label);
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    it('calls the setter with the same value when it is re-selected', async () => {
      const { setValue, user } = renderSelect({ value: CURRENT.value });
      await chooseOption(user, CURRENT.label);
      expect(setValue).toHaveBeenCalledWith(CURRENT.value);
    });
  });

  describe('with real state', () => {
    it('shows the chosen choice in the trigger', async () => {
      const { user } = renderStateful();
      await chooseOption(user, OTHER.label);
      expect(selectTrigger().textContent).toBe(OTHER.label);
    });

    it('marks the chosen choice as selected when reopened', async () => {
      const { user } = renderStateful();
      await chooseOption(user, OTHER.label);
      await user.click(selectTrigger());
      const option = await findSelectOption(OTHER.label);
      expect(option.getAttribute('aria-selected')).toBe('true');
    });
  });

  // jsdom has no layout, so the stacking direction and widths are only
  // observable through the classes the component picks.
  describe('layout', () => {
    it('lays the label beside the select by default', () => {
      const { container } = renderSelect({ value: CURRENT.value });
      expect(layoutRoot(container).classList.contains('flex-row')).toBe(true);
    });

    it('stacks the label above the select when labelAbove is set', () => {
      const { container } = renderSelect({
        value: CURRENT.value,
        labelAbove: true,
      });
      expect(layoutRoot(container).classList.contains('flex-col')).toBe(true);
    });

    it('gives the trigger a fixed width by default', () => {
      renderSelect({ value: CURRENT.value });
      expect(selectTrigger().classList.contains('w-[180px]')).toBe(true);
    });

    it('widens the trigger to fill the column when labelAbove is set', () => {
      renderSelect({ value: CURRENT.value, labelAbove: true });
      expect(selectTrigger().classList.contains('w-full')).toBe(true);
    });

    it('lets triggerClassName replace the default width', () => {
      renderSelect({ value: CURRENT.value, triggerClassName: 'w-auto' });
      expect(selectTrigger().classList.contains('w-[180px]')).toBe(false);
    });

    // `triggerClassName ?? (labelAbove ? ... )` -- an explicit class wins over
    // the width `labelAbove` would otherwise pick.
    it('lets triggerClassName override the labelAbove width', () => {
      renderSelect({
        value: CURRENT.value,
        labelAbove: true,
        triggerClassName: 'w-auto',
      });
      expect(selectTrigger().classList.contains('w-full')).toBe(false);
    });

    it('applies triggerClassName to the trigger', () => {
      renderSelect({ value: CURRENT.value, triggerClassName: 'w-auto' });
      expect(selectTrigger().classList.contains('w-auto')).toBe(true);
    });
  });
});
