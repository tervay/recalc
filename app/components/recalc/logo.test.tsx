// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import motorIcon from '~/assets/motor.svg';
import Logo from '~/components/recalc/logo';

afterEach(cleanup);

describe('Logo', () => {
  it('renders the bundled motor icon', () => {
    render(<Logo />);
    expect(
      screen.getByRole('img', { name: 'ReCalc Logo' }).getAttribute('src'),
    ).toBe(motorIcon);
  });
});
