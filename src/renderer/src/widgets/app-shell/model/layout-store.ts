import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type LayoutStore = {
  /** Menu lateral de navegação (controlado pelo clique no logo). */
  sidebarCollapsed: boolean;
  /** Bandeja esquerda da página (ex.: Blocos no Flows). */
  leftTrayCollapsed: boolean;
  /** Bandeja direita da página (ex.: Tracking no Flows). */
  rightTrayCollapsed: boolean;
  toggleSidebar: () => void;
  toggleLeftTray: () => void;
  toggleRightTray: () => void;
};

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      leftTrayCollapsed: false,
      rightTrayCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleLeftTray: () =>
        set((s) => ({ leftTrayCollapsed: !s.leftTrayCollapsed })),
      toggleRightTray: () =>
        set((s) => ({ rightTrayCollapsed: !s.rightTrayCollapsed })),
    }),
    {
      name: 'flowtest.layout.v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
