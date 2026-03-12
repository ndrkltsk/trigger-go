import React from 'react';
import { render } from '@testing-library/react-native';
import { ProjectSelector } from '@/components/shared/project-selector';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Check: createMockIcon('Check'),
    RefreshCw: createMockIcon('RefreshCw'),
  };
});

const mockProjects = [
  { id: 'p1', externalRef: 'proj_abc', name: 'Project A', slug: 'project-a', createdAt: '', organization: { id: 'o1', title: 'Org', slug: 'org', createdAt: '' } },
  { id: 'p2', externalRef: 'proj_xyz', name: 'Project B', slug: 'project-b', createdAt: '', organization: { id: 'o1', title: 'Org', slug: 'org', createdAt: '' } },
];

jest.mock('@/hooks/api/use-projects', () => ({
  useProjects: () => ({ data: mockProjects, isLoading: false, isError: false, refetch: jest.fn() }),
  useSwitchProject: () => ({ mutate: jest.fn(), isPending: false }),
  projectKeys: { all: ['projects'] },
}));

const authInitial = useAuthStore.getState();

beforeEach(() => {
  useAuthStore.setState(authInitial);
});

describe('ProjectSelector', () => {
  it('renders project list', () => {
    useAuthStore.setState({ projectRef: 'proj_abc' });
    const { getByText } = render(<ProjectSelector />);
    expect(getByText('Projects')).toBeTruthy();
    expect(getByText('Project A')).toBeTruthy();
    expect(getByText('Project B')).toBeTruthy();
  });

  it('shows current project with checkmark', () => {
    useAuthStore.setState({ projectRef: 'proj_abc' });
    const { getByText } = render(<ProjectSelector />);
    expect(getByText('proj_abc')).toBeTruthy();
  });
});
