import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Upload,
  Download,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useStudentStore } from '../../store/useStudentStore';
import { useTemplateStore } from '../../store/useTemplateStore';

const SettingsPanel: React.FC = () => {
  const { undo, redo, undoStack, redoStack, resetEverything } = useSettingsStore();
  const studentStore = useStudentStore();
  const templateStore = useTemplateStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    resetEverything();
    setShowResetConfirm(false);
  };

  const handleExportTemplate = () => {
    const data = {
      elements: templateStore.elements,
      pageSetup: templateStore.pageSetup,
      categories: studentStore.categories,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.elements) {
          useSettingsStore.getState().pushSnapshot();
          templateStore.elements = data.elements;
          useTemplateStore.getState().restoreSnapshot({
            elements: data.elements,
            pageSetup: data.pageSetup || templateStore.pageSetup,
          });
        }
        if (data.categories) {
          const existingNames = new Set(studentStore.categories.map((c) => c.name));
          const newCats = data.categories.filter((c: { name: string }) => !existingNames.has(c.name));
          if (newCats.length > 0) {
            studentStore.addImportedStudents([], newCats);
          }
        }
      } catch {
        alert('Invalid template file');
      }
    };
    input.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage application settings and data</p>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Undo / Redo</h3>
        <div className="flex gap-3">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="btn-secondary flex items-center gap-1.5"
          >
            <Undo2 size={16} /> Undo
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="btn-secondary flex items-center gap-1.5"
          >
            <Redo2 size={16} /> Redo
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Undo stack: {undoStack.length} | Redo stack: {redoStack.length}
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Template Backup</h3>
        <div className="flex gap-3">
          <button onClick={handleExportTemplate} className="btn-secondary flex items-center gap-1.5">
            <Download size={16} /> Export Template (.json)
          </button>
          <button onClick={handleImportTemplate} className="btn-secondary flex items-center gap-1.5">
            <Upload size={16} /> Import Template (.json)
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Transfer certificate designs between computers
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="btn-danger flex items-center gap-1.5"
        >
          <RotateCcw size={16} /> Reset Everything
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Permanently delete all saved data, templates, and settings
        </p>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">About</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-semibold text-gray-900 dark:text-white">Certificate Printing Software 1.4</p>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">Developed By</span>
              <br />
              Jeevan Varghese
            </p>
            <p>St.Gemma's Girls' HSS Malappuram</p>
            <p>
              <a
                href="https://itsjeevanvarghese.web.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
              >
                itsjeevanvarghese.web.app
                <ExternalLink size={12} />
              </a>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
              Visit this website to get more school softwares.
            </p>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reset Everything</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to permanently delete all saved data, templates and settings?
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleReset} className="btn-danger">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
