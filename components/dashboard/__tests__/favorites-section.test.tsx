import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FavoritesSection } from '@/components/dashboard/favorites-section';
import { useFavoritesStore } from '@/stores/favorites-store';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: any) => <Text>{name}</Text>;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Layers: createMockIcon('Layers'),
    CalendarClock: createMockIcon('CalendarClock'),
    Tag: createMockIcon('Tag'),
    Star: createMockIcon('Star'),
  };
});

const initialState = useFavoritesStore.getState();

beforeEach(() => {
  useFavoritesStore.setState(initialState);
  useFavoritesStore.setState({ favorites: [] });
  mockPush.mockClear();
});

describe('FavoritesSection', () => {
  it('renders nothing when no favorites', () => {
    const { toJSON } = render(<FavoritesSection />);
    expect(toJSON()).toBeNull();
  });

  it('renders favorites when they exist', () => {
    useFavoritesStore.setState({
      favorites: [
        { id: 'sched_1', type: 'schedule', name: 'My Schedule' },
        { id: 'task_1', type: 'task', name: 'My Task' },
      ],
    });
    const { getByText } = render(<FavoritesSection />);
    expect(getByText('My Schedule')).toBeTruthy();
    expect(getByText('My Task')).toBeTruthy();
  });

  it('shows Favorites header', () => {
    useFavoritesStore.setState({
      favorites: [{ id: 'sched_1', type: 'schedule', name: 'Test' }],
    });
    const { getByText } = render(<FavoritesSection />);
    expect(getByText('Favorites')).toBeTruthy();
  });

  it('shows type badges', () => {
    useFavoritesStore.setState({
      favorites: [
        { id: 'sched_1', type: 'schedule', name: 'My Schedule' },
      ],
    });
    const { getByText } = render(<FavoritesSection />);
    expect(getByText('Schedule')).toBeTruthy();
  });

  it('navigates to schedule on press', () => {
    useFavoritesStore.setState({
      favorites: [{ id: 'sched_1', type: 'schedule', name: 'My Schedule' }],
    });
    const { getByText } = render(<FavoritesSection />);
    fireEvent.press(getByText('My Schedule'));
    expect(mockPush).toHaveBeenCalledWith('/(dashboard)/(settings)/schedule/sched_1');
  });

  it('navigates to task on press', () => {
    useFavoritesStore.setState({
      favorites: [{ id: 'task_1', type: 'task', name: 'My Task' }],
    });
    const { getByText } = render(<FavoritesSection />);
    fireEvent.press(getByText('My Task'));
    expect(mockPush).toHaveBeenCalledWith('/(dashboard)/(tasks)/task_1');
  });

  it('navigates to runs on tag-filter press', () => {
    useFavoritesStore.setState({
      favorites: [{ id: 'tag_user', type: 'tag-filter', name: 'user_123' }],
    });
    const { getByText } = render(<FavoritesSection />);
    fireEvent.press(getByText('user_123'));
    expect(mockPush).toHaveBeenCalledWith('/(dashboard)/(runs)');
  });
});
