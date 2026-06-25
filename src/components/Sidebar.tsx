import React from 'react';
import {
  FileText,
  Layout,
  Printer,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Award,
} from 'lucide-react';
import type { ActivePanel } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

interface SidebarProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

const menuItems: { key: ActivePanel; label: string; icon: React.ReactNode }[] = [
  { key: 'results', label: 'Enter Results', icon: <FileText size={20} /> },
  { key: 'setup', label: 'Page Setup', icon: <Layout size={20} /> },
  { key: 'print', label: 'Print Certificate', icon: <Printer size={20} /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
];

const Sidebar: React.FC<SidebarProps> = ({ activePanel, onPanelChange }) => {
  const { theme, toggleTheme } = useSettingsStore();

  return (
    <aside className="w-64 min-h-screen bg-primary-800 dark:bg-gray-900 text-white flex flex-col shrink-0 border-r border-primary-900 dark:border-gray-700">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-primary-700/50 dark:border-gray-700">
        <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center">
          <Award size={22} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold leading-tight truncate">Certificate Printing</h1>
          <p className="text-[11px] text-primary-200 dark:text-gray-400 leading-tight">Software</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onPanelChange(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activePanel === item.key
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-primary-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
