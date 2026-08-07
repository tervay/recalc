// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import MotorTable from '~/components/recalc/motorTable';
import { ALL_MOTORS } from '~/lib/models/Motor';

const COLUMN_HEADERS = [
  'Motor',
  'Free Speed',
  'Stall Torque',
  'Stall Current',
  'Peak Power',
  'Power Density',
  'Free Current',
  'Weight',
  'kT (Nm/A)',
  'Data From',
];

// The order the alphanumeric sort function produces for the motor names: chunks
// of digits compare numerically, and a numeric chunk always sorts after a
// textual one, which is why the 775s land at the end rather than the start.
const NAMES_SORTED_ASCENDING = [
  'AM-9015',
  'BAG',
  'BaneBots 550',
  'CIM',
  'Core Hex',
  'Falcon 500',
  'Falcon 500 (FOC)',
  'HD Hex',
  'Kraken X44',
  'Kraken X44 (FOC)',
  'Kraken X60',
  'Kraken X60 (FOC)',
  'MiniCIM',
  'Minion',
  'Minion (Adv Hall)',
  'Modern Robotics',
  'NEO',
  'NEO 2.0',
  'NEO 550',
  'NEO Vortex',
  'NeveRest',
  'Snowblower',
  'Thrifty Pulsar',
  'V5 Smart Motor (Red)',
  '775 RedLine',
  '775pro',
];

function renderMotorTable() {
  render(
    <MemoryRouter>
      <MotorTable />
    </MemoryRouter>,
  );
}

function bodyRows() {
  const [, body] = screen.getAllByRole('rowgroup');
  return within(body).getAllByRole('row');
}

/**
 * The motor name cell renders the identifier in its own span ahead of the
 * vendor badges, so reading the first span avoids picking up badge text.
 */
function motorNames() {
  return bodyRows().map(
    (row) =>
      within(row).getAllByRole('cell')[0].querySelector('span')?.textContent,
  );
}

function freeSpeeds() {
  return bodyRows().map((row) => {
    const text = within(row).getAllByRole('cell')[1].textContent ?? '';
    return Number(text.split(' ')[0].replaceAll(',', ''));
  });
}

function clickHeader(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('MotorTable', () => {
  it('renders a header for every column', () => {
    renderMotorTable();

    const [header] = screen.getAllByRole('rowgroup');
    expect(
      within(header)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(COLUMN_HEADERS);
  });

  it('renders one row per motor', () => {
    renderMotorTable();

    expect(bodyRows()).toHaveLength(ALL_MOTORS.length);
  });

  it('sorts motor names alphanumerically when the Motor header is clicked', () => {
    renderMotorTable();

    clickHeader('Motor');

    expect(motorNames()).toEqual(NAMES_SORTED_ASCENDING);
  });

  it('reverses the motor name order when the Motor header is clicked twice', () => {
    renderMotorTable();

    clickHeader('Motor');
    clickHeader('Motor');

    expect(motorNames()).toEqual([...NAMES_SORTED_ASCENDING].reverse());
  });

  it('sorts by ascending free speed when the Free Speed header is clicked', () => {
    renderMotorTable();

    clickHeader('Free Speed');

    const speeds = freeSpeeds();
    expect(speeds).toEqual([...speeds].sort((a, b) => a - b));
  });

  it('sorts by descending free speed when the Free Speed header is clicked twice', () => {
    renderMotorTable();

    clickHeader('Free Speed');
    clickHeader('Free Speed');

    const speeds = freeSpeeds();
    expect(speeds).toEqual([...speeds].sort((a, b) => b - a));
  });
});
