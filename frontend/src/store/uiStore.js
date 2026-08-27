import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  activeExperimentId: null,
  setActiveExperiment: (id) => set({ activeExperimentId: id }),
}));
