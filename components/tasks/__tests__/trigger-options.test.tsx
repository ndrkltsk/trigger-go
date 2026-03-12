import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TriggerOptions, type TriggerOptionsValues } from '@/components/tasks/trigger-options';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    ChevronDown: createMockIcon('ChevronDown'),
    ChevronDownIcon: createMockIcon('ChevronDownIcon'),
    ChevronUpIcon: createMockIcon('ChevronUpIcon'),
    Check: createMockIcon('Check'),
  };
});

jest.mock('@rn-primitives/collapsible', () => {
  const { View, Pressable } = require('react-native');
  const React = require('react');
  return {
    Root: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Trigger: ({ children, ...props }: { children: React.ReactNode }) => (
      <Pressable {...props}>{children}</Pressable>
    ),
    Content: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('@rn-primitives/select', () => {
  const { View, Text, Pressable } = require('react-native');
  const React = require('react');
  return {
    Root: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Trigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <Pressable ref={ref} {...props}>{children}</Pressable>
    )),
    Value: React.forwardRef(({ placeholder, ...props }: any, ref: any) => (
      <Text ref={ref} {...props}>{placeholder}</Text>
    )),
    Content: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Item: React.forwardRef(({ children, label, ...props }: any, ref: any) => (
      <Pressable ref={ref} {...props}><Text>{label}</Text></Pressable>
    )),
    ItemText: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    ItemIndicator: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Overlay: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Portal: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Viewport: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ScrollUpButton: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ScrollDownButton: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Separator: () => <View />,
    Group: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Label: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    useRootContext: () => ({ value: undefined }),
  };
});

const DEFAULT_VALUES: TriggerOptionsValues = {
  delay: '',
  ttl: '',
  tags: '',
  queueName: '',
  concurrencyKey: '',
  idempotencyKey: '',
  machine: undefined,
};

describe('TriggerOptions', () => {
  it('renders "Advanced Options" header', () => {
    const { getByText } = render(
      <TriggerOptions values={DEFAULT_VALUES} onChange={jest.fn()} />
    );
    expect(getByText('Advanced Options')).toBeTruthy();
  });

  it('renders all option field labels', () => {
    const { getByText } = render(
      <TriggerOptions values={DEFAULT_VALUES} onChange={jest.fn()} />
    );
    expect(getByText('Delay')).toBeTruthy();
    expect(getByText('TTL (Time to Live)')).toBeTruthy();
    expect(getByText('Tags (comma-separated)')).toBeTruthy();
    expect(getByText('Queue Name')).toBeTruthy();
    expect(getByText('Concurrency Key')).toBeTruthy();
    expect(getByText('Idempotency Key')).toBeTruthy();
    expect(getByText('Machine Preset')).toBeTruthy();
  });

  it('calls onChange when delay field is updated', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <TriggerOptions values={DEFAULT_VALUES} onChange={onChange} />
    );
    fireEvent.changeText(getByPlaceholderText('e.g. 5m, 1h, 30s'), '5m');
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_VALUES,
      delay: '5m',
    });
  });

  it('calls onChange when tags field is updated', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <TriggerOptions values={DEFAULT_VALUES} onChange={onChange} />
    );
    fireEvent.changeText(
      getByPlaceholderText('e.g. user_123, order_456'),
      'user_123, order_456'
    );
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_VALUES,
      tags: 'user_123, order_456',
    });
  });

  it('renders with pre-filled values', () => {
    const values: TriggerOptionsValues = {
      ...DEFAULT_VALUES,
      delay: '10m',
      queueName: 'my-queue',
    };
    const { getByDisplayValue } = render(
      <TriggerOptions values={values} onChange={jest.fn()} />
    );
    expect(getByDisplayValue('10m')).toBeTruthy();
    expect(getByDisplayValue('my-queue')).toBeTruthy();
  });
});
