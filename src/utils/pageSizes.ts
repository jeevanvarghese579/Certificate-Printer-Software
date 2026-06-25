import type { PageSetup } from '../types';

const PX_PER_MM = 3.7795;

export interface PageSizePreset {
  label: string;
  widthCm: number;
  heightCm: number;
}

export const PAGE_PRESETS: Record<string, PageSizePreset> = {
  'a4-landscape': { label: 'A4 Landscape', widthCm: 29.7, heightCm: 21.0 },
  'a4-portrait': { label: 'A4 Portrait', widthCm: 21.0, heightCm: 29.7 },
  'a3-landscape': { label: 'A3 Landscape', widthCm: 42.0, heightCm: 29.7 },
  'a3-portrait': { label: 'A3 Portrait', widthCm: 29.7, heightCm: 42.0 },
  letter: { label: 'Letter', widthCm: 21.6, heightCm: 27.9 },
  legal: { label: 'Legal', widthCm: 21.6, heightCm: 35.6 },
  custom: { label: 'Custom', widthCm: 0, heightCm: 0 },
};

export const mmToPx = (mm: number): number => Math.round(mm * PX_PER_MM);
export const pxToMm = (px: number): number => px / PX_PER_MM;
export const cmToPx = (cm: number): number => mmToPx(cm * 10);
export const pxToCm = (px: number): number => pxToMm(px) / 10;

export const getDefaultPageSetup = (): PageSetup => ({
  preset: 'a4-landscape',
  width: cmToPx(29.7),
  height: cmToPx(21.0),
  orientation: 'landscape',
});

export const pageSetupFromPreset = (key: string, customWidthCm?: number, customHeightCm?: number): PageSetup => {
  const preset = PAGE_PRESETS[key];
  if (!preset) return getDefaultPageSetup();

  if (key === 'custom' && customWidthCm && customHeightCm) {
    return {
      preset: 'custom',
      width: cmToPx(customWidthCm),
      height: cmToPx(customHeightCm),
      orientation: customWidthCm > customHeightCm ? 'landscape' : 'portrait',
    };
  }

  return {
    preset: key,
    width: cmToPx(preset.widthCm),
    height: cmToPx(preset.heightCm),
    orientation: preset.widthCm > preset.heightCm ? 'landscape' : 'portrait',
  };
};

export const getPresetCm = (setup: PageSetup): { widthCm: number; heightCm: number } => ({
  widthCm: Math.round(pxToCm(setup.width) * 100) / 100,
  heightCm: Math.round(pxToCm(setup.height) * 100) / 100,
});
