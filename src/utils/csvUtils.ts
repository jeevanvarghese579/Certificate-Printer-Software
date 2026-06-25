import Papa from 'papaparse';
import type { Student, Category } from '../types';
import { generateId } from './id';

export const parseCSV = (file: File): Promise<{ rows: Record<string, string>[]; headers: string[] }> =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
          return;
        }
        const rows = results.data as Record<string, string>[];
        const headers = results.meta.fields || [];
        resolve({ rows, headers });
      },
      error: (err: Error) => reject(err),
    });
  });

export const importCSVToStudents = (
  rows: Record<string, string>[],
  headers: string[],
  existingCategories: Category[]
): { students: Student[]; newCategories: Category[] } => {
  const existingNames = new Set(existingCategories.map((c) => c.name));
  const newCategories: Category[] = [];

  for (const header of headers) {
    const trimmed = header.trim();
    if (trimmed && !existingNames.has(trimmed)) {
      newCategories.push({ id: generateId(), name: trimmed, isDefault: false });
      existingNames.add(trimmed);
    }
  }

  const students: Student[] = rows.map((row) => {
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      data[key.trim()] = (value || '').trim();
    }
    return { id: generateId(), data };
  });

  return { students, newCategories };
};

export const exportStudentsToCSV = (
  students: Student[],
  categories: Category[]
): string => {
  const headers = categories.map((c) => c.name);
  const rows = students.map((s) => {
    const row: Record<string, string> = {};
    for (const h of headers) {
      row[h] = s.data[h] || '';
    }
    return row;
  });
  return Papa.unparse({ fields: headers, data: rows });
};
