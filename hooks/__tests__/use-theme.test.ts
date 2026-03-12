import { useTheme } from '@/hooks/use-theme';

describe('theme', () => {
  it('always returns dark', () => {
    const { theme, isDark } = useTheme();
    expect(theme).toBe('dark');
    expect(isDark).toBe(true);
  });
});
