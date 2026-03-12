import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { SavedProject } from '@/services/api/projects';

const STORAGE_KEY = 'saved_projects';

interface ProjectsState {
  savedProjects: SavedProject[];
  addProject: (project: SavedProject) => void;
  removeProject: (projectRef: string) => void;
  loadProjects: () => void;
}

function persistProjects(projects: SavedProject[]) {
  storage.set(STORAGE_KEY, JSON.stringify(projects));
}

function loadPersistedProjects(): SavedProject[] {
  const raw = storage.getString(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedProject[];
  } catch {
    return [];
  }
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  savedProjects: [],

  addProject: (project) => {
    const { savedProjects } = get();
    if (savedProjects.some((p) => p.projectRef === project.projectRef)) return;
    const updated = [...savedProjects, project];
    persistProjects(updated);
    set({ savedProjects: updated });
  },

  removeProject: (projectRef) => {
    const updated = get().savedProjects.filter((p) => p.projectRef !== projectRef);
    persistProjects(updated);
    set({ savedProjects: updated });
  },

  loadProjects: () => {
    set({ savedProjects: loadPersistedProjects() });
  },
}));
