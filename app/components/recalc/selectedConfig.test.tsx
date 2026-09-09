// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SelectedConfig } from '~/components/recalc/selectedConfig';
import type { ConfigOptResult } from '~/lib/math/optimizerUtils';

const CONFIG: ConfigOptResult = {
  statorLimitAmps: 60,
  supplyLimitAmps: 40,
  optimalRatio: 4.25,
  timeToGoalSeconds: 0.5,
  peakCurrentAmps: 35,
  energyJoules: 20,
  success: true,
};

afterEach(cleanup);

describe('SelectedConfig', () => {
  it('renders a button for applying the optimal ratio', () => {
    const onSetConfig = vi.fn<(config: ConfigOptResult) => void>();
    render(<SelectedConfig config={CONFIG} onSetConfig={onSetConfig} />);

    const button = screen.getByRole('button', { name: 'Set', exact: true });
    expect(button).toBeTruthy();
    expect(button.className).toContain('cursor-pointer');
  });

  it('passes the selected configuration to the apply callback', async () => {
    const onSetConfig = vi.fn<(config: ConfigOptResult) => void>();
    render(<SelectedConfig config={CONFIG} onSetConfig={onSetConfig} />);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Set', exact: true }));

    expect(onSetConfig).toHaveBeenCalledWith(CONFIG);
  });
});
