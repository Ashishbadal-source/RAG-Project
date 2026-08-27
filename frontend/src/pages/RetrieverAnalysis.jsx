import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { retrieversAPI } from '../api/endpoints';
import MetricCard from '../components/ui/MetricCard';
import MetricBarChart from '../components/charts/MetricBarChart';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import { Search } from 'lucide-react';

export default function RetrieverAnalysis() {
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['retrievers'],
    queryFn: retrieversAPI.list,
  });

  const [selectedRetriever, setSelectedRetriever] = useState('');

  // Auto-select first item if list loads and nothing selected
  useEffect(() => {
    if (!selectedRetriever && listData?.items?.length > 0) {
      setSelectedRetriever(listData.items[0].id);
    }
  }, [selectedRetriever, listData]);

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['retriever-analysis', selectedRetriever],
    queryFn: () => retrieversAPI.getAnalysis(selectedRetriever),
    enabled: !!selectedRetriever
  });

  if (listLoading) return <div className="p-8"><SkeletonLoader count={2} /></div>;

  if (!listData?.items?.length) {
    return (
      <EmptyState 
        title="No Retriever Data" 
        description="No retriever results found. Run an experiment in RET or RAG mode first." 
        icon={Search} 
      />
    );
  }

  const metricsAt5 = analysis?.metrics_at_k?.['5'] || {};
  
  // Format chart data for K values
  const chartData = ['1', '3', '5'].map(k => ({
    name: `@${k}`,
    recall: analysis?.metrics_at_k?.[k]?.recall || 0,
    ndcg: analysis?.metrics_at_k?.[k]?.NDCG || 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Retriever Analysis</h1>
        <select 
          className="input max-w-xs"
          value={selectedRetriever}
          onChange={(e) => setSelectedRetriever(e.target.value)}
        >
          {listData.items.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {analysisLoading ? <SkeletonLoader count={4} /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Recall@5" value={metricsAt5.recall?.toFixed(4) || '-'} highlight />
            <MetricCard title="NDCG@5" value={metricsAt5.NDCG?.toFixed(4) || '-'} highlight />
            <MetricCard title="Precision@5" value={metricsAt5.precision?.toFixed(4) || '-'} />
            <MetricCard title="F1@5" value={metricsAt5.F1?.toFixed(4) || '-'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-100 mb-4">Recall across K</h2>
              <div className="h-64">
                <MetricBarChart data={chartData} dataKey="recall" color="#10B981" />
              </div>
            </div>
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-100 mb-4">NDCG across K</h2>
              <div className="h-64">
                <MetricBarChart data={chartData} dataKey="ndcg" color="#8B5CF6" />
              </div>
            </div>
          </div>

          <div className="card p-6">
             <h2 className="text-lg font-medium text-gray-100 mb-4">Sample Retrieved Chunks</h2>
             <div className="space-y-6">
               {analysis?.sample_chunks?.map((sample, i) => (
                 <div key={i} className="border border-border rounded-lg p-4 bg-cardHover">
                    <p className="text-xs text-muted mb-3 font-mono">Query ID: {sample.query_id}</p>
                    <div className="space-y-3">
                      {sample.chunks?.map((chunk, j) => (
                        <div key={j} className="bg-card p-3 rounded shadow-sm border border-border">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-accent">Rank {j+1}</span>
                            <span className="text-xs text-muted">Score: {chunk.score.toFixed(4)}</span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-3" title={chunk.doc_chunk}>{chunk.doc_chunk}</p>
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </>
      )}
    </div>
  );
}
