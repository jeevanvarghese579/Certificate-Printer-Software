import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSnapshot } from '../types';
import { useStudentStore } from './useStudentStore';
import { useTemplateStore } from './useTemplateStore';

const MAX_HISTORY = 50;

interface SettingsState {
  theme: 'light' | 'dark';
  undoStack: AppSnapshot[];
  redoStack: AppSnapshot[];
  toggleTheme: () => void;
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  resetEverything: () => void;
}

const captureSnapshot = (): AppSnapshot => {
  const studentSnap = useStudentStore.getState().getSnapshot();
  const templateSnap = useTemplateStore.getState().getSnapshot();
  return {
    students: studentSnap.students,
    categories: studentSnap.categories,
    elements: templateSnap.elements,
    pageSetup: templateSnap.pageSetup,
  };
};

const restoreSnapshot = (snapshot: AppSnapshot) => {
  useStudentStore.getState().restoreSnapshot({
    students: snapshot.students,
    categories: snapshot.categories,
  });
  useTemplateStore.getState().restoreSnapshot({
    elements: snapshot.elements,
    pageSetup: snapshot.pageSetup,
  });
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      undoStack: [],
      redoStack: [],

      toggleTheme: () =>
        set((s) => ({
          theme: s.theme === 'light' ? 'dark' : 'light',
        })),

      pushSnapshot: () =>
        set((s) => {
          const snapshot = captureSnapshot();
          const undoStack = [...s.undoStack, snapshot].slice(-MAX_HISTORY);
          return { undoStack, redoStack: [] };
        }),

      undo: () =>
        set((s) => {
          if (s.undoStack.length === 0) return s;
          const current = captureSnapshot();
          const undoStack = [...s.undoStack];
          const snapshot = undoStack.pop()!;
          restoreSnapshot(snapshot);
          return {
            undoStack,
            redoStack: [...s.redoStack, current].slice(-MAX_HISTORY),
          };
        }),

      redo: () =>
        set((s) => {
          if (s.redoStack.length === 0) return s;
          const current = captureSnapshot();
          const redoStack = [...s.redoStack];
          const snapshot = redoStack.pop()!;
          restoreSnapshot(snapshot);
          return {
            undoStack: [...s.undoStack, current].slice(-MAX_HISTORY),
            redoStack,
          };
        }),

      resetEverything: () => {
        const snapshot = captureSnapshot();
        set({ undoStack: [snapshot], redoStack: [] });
        useStudentStore.getState().clearAll();
        useTemplateStore.getState().clearAll();
      },
    }),
    {
      name: 'cps-settings',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
