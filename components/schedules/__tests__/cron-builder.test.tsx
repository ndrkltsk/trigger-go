import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CronBuilder } from '@/components/schedules/cron-builder';

describe('CronBuilder', () => {
  it('renders all preset buttons', () => {
    const { getByText } = render(
      <CronBuilder value="" onChange={jest.fn()} />
    );

    expect(getByText('Every 5 min')).toBeTruthy();
    expect(getByText('Hourly')).toBeTruthy();
    expect(getByText('Daily midnight')).toBeTruthy();
    expect(getByText('Mon 9 AM')).toBeTruthy();
    expect(getByText('Weekdays 9 AM')).toBeTruthy();
  });

  it('calls onChange when a preset is tapped', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <CronBuilder value="" onChange={onChange} />
    );

    fireEvent.press(getByText('Hourly'));
    expect(onChange).toHaveBeenCalledWith('0 * * * *');
  });

  it('renders the text input with current value', () => {
    const { getByDisplayValue } = render(
      <CronBuilder value="0 0 * * *" onChange={jest.fn()} />
    );

    expect(getByDisplayValue('0 0 * * *')).toBeTruthy();
  });

  it('calls onChange when text input changes', () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = render(
      <CronBuilder value="0 0 * * *" onChange={onChange} />
    );

    fireEvent.changeText(getByDisplayValue('0 0 * * *'), '*/10 * * * *');
    expect(onChange).toHaveBeenCalledWith('*/10 * * * *');
  });

  it('shows human-readable preview for valid cron', () => {
    const { getByText } = render(
      <CronBuilder value="0 0 * * *" onChange={jest.fn()} />
    );

    expect(getByText('Every day at 12:00 AM')).toBeTruthy();
  });

  it('shows error message when error prop is set', () => {
    const { getByText } = render(
      <CronBuilder value="bad" onChange={jest.fn()} error="Invalid cron expression" />
    );

    expect(getByText('Invalid cron expression')).toBeTruthy();
  });
});
