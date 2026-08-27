import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resultsAPI, experimentsAPI } from '../api/endpoints';
import MetricCard from '../components/ui/MetricCard';
import MetricBarChart from '../components/charts/MetricBarChart';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Download, AlertCircle } from 'lucide-react';
import DataTable from '../components/ui/DataTable';

export default function ExperimentResult() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: exp, isLoading: expLoading } = useQuery({
    queryKey: ['experiment', id],
    queryFn: () => experimentsAPI.get(id),
  });

  const { data: result, isLoading: resultLoading } = useQuery({
    queryKey: ['results', id],
    queryFn: () => resultsAPI.get(id),
    enabled: exp?.status === 'completed'
  });

  if (expLoading || resultLoading) return <div className="p-8"><SkeletonLoader count={3} /></div>;

  if (exp?.status !== 'completed') {
    return (
      <EmptyState 
        title="Results not ready"
        description={`This experiment is currently ${exp?.status}. Results are only available for completed experiments.`}
        icon={AlertCircle}
        action={<Button onClick={() => navigate(`/experiments/${id}/live`)}>View Status</Button>}
      />
    );
  }

  const { metrics_summary = {}, per_pair = [], chart_data = {} } = result || {};

  const handleDownload = () => {
    window.location.href = resultsAPI.downloadUrl(id);
  };

  const pairColumns = [
    { key: 'llm', label: 'LLM', sortable: true },
    { key: 'retriever', label: 'Retriever', sortable: true },
    { key: 'f1', label: 'F1 Score', sortable: true, render: v => v?.toFixed(4) || '-' },
    { key: 'em_loose', label: 'EM Loose', sortable: true, render: v => v?.toFixed(4) || '-' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">{exp.name} - Results</h1>
          <p className="text-sm text-muted mt-1">Completed on {new Date(exp.completed_at).toLocaleString()}</p>
        </div>
        <Button onClick={handleDownload} variant="secondary">
          <Download className="h-4 w-4 mr-2" /> Download Archive
        </Button>
      </div>

      {/* Aggregate Metrics */}
      <div>
        <h2 className="text-lg font-medium text-gray-100 mb-4">Aggregate Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Avg EM Loose" value={metrics_summary.avg_em_loose?.toFixed(3) || '-'} highlight />
          <MetricCard title="Avg F1 Score" value={metrics_summary.avg_f1?.toFixed(3) || '-'} highlight />
          <MetricCard title="Noise Vulnerability (NV)" value={metrics_summary.avg_nv?.toFixed(3) || '-'} description="Lower is better" />
          <MetricCard title="Context Acceptability (CA)" value={metrics_summary.avg_ca?.toFixed(3) || '-'} description="Higher is better" />
          <MetricCard title="Context Insensitivity (CI)" value={metrics_summary.avg_ci?.toFixed(3) || '-'} description="Lower is better" />
          <MetricCard title="Context Misinterpretation (CM)" value={metrics_summary.avg_cm?.toFixed(3) || '-'} description="Lower is better" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-1 card p-6">
          <h2 className="text-lg font-medium text-gray-100 mb-4">Context Metrics</h2>
          <div className="h-64">
            <MetricBarChart data={chart_data.context_metrics || []} />
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-medium text-gray-100 mb-4">Pair Breakdown</h2>
          {per_pair.length > 0 ? (
             <DataTable columns={pairColumns} data={per_pair} />
          ) : (
             <p className="text-sm text-muted">No pair data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
