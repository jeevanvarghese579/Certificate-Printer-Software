import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva';
import type Konva from 'konva';
import {
  Printer,
  Trash2,
  GripVertical,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { useDrop } from 'react-dnd';
import { useTemplateStore } from '../../store/useTemplateStore';
import { useStudentStore } from '../../store/useStudentStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getPresetCm } from '../../utils/pageSizes';
import { resolveFieldText } from '../../utils/exportUtils';
import DraggableField from '../DraggableField';
import FullscreenCanvas from '../FullscreenCanvas';
import jsPDF from 'jspdf';
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

const PrintPanel: React.FC = () => {
  const { elements, pageSetup, addElement, updateElement, deleteElement } = useTemplateStore();
  const { students, categories } = useStudentStore();
  const pushSnapshot = useSettingsStore((s) => s.pushSnapshot);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;
  const selectedElement = elements.find((el) => el.id === selectedId) || null;

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

  const [, drop] = useDrop(
    () => ({
      accept: 'FIELD',
      drop: (item: { name: string }, monitor) => {
        const offset = monitor.getClientOffset();
        if (!offset) return;
        const stageContainer = stageRef.current?.container();
        if (!stageContainer) return;
        const rect = stageContainer.getBoundingClientRect();
        const x = (offset.x - rect.left) / SCALE_FACTOR;
        const y = (offset.y - rect.top) / SCALE_FACTOR;
        pushSnapshot();
        addElement({
          type: 'field',
          x,
          y,
          width: 200,
          height: 30,
          rotation: 0,
          fieldName: item.name,
          text: `{{${item.name}}}`,
          fontFamily: 'Inter',
          fontSize: 20,
          bold: true,
          italic: false,
          underline: false,
          color: '#000000',
          align: 'left',
        });
      },
    }),
    [pushSnapshot, addElement, pageSetup]
  );

  const dropRef = useCallback(
    (node: HTMLDivElement | null) => {
      drop(node);
    },
    [drop]
  );

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

  const handleDeleteElement = () => {
    if (!selectedId) return;
    pushSnapshot();
    deleteElement(selectedId);
    setSelectedId(null);
  };

  const handleUpdateProp = (key: string, value: string | number | boolean) => {
    if (!selectedId) return;
    pushSnapshot();
    updateElement(selectedId, { [key]: value });
  };

  const renderElement = (el: TemplateElement) => {
    const displayText = el.type === 'field' ? resolveFieldText(el, selectedStudent) : el.text || '';

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

    return (
      <Text
        key={el.id} id={el.id}
        x={el.x} y={el.y}
        width={el.width} height={el.height}
        text={displayText}
        fontSize={el.fontSize}
        fontFamily={el.fontFamily}
        fontStyle={`${el.bold ? 'bold' : ''} ${el.italic ? 'italic' : ''}`.trim() || 'normal'}
        textDecoration={el.underline ? 'underline' : ''}
        fill={el.type === 'field' && !selectedStudent?.data[el.fieldName || ''] ? '#9999ff' : el.color}
        align={el.align as CanvasTextAlign}
        verticalAlign="middle"
        rotation={el.rotation}
        draggable
        onClick={() => handleElementClick(el.id)}
        onTap={() => handleElementClick(el.id)}
        onDragEnd={(e) => handleDragEnd(el, e.target)}
        onTransformEnd={(e) => handleTransformEnd(el, e.target)}
      />
    );
  };

  const mapFontToJsPDF = (fontFamily?: string): string => {
    const f = (fontFamily || 'helvetica').toLowerCase();
    if (f.includes('times') || f.includes('georgia')) return 'times';
    if (f.includes('courier')) return 'courier';
    return 'helvetica';
  };

  const mapFontStyleToJsPDF = (el: TemplateElement): string => {
    const parts: string[] = [];
    if (el.italic) parts.push('italic');
    if (el.bold) parts.push('bold');
    return parts.join('') || 'normal';
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const presetCm = getPresetCm(pageSetup);
      const pageW_mm = presetCm.widthCm * 10;
      const pageH_mm = presetCm.heightCm * 10;
      const scaleX_mm = pageW_mm / pageSetup.width;
      const scaleY_mm = pageH_mm / pageSetup.height;

      const pdf = new jsPDF({
        orientation: pageSetup.orientation,
        unit: 'mm',
        format: [pageW_mm, pageH_mm],
      });

      for (let i = 0; i < students.length; i++) {
        if (i > 0) pdf.addPage([pageW_mm, pageH_mm], pageSetup.orientation);
        const student = students[i];

        for (const el of elements) {
          const xMm = el.x * scaleX_mm;
          const yMm = el.y * scaleY_mm;
          const wMm = el.width * scaleX_mm;
          const hMm = el.height * scaleY_mm;

          if (el.type === 'image' && el.src) {
            const img = images[el.id];
            if (img) {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const dataUrl = canvas.toDataURL('image/png');
                  pdf.addImage(dataUrl, 'PNG', xMm, yMm, wMm, hMm, undefined, 'FAST');
                }
              } catch {
                // skip image if cross-origin fails
              }
            }
          } else {
            const text = el.type === 'field' ? resolveFieldText(el, student) : el.text || '';
            if (!text) continue;

            const sizePt = (el.fontSize || 24) * scaleX_mm * (72 / 25.4);

            const jsFont = mapFontToJsPDF(el.fontFamily);
            const jsStyle = mapFontStyleToJsPDF(el);

            pdf.setFont(jsFont, jsStyle);
            pdf.setFontSize(sizePt);

            const hex = (el.color || '#000000').replace('#', '');
            pdf.setTextColor(parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16));

            const textY = yMm + hMm / 2;

            const align = el.align || 'left';
            if (align === 'center') {
              pdf.text(text, xMm + wMm / 2, textY, { align: 'center', baseline: 'middle' });
            } else if (align === 'right') {
              pdf.text(text, xMm + wMm, textY, { align: 'right', baseline: 'middle' });
            } else {
              pdf.text(text, xMm, textY, { baseline: 'middle' });
            }
          }
        }
      }
      pdf.save('certificates.pdf');
    } catch (err) {
      alert('PDF export error: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
    setExporting(false);
  };

  const presetCm = getPresetCm(pageSetup);

  const propertiesPanel = (
    <>
      {selectedElement && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {selectedElement.type === 'field' ? 'Field Properties' : selectedElement.type === 'text' ? 'Text Properties' : 'Image Properties'}
            </h3>
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

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <GripVertical size={16} /> Dynamic Fields
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          Drag fields onto the certificate template
        </p>
        <div className="space-y-2">
          {categories.map((cat) => (
            <DraggableField key={cat.id} name={cat.name} />
          ))}
        </div>
        {categories.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
            No categories. Add some in Enter Results.
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Print Certificate</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag fields onto the template and generate certificates
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportPDF}
            disabled={exporting || students.length === 0}
            className="btn-primary flex items-center gap-1.5"
          >
            <Printer size={16} /> {exporting ? 'Exporting...' : 'Print as PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4">
          <div className="card p-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => setSelectedStudentId(e.target.value || null)}
              className="select-field"
            >
              <option value="">-- Preview without student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.data['Student Name'] || s.data['Reg No'] || s.id}
                </option>
              ))}
            </select>
          </div>

          <div className="card overflow-hidden group relative" ref={dropRef}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Certificate Preview &mdash; {presetCm.widthCm} x {presetCm.heightCm} cm
              </span>
              {selectedId && (
                <button onClick={handleDeleteElement} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500" title="Delete element">
                  <Trash2 size={16} />
                </button>
              )}
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
                      {elements.map(renderElement)}
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
    </div>
  );
};

export default PrintPanel;
