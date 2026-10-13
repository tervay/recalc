// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StockBadge } from '~/components/recalc/stockBadge';

describe('StockBadge', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows in stock', () => {
    render(<StockBadge status="in-stock" />);
    expect(screen.getByText('In stock')).toBeDefined();
  });

  it('shows backorder', () => {
    render(<StockBadge status="backorder" />);
    expect(screen.getByText('Backorder')).toBeDefined();
  });

  it('shows out of stock', () => {
    render(<StockBadge status="out-of-stock" />);
    expect(screen.getByText('Out of stock')).toBeDefined();
  });

  it('shows a dash when stock is unknown', () => {
    render(<StockBadge status="unknown" />);
    expect(screen.getByText('-')).toBeDefined();
  });

  it('labels the unknown dash for screen readers', () => {
    render(<StockBadge status="unknown" />);
    expect(screen.getByLabelText('Stock unknown')).toBeDefined();
  });

  it('shows a loading placeholder while stock is loading', () => {
    render(<StockBadge status={undefined} />);
    expect(screen.getByTestId('stock-loading')).toBeDefined();
  });
});
