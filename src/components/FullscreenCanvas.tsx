import React, { useEffect, useRef } from 'react';

interface FullscreenCanvasProps {
  children: React.ReactNode;
  className?: string;
  sidebarContent?: React.ReactNode;
}

const FullscreenCanvas: React.FC<FullscreenCanvasProps> = ({ children, className, sidebarContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === el);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${className || ''} ${isFullscreen ? 'fixed inset-0 z-[9999] bg-gray-900 flex' : 'relative'}`}
    >
      <div className={`flex-1 flex items-center justify-center p-6 ${isFullscreen ? '' : 'contents'}`}>
        {children}
      </div>
      {isFullscreen && sidebarContent && (
        <div className="w-[280px] bg-gray-800 border-l border-gray-700 overflow-y-auto p-4 space-y-4">
          {sidebarContent}
        </div>
      )}
      <button
        onClick={toggleFullscreen}
        className={`absolute bottom-2 right-2 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 shadow transition-all z-10 ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default FullscreenCanvas;
