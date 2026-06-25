import type { TemplateElement, PageSetup, Student } from '../types';

export const resolveFieldText = (
  element: TemplateElement,
  student: Student | null
): string => {
  if (element.type === 'field' && element.fieldName) {
    if (student && student.data[element.fieldName]) {
      return student.data[element.fieldName];
    }
    return `{{${element.fieldName}}}`;
  }
  return element.text || '';
};

export const getDisplayText = (
  element: TemplateElement,
  student: Student | null
): string => {
  return resolveFieldText(element, student);
};

export const buildFontStyle = (element: TemplateElement): string => {
  let style = '';
  if (element.bold) style += 'bold ';
  if (element.italic) style += 'italic ';
  return style.trim() || 'normal';
};
