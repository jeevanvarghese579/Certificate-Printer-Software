import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student, Category } from '../types';
import { generateId } from '../utils/id';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-name', name: 'Student Name', isDefault: true },
  { id: 'cat-item', name: 'Item', isDefault: true },
  { id: 'cat-reg', name: 'Reg No', isDefault: true },
  { id: 'cat-class', name: 'Class', isDefault: true },
  { id: 'cat-position', name: 'Position', isDefault: true },
  { id: 'cat-grade', name: 'Grade', isDefault: true },
];

interface StudentState {
  students: Student[];
  categories: Category[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, data: Record<string, string>) => void;
  deleteStudent: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  addImportedStudents: (students: Student[], newCategories: Category[]) => void;
  clearAll: () => void;
  getSnapshot: () => { students: Student[]; categories: Category[] };
  restoreSnapshot: (snapshot: { students: Student[]; categories: Category[] }) => void;
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      students: [],
      categories: [...DEFAULT_CATEGORIES],

      addStudent: (student) =>
        set((s) => ({
          students: [...s.students, { ...student, id: generateId() }],
        })),

      updateStudent: (id, data) =>
        set((s) => ({
          students: s.students.map((st) =>
            st.id === id ? { ...st, data } : st
          ),
        })),

      deleteStudent: (id) =>
        set((s) => ({
          students: s.students.filter((st) => st.id !== id),
        })),

      addCategory: (name) =>
        set((s) => {
          if (s.categories.some((c) => c.name === name)) return s;
          return {
            categories: [
              ...s.categories,
              { id: generateId(), name, isDefault: false },
            ],
          };
        }),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
        })),

      addImportedStudents: (students, newCategories) =>
        set((s) => ({
          students: [...s.students, ...students],
          categories: [...s.categories, ...newCategories],
        })),

      clearAll: () =>
        set({
          students: [],
          categories: [...DEFAULT_CATEGORIES],
        }),

      getSnapshot: () => {
        const { students, categories } = get();
        return { students, categories };
      },

      restoreSnapshot: (snapshot) =>
        set({
          students: snapshot.students,
          categories: snapshot.categories,
        }),
    }),
    { name: 'cps-students' }
  )
);
