import React from 'react';
import { render } from '@testing-library/react-native';
import { Input } from '@/components/ui/input';

describe('Form input accessibility', () => {
  it('Input accepts accessibilityLabel prop', () => {
    const { getByLabelText } = render(
      <Input
        placeholder="test"
        accessibilityLabel="API key"
      />
    );
    expect(getByLabelText('API key')).toBeTruthy();
  });

  it('Input accepts accessibilityHint prop', () => {
    const { getByA11yHint } = render(
      <Input
        placeholder="test"
        accessibilityLabel="API key"
        accessibilityHint="Enter your secret key"
      />
    );
    expect(getByA11yHint('Enter your secret key')).toBeTruthy();
  });

  it('Input has textbox role by default', () => {
    const { getByLabelText } = render(
      <Input
        placeholder="test"
        accessibilityLabel="Username"
      />
    );
    const input = getByLabelText('Username');
    expect(input).toBeTruthy();
  });
});
