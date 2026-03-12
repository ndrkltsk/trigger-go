import React from 'react';
import { render } from '@testing-library/react-native';
import { TaskCostRow } from '@/components/shared/task-cost-row';

describe('TaskCostRow', () => {
  it('renders task identifier', () => {
    const { getByText } = render(
      <TaskCostRow taskIdentifier="send-email" totalCostCents={500} runCount={10} rank={1} />
    );
    expect(getByText('send-email')).toBeTruthy();
  });

  it('renders formatted cost', () => {
    const { getByText } = render(
      <TaskCostRow taskIdentifier="send-email" totalCostCents={500} runCount={10} rank={1} />
    );
    expect(getByText('$5.0000')).toBeTruthy();
  });

  it('renders run count', () => {
    const { getByText } = render(
      <TaskCostRow taskIdentifier="send-email" totalCostCents={500} runCount={10} rank={1} />
    );
    expect(getByText('10 runs')).toBeTruthy();
  });

  it('renders singular run text', () => {
    const { getByText } = render(
      <TaskCostRow taskIdentifier="send-email" totalCostCents={500} runCount={1} rank={1} />
    );
    expect(getByText('1 run')).toBeTruthy();
  });

  it('renders rank number', () => {
    const { getByText } = render(
      <TaskCostRow taskIdentifier="send-email" totalCostCents={500} runCount={10} rank={3} />
    );
    expect(getByText('3')).toBeTruthy();
  });
});
