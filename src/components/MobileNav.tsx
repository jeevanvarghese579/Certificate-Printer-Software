import React from 'react';
import {
  FileText,
  Layout,
  Printer,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Award,
  Menu,
  X,
} from 'lucide-react';
import type { ActivePanel } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

interface MobileNavProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

const menuItems: { key: ActivePanel; label: string; icon: React.ReactNode }[] = [
  { key: 'results', label: 'Results', icon: <FileText size={18} /> },
  { key: 'setup', label: 'Setup', icon: <Layout size={18} /> },
  { key: 'print', label: 'Print', icon: <Printer size={18} /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
];

const MobileNav: React.FC<MobileNavProps> = ({ activePanel, onPanelChange }) => {
  const { theme, toggleTheme } = useSettingsStore();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <>
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-primary-800 dark:bg-gray-900 text-white border-b border-primary-700 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
            <Award size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold">Certificate Printing</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-primary-800 dark:bg-gray-900 text-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-primary-700/50 dark:border-gray-700">
              <span className="text-sm font-bold">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1 rounded hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            <nav className="py-3 px-3 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    onPanelChange(item.key);
                    setDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activePanel === item.key
                      ? 'bg-white/15 text-white'
                      : 'text-primary-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
