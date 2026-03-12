import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TimelineNodeComponent } from '@/components/runs/timeline-node';
import type { TimelineNode } from '@/lib/timeline';

jest.mock('@/lib/format', () => ({
  formatDateTime: (d: string) => '2025-01-01 12:00 AM',
  formatDuration: (ms: number) => `${(ms / 1000).toFixed(0)}s`,
}));

describe('TimelineNodeComponent', () => {
  const baseNode: TimelineNode = {
    id: 'run_1-created',
    state: 'created',
    label: 'Created',
    timestamp: '2025-01-01T00:00:00Z',
    duration: 5000,
    isActive: false,
    isCurrent: false,
  };

  it('renders label and timestamp', () => {
    render(<TimelineNodeComponent node={baseNode} isLast={false} />);
    expect(screen.getByText('Created')).toBeTruthy();
    expect(screen.getByText('2025-01-01 12:00 AM')).toBeTruthy();
  });

  it('renders duration when present', () => {
    render(<TimelineNodeComponent node={baseNode} isLast={false} />);
    expect(screen.getByText('5s')).toBeTruthy();
  });

  it('does not render duration when null', () => {
    const node = { ...baseNode, duration: null };
    render(<TimelineNodeComponent node={node} isLast={true} />);
    expect(screen.queryByText(/\ds/)).toBeNull();
  });

  it('renders for active state', () => {
    const node = { ...baseNode, state: 'executing', label: 'Started', isActive: true };
    const { toJSON } = render(<TimelineNodeComponent node={node} isLast={false} />);
    expect(screen.getByText('Started')).toBeTruthy();
    expect(toJSON()).toBeTruthy();
  });

  it('renders for failed state', () => {
    const node = { ...baseNode, state: 'failed', label: 'Failed', duration: null };
    render(<TimelineNodeComponent node={node} isLast={true} />);
    expect(screen.getByText('Failed')).toBeTruthy();
  });
});
