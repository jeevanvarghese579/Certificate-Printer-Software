export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Student {
  id: string;
  data: Record<string, string>;
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'field';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text?: string;
  fieldName?: string;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: string;
  src?: string;
}

export interface PageSetup {
  preset: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
}

export type ActivePanel = 'results' | 'setup' | 'print' | 'settings';

export interface AppSnapshot {
  students: Student[];
  categories: Category[];
  elements: TemplateElement[];
  pageSetup: PageSetup;
}
