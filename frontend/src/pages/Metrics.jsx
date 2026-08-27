import { useQuery } from '@tanstack/react-query';
import { metricsAPI } from '../api/endpoints';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { BookOpen } from 'lucide-react';

export default function Metrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: metricsAPI.list,
  });

  if (isLoading) return <div className="p-8"><SkeletonLoader count={4} /></div>;
  if (error) return <div className="p-8 text-error">Failed to load metrics definitions.</div>;

  const grouped = data?.items?.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {});

  const categories = [
    { id: 'context', title: 'Context & Robustness Metrics (RAG specific)' },
    { id: 'llm', title: 'Generation Metrics (LLM Quality)' },
    { id: 'retriever', title: 'Retrieval Metrics (Ranking Quality)' }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center space-x-3 border-b border-border pb-4">
        <div className="p-2 bg-accent/10 rounded-lg text-accent">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">Metrics Dictionary</h1>
          <p className="text-muted text-sm mt-1">Understanding the evaluation criteria used in MIRAGE.</p>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat.id} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-100 border-l-4 border-accent pl-3">{cat.title}</h2>
          <div className="grid gap-4">
            {grouped[cat.id]?.map((metric, i) => (
              <div key={i} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-100">{metric.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${metric.interpretation.includes('Higher') ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                    {metric.interpretation}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-4">{metric.description}</p>
                <div className="bg-cardHover p-3 rounded font-mono text-xs text-gray-400 border border-border">
                  {metric.formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
