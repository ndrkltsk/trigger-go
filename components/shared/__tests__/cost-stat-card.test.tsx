import React from 'react';
import { render } from '@testing-library/react-native';
import { CostStatCard } from '@/components/shared/cost-stat-card';

describe('CostStatCard', () => {
  it('renders formatted cost', () => {
    const { getByText } = render(
      <CostStatCard label="Total Cost" costCents={1234} />
    );
    expect(getByText('$12.3400')).toBeTruthy();
  });

  it('renders label', () => {
    const { getByText } = render(
      <CostStatCard label="Total Cost" costCents={100} />
    );
    expect(getByText('Total Cost')).toBeTruthy();
  });

  it('renders run count when provided', () => {
    const { getByText } = render(
      <CostStatCard label="Total Cost" costCents={100} runCount={42} />
    );
    expect(getByText('42 runs')).toBeTruthy();
  });

  it('renders singular run text', () => {
    const { getByText } = render(
      <CostStatCard label="Total Cost" costCents={100} runCount={1} />
    );
    expect(getByText('1 run')).toBeTruthy();
  });

  it('does not render run count when not provided', () => {
    const { queryByText } = render(
      <CostStatCard label="Total Cost" costCents={100} />
    );
    expect(queryByText(/runs?/)).toBeNull();
  });

  it('renders Free for zero cost', () => {
    const { getByText } = render(
      <CostStatCard label="Total Cost" costCents={0} />
    );
    expect(getByText('Free')).toBeTruthy();
  });
});
