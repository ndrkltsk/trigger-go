import { useProjectsStore } from '@/stores/projects-store';

const initialState = useProjectsStore.getState();

beforeEach(() => {
  useProjectsStore.setState(initialState);
  useProjectsStore.setState({ savedProjects: [] });
});

describe('projects store', () => {
  it('starts with no saved projects', () => {
    expect(useProjectsStore.getState().savedProjects).toEqual([]);
  });

  it('addProject adds a project', () => {
    useProjectsStore.getState().addProject({ projectRef: 'proj_abc', name: 'My Project' });
    expect(useProjectsStore.getState().savedProjects).toHaveLength(1);
    expect(useProjectsStore.getState().savedProjects[0].projectRef).toBe('proj_abc');
  });

  it('addProject prevents duplicates', () => {
    useProjectsStore.getState().addProject({ projectRef: 'proj_abc', name: 'My Project' });
    useProjectsStore.getState().addProject({ projectRef: 'proj_abc', name: 'My Project' });
    expect(useProjectsStore.getState().savedProjects).toHaveLength(1);
  });

  it('removeProject removes a project', () => {
    useProjectsStore.getState().addProject({ projectRef: 'proj_abc', name: 'Project A' });
    useProjectsStore.getState().addProject({ projectRef: 'proj_xyz', name: 'Project B' });
    useProjectsStore.getState().removeProject('proj_abc');
    expect(useProjectsStore.getState().savedProjects).toHaveLength(1);
    expect(useProjectsStore.getState().savedProjects[0].projectRef).toBe('proj_xyz');
  });

  it('addProject stores name correctly', () => {
    useProjectsStore.getState().addProject({ projectRef: 'proj_abc', name: 'Custom Name' });
    expect(useProjectsStore.getState().savedProjects[0].name).toBe('Custom Name');
  });
});
