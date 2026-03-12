import { isValidTokenFormat } from '@/lib/validation';

describe('isValidTokenFormat', () => {
  it('returns true for valid PAT tokens', () => {
    expect(isValidTokenFormat('tr_pat_abc123')).toBe(true);
  });

  it('returns false for secret keys', () => {
    expect(isValidTokenFormat('tr_dev_abc123')).toBe(false);
    expect(isValidTokenFormat('tr_stg_abc123')).toBe(false);
    expect(isValidTokenFormat('tr_prod_abc123')).toBe(false);
  });

  it('returns false for invalid tokens', () => {
    expect(isValidTokenFormat('invalid')).toBe(false);
    expect(isValidTokenFormat('')).toBe(false);
    expect(isValidTokenFormat('tr_')).toBe(false);
  });
});
