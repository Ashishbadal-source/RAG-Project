import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { llmsAPI } from '../api/endpoints';
import MetricCard from '../components/ui/MetricCard';
import MetricBarChart from '../components/charts/MetricBarChart';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import DataTable from '../components/ui/DataTable';
import { Cpu } from 'lucide-react';

export default function LLMAnalysis() {
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['llms'],
    queryFn: llmsAPI.list,
  });

  const [selectedLlm, setSelectedLlm] = useState('');

  useEffect(() => {
    if (!selectedLlm && listData?.items?.length > 0) {
      setSelectedLlm(listData.items[0].id);
    }
  }, [selectedLlm, listData]);

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['llm-analysis', selectedLlm],
    queryFn: () => llmsAPI.getAnalysis(selectedLlm),
    enabled: !!selectedLlm
  });

  if (listLoading) return <div className="p-8"><SkeletonLoader count={2} /></div>;

  if (!listData?.items?.length) {
    return (
      <EmptyState 
        title="No LLM Data" 
        description="No LLM results found. Run an experiment in LLM or RAG mode first." 
        icon={Cpu} 
      />
    );
  }

  const top5 = analysis?.per_mode?.top5 || {};
  const base = analysis?.per_mode?.base || {};
  const oracle = analysis?.per_mode?.oracle || {};

  const retrieverColumns = [
    { key: 'retriever', label: 'Retriever' },
    { key: 'em_loose', label: 'EM Loose', render: v => v?.toFixed(4) || '-' },
    { key: 'em_strict', label: 'EM Strict', render: v => v?.toFixed(4) || '-' },
    { key: 'f1', label: 'F1 Score', render: v => v?.toFixed(4) || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-black">LLM Analysis</h1>
        <select 
          className="input max-w-xs"
          value={selectedLlm}
          onChange={(e) => setSelectedLlm(e.target.value)}
        >
          {listData.items.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {analysisLoading ? <SkeletonLoader count={4} /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 border-l-4 border-l-muted">
               <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-wider">Base Mode (No Context)</h3>
               <div className="space-y-3">
                 <div className="flex justify-between"><span className="text-slate-900">Avg F1</span><span className="font-medium text-black">{base.f1?.toFixed(4) || '-'}</span></div>
                 <div className="flex justify-between"><span className="text-slate-900">EM Loose</span><span className="font-medium text-black">{base.em_loose?.toFixed(4) || '-'}</span></div>
                 <div className="flex justify-between"><span className="text-slate-900">EM Strict</span><span className="font-medium text-black">{base.em_strict?.toFixed(4) || '-'}</span></div>
               </div>
            </div>
            
            <div className="card p-6 border-l-4 border-l-accent">
               <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-wider">RAG Mode (Avg Top-5)</h3>
               <div className="space-y-3">
                 <div className="flex justify-between"><span className="text-slate-900">Avg F1</span><span className="font-medium text-black">{top5.f1?.toFixed(4) || '-'}</span></div>
                 <div className="flex justify-between"><span className="text-slate-900">EM Loose</span><span className="font-medium text-black">{top5.em_loose?.toFixed(4) || '-'}</span></div>
                 <div className="flex justify-between"><span className="text-slate-900">EM Strict</span><span className="font-medium text-black">{top5.em_strict?.toFixed(4) || '-'}</span></div>
               </div>
            </div>
            
            <div className="card p-6 border-l-4 border-l-success">
               <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-wider">Oracle Mode (Perfect Context)</h3>
               <div className="space-y-3">
                 <div className="flex justify-between"><span className="text-slate-900">Avg F1</span><span className="font-medium text-black">{oracle.f1?.toFixed(4) || '-'}</span></div>
                 <div className="flex justify-between"><span className="text-slate-900">EM Loose</span><span className="font-medium text-black">{oracle.em_loose?.toFixed(4) || '-'}</span></div>
                 <div className="flex justify-between"><span className="text-slate-900">EM Strict</span><span className="font-medium text-black">{oracle.em_strict?.toFixed(4) || '-'}</span></div>
               </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-medium text-black mb-4">Performance across Retrievers (Top-5)</h2>
            {analysis?.per_retriever?.length > 0 ? (
               <DataTable columns={retrieverColumns} data={analysis.per_retriever} />
            ) : (
               <p className="text-sm text-slate-900">No RAG evaluation data available for this LLM.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
