import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TemplateElement, PageSetup } from '../types';
import { generateId } from '../utils/id';
import { getDefaultPageSetup } from '../utils/pageSizes';

interface TemplateState {
  elements: TemplateElement[];
  pageSetup: PageSetup;
  addElement: (element: Omit<TemplateElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<TemplateElement>) => void;
  deleteElement: (id: string) => void;
  setPageSetup: (setup: PageSetup) => void;
  clearAll: () => void;
  getSnapshot: () => { elements: TemplateElement[]; pageSetup: PageSetup };
  restoreSnapshot: (snapshot: { elements: TemplateElement[]; pageSetup: PageSetup }) => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      elements: [],
      pageSetup: getDefaultPageSetup(),

      addElement: (element) =>
        set((s) => ({
          elements: [...s.elements, { ...element, id: generateId() }],
        })),

      updateElement: (id, updates) =>
        set((s) => ({
          elements: s.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el
          ),
        })),

      deleteElement: (id) =>
        set((s) => ({
          elements: s.elements.filter((el) => el.id !== id),
        })),

      setPageSetup: (setup) => set({ pageSetup: setup }),

      clearAll: () =>
        set({
          elements: [],
          pageSetup: getDefaultPageSetup(),
        }),

      getSnapshot: () => {
        const { elements, pageSetup } = get();
        return { elements, pageSetup };
      },

      restoreSnapshot: (snapshot) =>
        set({
          elements: snapshot.elements,
          pageSetup: snapshot.pageSetup,
        }),
    }),
    { name: 'cps-template' }
  )
);
