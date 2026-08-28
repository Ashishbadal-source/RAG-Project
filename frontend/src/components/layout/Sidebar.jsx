import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { 
  LayoutDashboard, 
  FlaskConical, 
  Play, 
  Trophy, 
  Search, 
  Cpu, 
  BrainCircuit, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Experiments', path: '/experiments', icon: FlaskConical },
  { name: 'Run Experiment', path: '/run', icon: Play },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Retriever Analysis', path: '/retrievers', icon: Search },
  { name: 'LLM Analysis', path: '/llms', icon: Cpu },
  { name: 'Query Explorer', path: '/queries', icon: BrainCircuit },
  { name: 'Metrics Dictionary', path: '/metrics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { sidebarCollapsed } = useUIStore();
  const location = useLocation();

  return (
    <div className={`flex flex-col bg-sidebar border-r border-border transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="h-16 flex items-center justify-center border-b border-border px-4">
        {sidebarCollapsed ? (
          <span className="font-bold text-xl text-accent">M</span>
        ) : (
          <span className="font-bold text-xl text-white tracking-widest uppercase flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-gradient-to-br from-accent to-accent-teal flex items-center justify-center text-xs text-white">M</span>
            MIRAGE
          </span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center rounded-button px-3 py-2.5 transition-all duration-300 ${
                    isActive 
                      ? 'bg-accent/10 text-accent font-medium border-l-2 border-accent' 
                      : 'text-slate-300 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-accent' : ''} ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
