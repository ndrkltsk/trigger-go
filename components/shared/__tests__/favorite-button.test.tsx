import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FavoriteButton } from '@/components/shared/favorite-button';
import { useFavoritesStore } from '@/stores/favorites-store';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Star: createMockIcon('Star'),
  };
});

const initialState = useFavoritesStore.getState();

beforeEach(() => {
  useFavoritesStore.setState(initialState);
  useFavoritesStore.setState({ favorites: [] });
});

describe('FavoriteButton', () => {
  it('renders with Pin label when not favorited', () => {
    const { getByLabelText } = render(
      <FavoriteButton itemId="sched_1" itemType="schedule" itemName="My Schedule" />
    );
    expect(getByLabelText('Pin My Schedule')).toBeTruthy();
  });

  it('renders with Unpin label when favorited', () => {
    useFavoritesStore.getState().addFavorite({
      id: 'sched_1',
      type: 'schedule',
      name: 'My Schedule',
    });
    const { getByLabelText } = render(
      <FavoriteButton itemId="sched_1" itemType="schedule" itemName="My Schedule" />
    );
    expect(getByLabelText('Unpin My Schedule')).toBeTruthy();
  });

  it('adds favorite on press when not favorited', async () => {
    const { getByLabelText } = render(
      <FavoriteButton itemId="sched_1" itemType="schedule" itemName="My Schedule" />
    );
    fireEvent.press(getByLabelText('Pin My Schedule'));
    await waitFor(() => {
      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    });
  });

  it('removes favorite on press when already favorited', async () => {
    useFavoritesStore.getState().addFavorite({
      id: 'sched_1',
      type: 'schedule',
      name: 'My Schedule',
    });
    const { getByLabelText } = render(
      <FavoriteButton itemId="sched_1" itemType="schedule" itemName="My Schedule" />
    );
    fireEvent.press(getByLabelText('Unpin My Schedule'));
    await waitFor(() => {
      expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    });
  });
});
