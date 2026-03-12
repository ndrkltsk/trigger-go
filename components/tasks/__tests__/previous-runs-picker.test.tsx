import React, { createRef } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreviousRunsPicker } from '@/components/tasks/previous-runs-picker';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';

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
  };
});

const mockSheetPresent = jest.fn().mockResolvedValue(undefined);
const mockSheetDismiss = jest.fn().mockResolvedValue(undefined);

jest.mock('@/components/ui/bottom-sheet', () => {
  const { View } = require('react-native');
  const React = require('react');
  return {
    BottomSheet: React.forwardRef(({ children }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        present: mockSheetPresent,
        dismiss: mockSheetDismiss,
      }));
      return <View>{children}</View>;
    }),
  };
});

const mockListRuns = jest.fn();
const mockRetrieveRun = jest.fn();

jest.mock('@/services/api/runs', () => ({
  listRuns: (...args: unknown[]) => mockListRuns(...args),
  retrieveRun: (...args: unknown[]) => mockRetrieveRun(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const MOCK_RUNS = {
  data: [
    {
      id: 'run_abc',
      status: 'COMPLETED' as const,
      taskIdentifier: 'my-task',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      updatedAt: new Date().toISOString(),
      isTest: false,
      env: { id: 'env_1', name: 'dev' },
    },
    {
      id: 'run_def',
      status: 'FAILED' as const,
      taskIdentifier: 'my-task',
      createdAt: new Date(Date.now() - 7200_000).toISOString(),
      updatedAt: new Date().toISOString(),
      isTest: false,
      env: { id: 'env_1', name: 'dev' },
    },
  ],
};

describe('PreviousRunsPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListRuns.mockResolvedValue(MOCK_RUNS);
  });

  it('renders dialog title', async () => {
    const ref = createRef<BottomSheetRef>();
    const { findByText } = render(
      <PreviousRunsPicker
        ref={ref}
        taskIdentifier="my-task"
        onSelect={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );
    expect(await findByText('Select a Previous Run')).toBeTruthy();
  });

  it('displays run IDs when data loads', async () => {
    const ref = createRef<BottomSheetRef>();
    // Present to enable the query
    const { findByText } = render(
      <PreviousRunsPicker
        ref={ref}
        taskIdentifier="my-task"
        onSelect={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );
    // Trigger present to set isOpen=true which enables the query
    await ref.current?.present();
    expect(await findByText('run_abc')).toBeTruthy();
    expect(await findByText('run_def')).toBeTruthy();
  });

  it('calls onSelect with payload when a run is selected', async () => {
    const onSelect = jest.fn();
    mockRetrieveRun.mockResolvedValue({
      id: 'run_abc',
      status: 'COMPLETED',
      taskIdentifier: 'my-task',
      payload: { message: 'hello' },
    });

    const ref = createRef<BottomSheetRef>();
    const { findByText } = render(
      <PreviousRunsPicker
        ref={ref}
        taskIdentifier="my-task"
        onSelect={onSelect}
      />,
      { wrapper: createWrapper() }
    );

    await ref.current?.present();
    const runRow = await findByText('run_abc');
    fireEvent.press(runRow);

    await waitFor(() => {
      expect(mockRetrieveRun).toHaveBeenCalledWith('run_abc');
      expect(onSelect).toHaveBeenCalledWith({ message: 'hello' });
      expect(mockSheetDismiss).toHaveBeenCalled();
    });
  });
});
