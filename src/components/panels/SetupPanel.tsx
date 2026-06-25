import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Transformer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import {
  Type,
  Image as ImageIcon,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { useTemplateStore } from '../../store/useTemplateStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { PAGE_PRESETS, pageSetupFromPreset, getPresetCm, cmToPx } from '../../utils/pageSizes';
import FullscreenCanvas from '../FullscreenCanvas';
import type { TemplateElement } from '../../types';

const FONT_FAMILIES = [
  'Inter',
  'Georgia',
  'Times New Roman',
  'Arial',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
];

const SCALE_FACTOR = 0.5;

const SetupPanel: React.FC = () => {
  const { elements, pageSetup, addElement, updateElement, deleteElement, setPageSetup } =
    useTemplateStore();
  const pushSnapshot = useSettingsStore((s) => s.pushSnapshot);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addTextModal, setAddTextModal] = useState(false);
  const [newText, setNewText] = useState('');
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetCm = getPresetCm(pageSetup);
  const [customWidthCm, setCustomWidthCm] = useState(String(presetCm.widthCm));
  const [customHeightCm, setCustomHeightCm] = useState(String(presetCm.heightCm));

  useEffect(() => {
    if (pageSetup.preset !== 'custom') {
      setCustomWidthCm(String(presetCm.widthCm));
      setCustomHeightCm(String(presetCm.heightCm));
    }
  }, [pageSetup.preset, presetCm.widthCm, presetCm.heightCm]);

  const handleCustomWidthBlur = () => {
    const val = parseFloat(customWidthCm);
    if (!isNaN(val) && val > 0) {
      const w = cmToPx(val);
      setPageSetup({
        ...pageSetup,
        preset: 'custom',
        width: w,
        orientation: w > pageSetup.height ? 'landscape' : 'portrait',
      });
    }
  };

  const handleCustomHeightBlur = () => {
    const val = parseFloat(customHeightCm);
    if (!isNaN(val) && val > 0) {
      const h = cmToPx(val);
      setPageSetup({
        ...pageSetup,
        preset: 'custom',
        height: h,
        orientation: pageSetup.width > h ? 'landscape' : 'portrait',
      });
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  const stageWidth = pageSetup.width;
  const stageHeight = pageSetup.height;

  useEffect(() => {
    elements.forEach((el) => {
      if (el.type === 'image' && el.src && !images[el.id]) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = el.src;
        img.onload = () => {
          setImages((prev) => ({ ...prev, [el.id]: img }));
        };
      }
    });
  }, [elements]);

  useEffect(() => {
    if (!transformerRef.current || !selectedId) return;
    const stage = stageRef.current;
    if (!stage) return;
    const node = stage.findOne(`#${selectedId}`);
    if (node) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
  };

  const handleElementClick = (id: string) => setSelectedId(id);

  const handleTransformEnd = useCallback(
    (el: TemplateElement, node: Konva.Node) => {
      pushSnapshot();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      updateElement(el.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      });
    },
    [pushSnapshot, updateElement]
  );

  const handleDragEnd = useCallback(
    (el: TemplateElement, node: Konva.Node) => {
      pushSnapshot();
      updateElement(el.id, { x: node.x(), y: node.y() });
    },
    [pushSnapshot, updateElement]
  );

  const handleAddText = () => {
    if (!newText.trim()) return;
    pushSnapshot();
    addElement({
      type: 'text',
      x: pageSetup.width / 2 - 200,
      y: pageSetup.height / 2 - 20,
      width: 400,
      height: 40,
      rotation: 0,
      text: newText,
      fontFamily: 'Georgia',
      fontSize: 24,
      bold: false,
      italic: false,
      underline: false,
      color: '#000000',
      align: 'center',
    });
    setNewText('');
    setAddTextModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const w = Math.min(300, img.width);
        const h = w / aspectRatio;
        pushSnapshot();
        addElement({
          type: 'image',
          x: (pageSetup.width - w) / 2,
          y: (pageSetup.height - h) / 2,
          width: w,
          height: h,
          rotation: 0,
          src,
        });
      };
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateProp = (key: string, value: string | number | boolean) => {
    if (!selectedId) return;
    pushSnapshot();
    updateElement(selectedId, { [key]: value });
  };

  const handleDeleteElement = () => {
    if (!selectedId) return;
    pushSnapshot();
    deleteElement(selectedId);
    setSelectedId(null);
  };

  const handlePagePresetChange = (key: string) => {
    pushSnapshot();
    if (key === 'custom') {
      setPageSetup({ ...pageSetup, preset: 'custom' });
    } else {
      setPageSetup(pageSetupFromPreset(key));
    }
  };

  const propertiesPanel = (
    <>
      {selectedElement && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Properties</h3>
            <button onClick={handleDeleteElement} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
          </div>

          {(selectedElement.type === 'text' || selectedElement.type === 'field') && (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {selectedElement.type === 'field' ? 'Field Name' : 'Text'}
                </label>
                {selectedElement.type === 'field' ? (
                  <input
                    type="text"
                    value={selectedElement.fieldName || ''}
                    onChange={(e) => handleUpdateProp('fieldName', e.target.value)}
                    className="input-field text-xs"
                  />
                ) : (
                  <textarea
                    value={selectedElement.text || ''}
                    onChange={(e) => handleUpdateProp('text', e.target.value)}
                    className="input-field text-xs"
                    rows={2}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Font Family</label>
                <select value={selectedElement.fontFamily || 'Inter'} onChange={(e) => handleUpdateProp('fontFamily', e.target.value)} className="select-field text-xs">
                  {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Font Size</label>
                <input type="number" value={selectedElement.fontSize || 24} onChange={(e) => handleUpdateProp('fontSize', Number(e.target.value))} className="input-field text-xs" min={6} max={200} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleUpdateProp('bold', !selectedElement.bold)}
                  className={`p-2 rounded-md transition-colors ${selectedElement.bold ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}>
                  <Bold size={16} />
                </button>
                <button onClick={() => handleUpdateProp('italic', !selectedElement.italic)}
                  className={`p-2 rounded-md transition-colors ${selectedElement.italic ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}>
                  <Italic size={16} />
                </button>
                <button onClick={() => handleUpdateProp('underline', !selectedElement.underline)}
                  className={`p-2 rounded-md transition-colors ${selectedElement.underline ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}>
                  <Underline size={16} />
                </button>
              </div>
              <div className="flex gap-1">
                {[
                  { val: 'left', icon: <AlignLeft size={16} /> },
                  { val: 'center', icon: <AlignCenter size={16} /> },
                  { val: 'right', icon: <AlignRight size={16} /> },
                ].map((a) => (
                  <button key={a.val} onClick={() => handleUpdateProp('align', a.val)}
                    className={`p-2 rounded-md transition-colors ${selectedElement.align === a.val ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}>
                    {a.icon}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
                <input type="color" value={selectedElement.color || '#000000'} onChange={(e) => handleUpdateProp('color', e.target.value)} className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer" />
              </div>
            </>
          )}

          {selectedElement.type === 'image' && (
            <div className="text-xs text-gray-500 dark:text-gray-400">Drag to move. Use handles to resize and rotate.</div>
          )}

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rotation</label>
            <input type="number" value={Math.round(selectedElement.rotation || 0)} onChange={(e) => handleUpdateProp('rotation', Number(e.target.value))} className="input-field text-xs" min={-360} max={360} />
          </div>
        </div>
      )}

      {!selectedElement && (
        <div className="card p-4 text-sm text-gray-400 dark:text-gray-500 text-center">
          Click an element on the canvas to edit its properties
        </div>
      )}
    </>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Page Setup</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Design your certificate template</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Page Size</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(PAGE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePagePresetChange(key)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    pageSetup.preset === key
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {pageSetup.preset === 'custom' && (
              <div className="mt-3 flex gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width (cm)</label>
                  <input
                    type="text"
                    value={customWidthCm}
                    onChange={(e) => setCustomWidthCm(e.target.value)}
                    onBlur={handleCustomWidthBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomWidthBlur()}
                    className="input-field w-28"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height (cm)</label>
                  <input
                    type="text"
                    value={customHeightCm}
                    onChange={(e) => setCustomHeightCm(e.target.value)}
                    onBlur={handleCustomHeightBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomHeightBlur()}
                    className="input-field w-28"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card overflow-hidden group relative">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Certificate Preview &mdash; {presetCm.widthCm} x {presetCm.heightCm} cm
              </span>
              <div className="flex gap-2">
                <button onClick={() => setAddTextModal(true)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Type size={14} /> Text
                </button>
                <label className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer">
                  <ImageIcon size={14} /> Image
                  <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <FullscreenCanvas
              className="bg-gray-100 dark:bg-gray-800 p-4 flex justify-center overflow-auto"
              sidebarContent={propertiesPanel}
            >
              <div
                style={{
                  width: stageWidth * SCALE_FACTOR,
                  height: stageHeight * SCALE_FACTOR,
                  transformOrigin: 'top left',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                }}
              >
                <div style={{ transform: `scale(${SCALE_FACTOR})`, transformOrigin: 'top left' }}>
                  <Stage
                    ref={stageRef}
                    width={stageWidth}
                    height={stageHeight}
                    onClick={handleStageClick}
                    onTap={handleStageClick}
                  >
                    <Layer>
                      <Rect x={0} y={0} width={pageSetup.width} height={pageSetup.height} fill="#ffffff" listening={false} />
                      {elements.map((el) => {
                        if (el.type === 'image') {
                          const img = images[el.id];
                          if (!img) return null;
                          return (
                            <KonvaImage
                              key={el.id} id={el.id} image={img}
                              x={el.x} y={el.y} width={el.width} height={el.height}
                              rotation={el.rotation} draggable
                              onClick={() => handleElementClick(el.id)}
                              onTap={() => handleElementClick(el.id)}
                              onDragEnd={(e) => handleDragEnd(el, e.target)}
                              onTransformEnd={(e) => handleTransformEnd(el, e.target)}
                            />
                          );
                        }
                        if (el.type === 'text' || el.type === 'field') {
                          const displayText = el.type === 'field' ? `{{${el.fieldName}}}` : el.text;
                          return (
                            <Text
                              key={el.id} id={el.id}
                              x={el.x} y={el.y} width={el.width} height={el.height}
                              text={displayText}
                              fontSize={el.fontSize} fontFamily={el.fontFamily}
                              fontStyle={`${el.bold ? 'bold' : ''} ${el.italic ? 'italic' : ''}`.trim() || 'normal'}
                              textDecoration={el.underline ? 'underline' : ''}
                              fill={el.color}
                              align={el.align as CanvasTextAlign}
                              verticalAlign="middle"
                              rotation={el.rotation} draggable
                              onClick={() => handleElementClick(el.id)}
                              onTap={() => handleElementClick(el.id)}
                              onDragEnd={(e) => handleDragEnd(el, e.target)}
                              onTransformEnd={(e) => handleTransformEnd(el, e.target)}
                            />
                          );
                        }
                        return null;
                      })}
                      <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => {
                          if (newBox.width < 10 || newBox.height < 10) return oldBox;
                          return newBox;
                        }}
                      />
                    </Layer>
                  </Stage>
                </div>
              </div>
            </FullscreenCanvas>
          </div>
        </div>

        <div className="space-y-4">
          {propertiesPanel}
        </div>
      </div>

      {addTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddTextModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Text</h3>
            <textarea value={newText} onChange={(e) => setNewText(e.target.value)} className="input-field mb-4" rows={3} placeholder="Enter text..." autoFocus />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setAddTextModal(false); setNewText(''); }} className="btn-secondary">Cancel</button>
              <button onClick={handleAddText} className="btn-primary">Add Text</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupPanel;
