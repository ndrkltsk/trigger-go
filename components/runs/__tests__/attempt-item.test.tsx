import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AttemptItem } from '../attempt-item';
import type { SpanSummary } from '@/services/api/runs';

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const mockIcon = (name: string) => {
    const MockIcon = (props: any) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    CheckCircle: mockIcon('CheckCircle'),
    XOctagon: mockIcon('XOctagon'),
    XCircle: mockIcon('XCircle'),
    Clock: mockIcon('Clock'),
    Loader: mockIcon('Loader'),
    Pause: mockIcon('Pause'),
    ChevronDown: mockIcon('ChevronDown'),
    AlertTriangle: mockIcon('AlertTriangle'),
    HelpCircle: mockIcon('HelpCircle'),
  };
});

// Mock nativewind
jest.mock('nativewind', () => ({
  cssInterop: jest.fn(),
}));

// Mock the UI components that depend on reanimated / rn-primitives
jest.mock('@/components/ui/accordion', () => {
  const { View } = require('react-native');
  return {
    Accordion: ({ children }: any) => <View>{children}</View>,
    AccordionItem: ({ children }: any) => <View>{children}</View>,
    AccordionTrigger: ({ children }: any) => <View>{children}</View>,
    AccordionContent: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('@/components/ui/collapsible', () => {
  const { View } = require('react-native');
  return {
    Collapsible: ({ children }: any) => <View>{children}</View>,
    CollapsibleTrigger: ({ children }: any) => <View>{children}</View>,
    CollapsibleContent: ({ children }: any) => <View>{children}</View>,
  };
});

function makeSpan(overrides: Partial<SpanSummary['data']> & { id?: string } = {}): SpanSummary {
  const { id, ...dataOverrides } = overrides;
  return {
    id: id ?? 'span_001',
    parentId: null,
    runId: 'run_001',
    data: {
      message: 'attempt',
      startTime: '2024-01-15T10:42:00Z',
      duration: 30000,
      isError: false,
      isPartial: false,
      isCancelled: false,
      level: 'TRACE',
      attemptNumber: 1,
      events: [],
      ...dataOverrides,
    },
    children: [],
  };
}

describe('AttemptItem', () => {
  it('renders attempt number', () => {
    const span = makeSpan();
    render(<AttemptItem span={span} attemptNumber={1} isLatest={false} />);
    expect(screen.getByText('Attempt #1')).toBeTruthy();
  });

  it('renders "Completed" label for successful attempt', () => {
    const span = makeSpan();
    render(<AttemptItem span={span} attemptNumber={1} isLatest={false} />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders "Failed" label for failed attempt', () => {
    const span = makeSpan({
      isError: true,
      events: [{
        name: 'exception',
        time: '2024-01-15T10:42:30Z',
        properties: {
          exception: {
            type: 'TimeoutError',
            message: 'Connection timed out',
            stacktrace: 'at fetch (/app/index.ts:10)',
          },
        },
      }],
    });
    render(<AttemptItem span={span} attemptNumber={2} isLatest={false} />);
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('renders error details for failed attempt', () => {
    const span = makeSpan({
      isError: true,
      events: [{
        name: 'exception',
        time: '2024-01-15T10:42:30Z',
        properties: {
          exception: {
            type: 'TimeoutError',
            message: 'Connection timed out',
            stacktrace: 'at fetch (/app/index.ts:10)',
          },
        },
      }],
    });
    render(<AttemptItem span={span} attemptNumber={2} isLatest={false} />);
    expect(screen.getByText('TimeoutError')).toBeTruthy();
    expect(screen.getByText('Connection timed out')).toBeTruthy();
  });

  it('renders "Completed successfully" for successful attempt content', () => {
    const span = makeSpan();
    render(<AttemptItem span={span} attemptNumber={1} isLatest={false} />);
    expect(screen.getByText('Completed successfully')).toBeTruthy();
  });

  it('renders duration when provided', () => {
    const span = makeSpan({ duration: 30000 });
    render(<AttemptItem span={span} attemptNumber={1} isLatest={false} />);
    expect(screen.getByText('30s')).toBeTruthy();
  });

  it('renders "Latest" badge when isLatest is true', () => {
    const span = makeSpan();
    render(<AttemptItem span={span} attemptNumber={3} isLatest={true} />);
    expect(screen.getByText('Latest')).toBeTruthy();
  });

  it('does not render "Latest" badge when isLatest is false', () => {
    const span = makeSpan();
    render(<AttemptItem span={span} attemptNumber={1} isLatest={false} />);
    expect(screen.queryByText('Latest')).toBeNull();
  });

  it('renders stack trace text for failed attempt with stack', () => {
    const span = makeSpan({
      isError: true,
      events: [{
        name: 'exception',
        time: '2024-01-15T10:42:30Z',
        properties: {
          exception: {
            type: 'Error',
            message: 'Something broke',
            stacktrace: 'Error: Something broke\n  at handler (/src/main.ts:42)',
          },
        },
      }],
    });
    render(<AttemptItem span={span} attemptNumber={1} isLatest={false} />);
    expect(screen.getByText('Stack trace')).toBeTruthy();
  });
});
