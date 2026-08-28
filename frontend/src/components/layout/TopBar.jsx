import { useUIStore } from '../../store/uiStore';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const { toggleSidebar, activeExperimentId } = useUIStore();

  return (
    <header className="h-16 bg-navbar border-b border-border flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-button text-muted hover:bg-card-elevated hover:text-white transition-colors focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        {activeExperimentId && (
          <Link 
            to={`/experiments/${activeExperimentId}/live`}
            className="flex items-center space-x-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/30 transition-colors hover:bg-accent/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span>Active Run</span>
          </Link>
        )}
      </div>
    </header>
  );
}
