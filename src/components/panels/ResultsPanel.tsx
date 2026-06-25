import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Upload,
  Download,
  X,
  Check,
  FolderPlus,
} from 'lucide-react';
import { useStudentStore } from '../../store/useStudentStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { parseCSV, importCSVToStudents, exportStudentsToCSV } from '../../utils/csvUtils';
import type { Student } from '../../types';

const ResultsPanel: React.FC = () => {
  const {
    students,
    categories,
    addStudent,
    updateStudent,
    deleteStudent,
    addCategory,
    deleteCategory,
    addImportedStudents,
  } = useStudentStore();
  const pushSnapshot = useSettingsStore((s) => s.pushSnapshot);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [newStudentData, setNewStudentData] = useState<Record<string, string>>({});
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = students.filter((s) =>
    Object.values(s.data).some((v) =>
      v.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleAddStudent = () => {
    const hasData = Object.values(newStudentData).some((v) => v.trim());
    if (!hasData) return;
    pushSnapshot();
    addStudent({ data: newStudentData });
    setNewStudentData({});
    setShowAddStudent(false);
  };

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setEditData({ ...student.data });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    pushSnapshot();
    updateStudent(editingId, editData);
    setEditingId(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDeleteStudent = (id: string) => {
    pushSnapshot();
    deleteStudent(id);
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    pushSnapshot();
    addCategory(name);
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { rows, headers } = await parseCSV(file);
      const { students: newStudents, newCategories } = importCSVToStudents(
        rows,
        headers,
        categories
      );
      pushSnapshot();
      addImportedStudents(newStudents, newCategories);
    } catch (err) {
      alert('Error importing CSV: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportCSV = () => {
    const csv = exportStudentsToCSV(students, categories);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enter Results</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage student records — {students.length} student{students.length !== 1 ? 's' : ''},{' '}
            {categories.length} categories
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddStudent(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={16} /> Add Student
          </button>
          <button onClick={() => setShowAddCategory(true)} className="btn-secondary flex items-center gap-1.5">
            <FolderPlus size={16} /> Add Category
          </button>
          <label className="btn-secondary flex items-center gap-1.5 cursor-pointer">
            <Upload size={16} /> Import CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
          </label>
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1.5" disabled={students.length === 0}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {showAddCategory && (
        <div className="card p-4 flex items-center gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="New category name..."
            className="input-field max-w-xs"
            autoFocus
          />
          <button onClick={handleAddCategory} className="btn-primary flex items-center gap-1">
            <Check size={16} /> Add
          </button>
          <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className="btn-secondary">
            Cancel
          </button>
        </div>
      )}

      {showAddStudent && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">New Student</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <div key={cat.id}>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {cat.name}
                </label>
                <input
                  type="text"
                  value={newStudentData[cat.name] || ''}
                  onChange={(e) =>
                    setNewStudentData((prev) => ({ ...prev, [cat.name]: e.target.value }))
                  }
                  className="input-field"
                  placeholder={cat.name}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAddStudent} className="btn-primary flex items-center gap-1">
              <Check size={16} /> Save
            </button>
            <button onClick={() => { setShowAddStudent(false); setNewStudentData({}); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students..."
              className="input-field pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  #
                </th>
                {categories.map((cat) => (
                  <th
                    key={cat.id}
                    className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      {cat.name}
                      {!cat.isDefault && (
                        <button
                          onClick={() => { pushSnapshot(); deleteCategory(cat.id); }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete category"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={categories.length + 2}
                    className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                  >
                    {students.length === 0
                      ? 'No students yet. Add a student or import a CSV file.'
                      : 'No students match your search.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      {idx + 1}
                    </td>
                    {editingId === student.id ? (
                      <>
                        {categories.map((cat) => (
                          <td
                            key={cat.id}
                            className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800"
                          >
                            <input
                              type="text"
                              value={editData[cat.name] || ''}
                              onChange={(e) =>
                                setEditData((prev) => ({ ...prev, [cat.name]: e.target.value }))
                              }
                              className="input-field text-xs py-1"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={handleSaveEdit} className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600" title="Save">
                              <Check size={15} />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Cancel">
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {categories.map((cat) => (
                          <td
                            key={cat.id}
                            className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap max-w-[200px] truncate"
                          >
                            {student.data[cat.name] || '—'}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(student)}
                              className="p-1.5 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 transition-colors"
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
