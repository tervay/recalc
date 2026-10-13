// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { VendorBadge } from '~/components/recalc/vendorBadge';
import type { Vendor } from '~/lib/types/common';

const IMAGE_VENDORS: [Vendor, string][] = [
  ['AndyMark', '/vendors/andymark.png'],
  ['BaneBots', '/vendors/banebots.png'],
  ['CTRE', '/vendors/ctre.png'],
  ['LastAnvil', '/vendors/lastanvil.png'],
  ['REV', '/vendors/rev.png'],
  ['SDS', '/vendors/sds.png'],
  ['Swyft', '/vendors/swyft.png'],
  ['Thrifty', '/vendors/thrifty.png'],
  ['VEX', '/vendors/vex.png'],
  ['WCP', '/vendors/wcp.png'],
];

const ICON_VENDORS: Vendor[] = ['Custom', 'VBeltGuys'];

function renderBadge(vendor: Vendor, url?: string) {
  return render(
    <MemoryRouter>
      <VendorBadge vendor={vendor} url={url} />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('VendorBadge', () => {
  it.each(IMAGE_VENDORS)('renders the %s icon image', (vendor, src) => {
    renderBadge(vendor);
    expect(screen.getByRole('img', { name: vendor }).getAttribute('src')).toBe(
      src,
    );
  });

  it.each(ICON_VENDORS)('renders %s as a decorative svg icon', (vendor) => {
    const { container } = renderBadge(vendor);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it.each(ICON_VENDORS)('names the %s link for screen readers', (vendor) => {
    renderBadge(vendor, '/products/belt');
    expect(screen.getByRole('link', { name: vendor })).toBeDefined();
  });

  it.each([...IMAGE_VENDORS.map(([vendor]) => vendor), ...ICON_VENDORS])(
    'shows %s as hover text',
    (vendor) => {
      renderBadge(vendor);
      expect(screen.getByTitle(vendor)).toBeDefined();
    },
  );

  it('puts the hover text on the link when given a url', () => {
    renderBadge('WCP', '/products/gear');
    expect(screen.getByRole('link', { name: 'WCP' }).title).toBe('WCP');
  });

  it('rounds the corners of the square REV logo', () => {
    renderBadge('REV');
    expect(screen.getByRole('img', { name: 'REV' }).classList).toContain(
      'rounded-sm',
    );
  });

  it('leaves other vendor logos unrounded', () => {
    renderBadge('WCP');
    expect(screen.getByRole('img', { name: 'WCP' }).classList).not.toContain(
      'rounded-sm',
    );
  });

  it('links to the product url when given one', () => {
    renderBadge('WCP', '/products/gear');
    expect(screen.getByRole('link', { name: 'WCP' }).getAttribute('href')).toBe(
      '/products/gear',
    );
  });

  it('renders no link without a url', () => {
    renderBadge('WCP');
    expect(screen.queryByRole('link')).toBeNull();
  });
});
