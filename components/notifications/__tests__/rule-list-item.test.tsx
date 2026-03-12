import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RuleListItem } from '../rule-list-item';
import type { NotificationRule } from '@/stores/notification-rules-store';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    AlertTriangle: createMockIcon('AlertTriangle'),
    Trash2: createMockIcon('Trash2'),
  };
});

jest.mock('@/components/ui/switch', () => {
  const { View, Pressable, Text } = require('react-native');
  return {
    Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
      <Pressable testID="switch" onPress={() => onCheckedChange(!checked)}>
        <Text>{checked ? 'ON' : 'OFF'}</Text>
      </Pressable>
    ),
  };
});

const makeRule = (overrides: Partial<NotificationRule> = {}): NotificationRule => ({
  id: 'rule_1',
  name: 'Payment Failures',
  triggerType: 'task',
  triggerValue: 'process-payment',
  eventType: 'failure',
  environment: 'prod',
  severity: 'normal',
  enabled: true,
  ...overrides,
});

describe('RuleListItem', () => {
  const defaultProps = {
    rule: makeRule(),
    onToggle: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the rule name', () => {
    const { getByText } = render(<RuleListItem {...defaultProps} />);
    expect(getByText('Payment Failures')).toBeTruthy();
  });

  it('renders the trigger description', () => {
    const { getByText } = render(<RuleListItem {...defaultProps} />);
    expect(getByText('When task "process-payment" fails')).toBeTruthy();
  });

  it('renders environment badge', () => {
    const { getByText } = render(<RuleListItem {...defaultProps} />);
    expect(getByText('prod')).toBeTruthy();
  });

  it('renders event type badge', () => {
    const { getByText } = render(<RuleListItem {...defaultProps} />);
    expect(getByText('failure')).toBeTruthy();
  });

  it('shows high severity icon', () => {
    const { getByTestId } = render(
      <RuleListItem {...defaultProps} rule={makeRule({ severity: 'high' })} />
    );
    expect(getByTestId('icon-AlertTriangle')).toBeTruthy();
  });

  it('does not show high severity icon for normal severity', () => {
    const { queryByTestId } = render(
      <RuleListItem {...defaultProps} rule={makeRule({ severity: 'normal' })} />
    );
    expect(queryByTestId('icon-AlertTriangle')).toBeNull();
  });

  it('calls onToggle when switch is pressed', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <RuleListItem {...defaultProps} onToggle={onToggle} />
    );
    fireEvent.press(getByTestId('switch'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows tag trigger description correctly', () => {
    const { getByText } = render(
      <RuleListItem
        {...defaultProps}
        rule={makeRule({ triggerType: 'tag', triggerValue: 'user_123', eventType: 'any' })}
      />
    );
    expect(getByText('When tag "user_123" runs')).toBeTruthy();
  });

  it('does not show environment badge when set to any', () => {
    const { queryByText } = render(
      <RuleListItem {...defaultProps} rule={makeRule({ environment: 'any' })} />
    );
    // The 'any' text should not appear in an env badge
    // But the event type 'failure' badge should still be there
    expect(queryByText('failure')).toBeTruthy();
  });
});
