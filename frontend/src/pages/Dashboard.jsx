import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../api/endpoints';
import { Activity, Beaker, CheckCircle2, XCircle, Database, Layers } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import MetricBarChart from '../components/charts/MetricBarChart';
import StatusBadge from '../components/ui/StatusBadge';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardAPI.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonLoader count={4} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState 
        title="Unable to load dashboard"
        description="There was an error communicating with the backend. Is it running?"
        action={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  const { stats, available_llms, available_retrievers, latest_experiment, recent_activity, chart_data } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Dashboard</h1>
        <Button onClick={() => navigate('/run')} className="shadow-sm">
          Quick Launch
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Experiments" value={stats.total} icon={Beaker} />
        <StatCard title="Running" value={stats.running} icon={Activity} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} />
        <StatCard title="Failed" value={stats.failed} icon={XCircle} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Experiment */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-100 mb-4">Latest Experiment</h2>
            {latest_experiment ? (
              <div className="flex items-center justify-between p-4 bg-cardHover rounded-lg border border-border">
                <div>
                  <h3 className="font-medium text-gray-100">{latest_experiment.name}</h3>
                  <p className="text-sm text-muted mt-1">Mode: {latest_experiment.mode}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <StatusBadge status={latest_experiment.status} />
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/experiments/${latest_experiment.id}/results`)}>
                    View Results
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No experiments have been run yet.</p>
            )}
          </div>

          {/* Context Metrics Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-100 mb-4">Context Metrics (Latest Run)</h2>
            <div className="h-64">
              <MetricBarChart 
                data={chart_data?.context_metrics || []} 
              />
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-100 mb-4">System Capacity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-cardHover rounded border border-border">
                <div className="flex items-center text-gray-300">
                  <Database className="h-4 w-4 mr-2 text-muted" />
                  <span className="text-sm font-medium">Available LLMs</span>
                </div>
                <span className="text-sm font-bold text-gray-100">{available_llms.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cardHover rounded border border-border">
                <div className="flex items-center text-gray-300">
                  <Layers className="h-4 w-4 mr-2 text-muted" />
                  <span className="text-sm font-medium">Available Retrievers</span>
                </div>
                <span className="text-sm font-bold text-gray-100">{available_retrievers.length}</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-100 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recent_activity.length > 0 ? (
                recent_activity.map((act) => (
                  <div key={act.id} className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-100">{act.experiment_name || 'Unknown'}</span>
                      <span className="text-xs text-muted">{new Date(act.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className="text-sm text-gray-400">{act.message}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
