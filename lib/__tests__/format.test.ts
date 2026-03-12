import { formatRelativeTime, formatDuration, formatCost } from '@/lib/format';

describe('formatRelativeTime', () => {
  it('returns a relative time string for a valid date', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(result).toContain('minutes ago');
  });

  it('returns -- for null input', () => {
    expect(formatRelativeTime(null)).toBe('--');
  });

  it('returns -- for undefined input', () => {
    expect(formatRelativeTime(undefined)).toBe('--');
  });

  it('returns -- for invalid date string', () => {
    expect(formatRelativeTime('not-a-date')).toBe('--');
  });
});

describe('formatDuration', () => {
  it('formats sub-second durations in milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('formats 0ms', () => {
    expect(formatDuration(0)).toBe('0ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(2500)).toBe('3s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125_000)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3_720_000)).toBe('1h 2m');
  });

  it('returns -- for null', () => {
    expect(formatDuration(null)).toBe('--');
  });

  it('returns -- for undefined', () => {
    expect(formatDuration(undefined)).toBe('--');
  });
});

describe('formatCost', () => {
  it('returns Free for zero cost', () => {
    expect(formatCost(0)).toBe('Free');
  });

  it('formats cents as dollars', () => {
    expect(formatCost(12)).toBe('$0.1200');
  });

  it('formats larger costs', () => {
    expect(formatCost(150)).toBe('$1.5000');
  });

  it('returns -- for null', () => {
    expect(formatCost(null)).toBe('--');
  });

  it('returns -- for undefined', () => {
    expect(formatCost(undefined)).toBe('--');
  });
});
