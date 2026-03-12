import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RelatedRuns } from '@/components/runs/related-runs';
import type { CommonRunObject } from '@/services/api/runs';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    CheckCircle: createMockIcon('CheckCircle'),
    XOctagon: createMockIcon('XOctagon'),
    Clock: createMockIcon('Clock'),
    RefreshCw: createMockIcon('RefreshCw'),
    Pause: createMockIcon('Pause'),
    XCircle: createMockIcon('XCircle'),
    AlertTriangle: createMockIcon('AlertTriangle'),
    Slash: createMockIcon('Slash'),
    ServerCrash: createMockIcon('ServerCrash'),
    Loader: createMockIcon('Loader'),
    TimerOff: createMockIcon('TimerOff'),
    HelpCircle: createMockIcon('HelpCircle'),
    ChevronDown: createMockIcon('ChevronDown'),
    ChevronUp: createMockIcon('ChevronUp'),
  };
});

function makeMockRun(overrides: Partial<CommonRunObject> = {}): CommonRunObject {
  return {
    id: 'run_parent1',
    status: 'COMPLETED',
    taskIdentifier: 'parent-task',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:01:00Z',
    ...overrides,
  };
}

describe('RelatedRuns', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders nothing when relatedRuns is undefined', () => {
    const { toJSON } = render(<RelatedRuns relatedRuns={undefined} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when relatedRuns is empty', () => {
    const { toJSON } = render(<RelatedRuns relatedRuns={{}} />);
    expect(toJSON()).toBeNull();
  });

  it('renders parent run', () => {
    const parent = makeMockRun({ id: 'run_parent', taskIdentifier: 'parent-task' });
    const { getByText } = render(
      <RelatedRuns relatedRuns={{ parent }} />
    );
    expect(getByText('Parent Run')).toBeTruthy();
    expect(getByText('parent-task')).toBeTruthy();
    expect(getByText('run_parent')).toBeTruthy();
  });

  it('renders root run', () => {
    const root = makeMockRun({ id: 'run_root', taskIdentifier: 'root-task' });
    const { getByText } = render(
      <RelatedRuns relatedRuns={{ root }} />
    );
    expect(getByText('Root Run')).toBeTruthy();
    expect(getByText('root-task')).toBeTruthy();
  });

  it('renders child runs', () => {
    const children = [
      makeMockRun({ id: 'run_child1', taskIdentifier: 'child-1' }),
      makeMockRun({ id: 'run_child2', taskIdentifier: 'child-2' }),
    ];
    const { getByText } = render(
      <RelatedRuns relatedRuns={{ children }} />
    );
    expect(getByText('Child Runs (2)')).toBeTruthy();
    expect(getByText('child-1')).toBeTruthy();
    expect(getByText('child-2')).toBeTruthy();
  });

  it('navigates to related run on press', () => {
    const parent = makeMockRun({ id: 'run_parent123' });
    const { getByText } = render(
      <RelatedRuns relatedRuns={{ parent }} />
    );
    fireEvent.press(getByText('run_parent123'));
    expect(mockPush).toHaveBeenCalledWith('/(dashboard)/(runs)/run_parent123');
  });

  it('shows "View all" for more than 5 children', () => {
    const children = Array.from({ length: 7 }, (_, i) =>
      makeMockRun({ id: `run_child_${i}`, taskIdentifier: `child-${i}` })
    );
    const { getByText, queryByText } = render(
      <RelatedRuns relatedRuns={{ children }} />
    );
    expect(getByText('Child Runs (7)')).toBeTruthy();
    expect(getByText('View all 7 children')).toBeTruthy();
    // First 5 should be visible, rest hidden
    expect(getByText('child-0')).toBeTruthy();
    expect(getByText('child-4')).toBeTruthy();
    expect(queryByText('child-5')).toBeNull();
  });

  it('shows all children when "View all" is pressed', () => {
    const children = Array.from({ length: 7 }, (_, i) =>
      makeMockRun({ id: `run_child_${i}`, taskIdentifier: `child-${i}` })
    );
    const { getByText } = render(
      <RelatedRuns relatedRuns={{ children }} />
    );
    fireEvent.press(getByText('View all 7 children'));
    expect(getByText('child-6')).toBeTruthy();
    expect(getByText('Show less')).toBeTruthy();
  });
});
