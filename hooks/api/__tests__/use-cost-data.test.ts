import { costKeys } from '@/hooks/api/use-cost-data';

describe('costKeys', () => {
  it('all returns base key', () => {
    expect(costKeys.all).toEqual(['costs']);
  });

  it('summary includes period', () => {
    expect(costKeys.summary('24h')).toEqual(['costs', 'summary', '24h']);
    expect(costKeys.summary('7d')).toEqual(['costs', 'summary', '7d']);
    expect(costKeys.summary('30d')).toEqual(['costs', 'summary', '30d']);
  });
});
