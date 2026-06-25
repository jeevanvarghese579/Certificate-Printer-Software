import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import ResultsPanel from './components/panels/ResultsPanel';
import SetupPanel from './components/panels/SetupPanel';
import PrintPanel from './components/panels/PrintPanel';
import SettingsPanel from './components/panels/SettingsPanel';
import { useSettingsStore } from './store/useSettingsStore';
import type { ActivePanel } from './types';

const App: React.FC = () => {
  const [activePanel, setActivePanel] = useState<ActivePanel>('results');
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const renderPanel = () => {
    switch (activePanel) {
      case 'results':
        return <ResultsPanel />;
      case 'setup':
        return <SetupPanel />;
      case 'print':
        return <PrintPanel />;
      case 'settings':
        return <SettingsPanel />;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePanel={activePanel} onPanelChange={setActivePanel} />
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileNav activePanel={activePanel} onPanelChange={setActivePanel} />
          <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6">
            {renderPanel()}
          </main>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;
