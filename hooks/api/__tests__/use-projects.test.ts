import { projectKeys } from '@/hooks/api/use-projects';

describe('projectKeys', () => {
  it('all returns base key', () => {
    expect(projectKeys.all).toEqual(['projects']);
  });
});
