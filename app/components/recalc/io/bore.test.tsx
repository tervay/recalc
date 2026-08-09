// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import BoreInput from '~/components/recalc/io/bore';
import { zBoreSchema, type Bore } from '~/lib/types/common';
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

type BoreInputProps = ComponentProps<typeof BoreInput>;

const CURRENT: Bore = '1/2" Hex';
const OTHER: Bore = 'MAXSpline';

/**
 * Renders with a spy setter so tests can assert the exact value handed back to
 * the state hook. `value` stands in for the first half of the state tuple.
 */
function renderBore({
  value,
  ...props
}: Omit<BoreInputProps, 'stateHook'> & { value: Bore }) {
  const { stateHook, setValue } = spyStateHook(value);
  const { container, rerender } = render(
    <BoreInput stateHook={stateHook} {...props} />,
  );
  return { setValue, container, rerender, user: userEvent.setup() };
}

// RTL's automatic cleanup does not register because vitest runs without
// `globals: true`, and clearing innerHTML would leave the React root (and the
// portalled popup) mounted, so unmount explicitly.
afterEach(cleanup);

describe('BoreInput', () => {
  describe('label', () => {
    it('falls back to "Bore" when no label is given', () => {
      renderBore({ value: CURRENT });
      expect(screen.getByText('Bore').textContent).toBe('Bore');
    });

    it('renders the given label', () => {
      renderBore({ value: CURRENT, label: 'Starting Bore' });
      expect(screen.getByText('Starting Bore').textContent).toBe(
        'Starting Bore',
      );
    });
  });

  describe('displayed value', () => {
    it('shows the current bore in the trigger', () => {
      renderBore({ value: CURRENT });
      expect(selectTrigger().textContent).toBe(CURRENT);
    });

    it('shows the new bore after the value changes', () => {
      const { rerender } = renderBore({ value: CURRENT });
      rerender(<BoreInput stateHook={spyStateHook<Bore>(OTHER).stateHook} />);
      expect(selectTrigger().textContent).toBe(OTHER);
    });

    it('starts collapsed', () => {
      renderBore({ value: CURRENT });
      expect(selectTrigger().getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('testId', () => {
    it('applies the testId to the trigger', () => {
      renderBore({ value: CURRENT, testId: 'startingBore' });
      expect(screen.getByTestId('startingBore')).toBe(selectTrigger());
    });

    it('renders no data-testid when testId is omitted', () => {
      renderBore({ value: CURRENT });
      expect(selectTrigger().hasAttribute('data-testid')).toBe(false);
    });
  });

  describe('options', () => {
    it('renders no options while closed', () => {
      renderBore({ value: CURRENT });
      expect(selectOptions()).toEqual([]);
    });

    // Guards against `BORE_OPTIONS` drifting out of sync with the schema that
    // the change handler validates against: a bore missing here is unreachable,
    // and one only here would be rejected by `safeParse`.
    it('offers every bore in the schema, in schema order', async () => {
      const { user } = renderBore({ value: CURRENT });
      const opened = await openSelect(user);
      expect(opened.map((option) => option.textContent)).toEqual(
        zBoreSchema.options,
      );
    });

    it('marks the current bore as selected', async () => {
      const { user } = renderBore({ value: CURRENT });
      await user.click(selectTrigger());
      const option = await findSelectOption(CURRENT);
      expect(option.getAttribute('aria-selected')).toBe('true');
    });

    it('marks no other bore as selected', async () => {
      const { user } = renderBore({ value: CURRENT });
      await user.click(selectTrigger());
      const current = await findSelectOption(CURRENT);
      const selected = selectOptions().filter(
        (option) => option.getAttribute('aria-selected') === 'true',
      );
      expect(selected).toEqual([current]);
    });
  });

  // The setter is guarded by `zBoreSchema.safeParse`, but the select can only
  // emit values from the rendered `SelectItem`s -- all of which are bores -- so
  // the rejecting branch is unreachable through the UI and is not tested here.
  describe('setter contract', () => {
    it('does not call the setter on render', () => {
      const { setValue } = renderBore({ value: CURRENT });
      expect(setValue).not.toHaveBeenCalled();
    });

    it('does not call the setter merely on opening', async () => {
      const { setValue, user } = renderBore({ value: CURRENT });
      await user.click(selectTrigger());
      expect(setValue).not.toHaveBeenCalled();
    });

    it('passes the chosen bore, and nothing else, to the setter', async () => {
      const { setValue, user } = renderBore({ value: CURRENT });
      await chooseOption(user, OTHER);
      expect(setValue).toHaveBeenCalledWith(OTHER);
    });

    it('calls the setter exactly once per selection', async () => {
      const { setValue, user } = renderBore({ value: CURRENT });
      await chooseOption(user, OTHER);
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    it('calls the setter with the same bore when it is re-selected', async () => {
      const { setValue, user } = renderBore({ value: CURRENT });
      await chooseOption(user, CURRENT);
      expect(setValue).toHaveBeenCalledWith(CURRENT);
    });
  });

  describe('with real state', () => {
    function renderStateful(props: Omit<BoreInputProps, 'stateHook'> = {}) {
      render(
        <Stateful
          initial={CURRENT}
          render={(stateHook) => <BoreInput stateHook={stateHook} {...props} />}
        />,
      );
      return { user: userEvent.setup() };
    }

    it('shows the chosen bore in the trigger', async () => {
      const { user } = renderStateful();
      await chooseOption(user, OTHER);
      expect(selectTrigger().textContent).toBe(OTHER);
    });

    it('marks the chosen bore as selected when reopened', async () => {
      const { user } = renderStateful();
      await chooseOption(user, OTHER);
      await user.click(selectTrigger());
      const option = await findSelectOption(OTHER);
      expect(option.getAttribute('aria-selected')).toBe('true');
    });
  });

  // jsdom has no layout, so the stacking direction is only observable through
  // the classes the component picks.
  describe('labelAbove', () => {
    it('lays the label beside the select by default', () => {
      const { container } = renderBore({ value: CURRENT });
      expect(layoutRoot(container).classList.contains('flex-row')).toBe(true);
    });

    it('stacks the label above the select when set', () => {
      const { container } = renderBore({ value: CURRENT, labelAbove: true });
      expect(layoutRoot(container).classList.contains('flex-col')).toBe(true);
    });

    it('gives the trigger a fixed width by default', () => {
      renderBore({ value: CURRENT });
      expect(selectTrigger().classList.contains('w-45')).toBe(true);
    });

    it('widens the trigger to fill the column when set', () => {
      renderBore({ value: CURRENT, labelAbove: true });
      expect(selectTrigger().classList.contains('w-full')).toBe(true);
    });
  });
});
