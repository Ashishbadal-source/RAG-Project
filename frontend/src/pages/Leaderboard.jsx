import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardAPI } from '../api/endpoints';
import DataTable from '../components/ui/DataTable';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('pair'); // 'llm', 'retriever', 'pair'
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', { type: activeTab }],
    queryFn: () => leaderboardAPI.get({ type: activeTab, sort_by: 'total_score', order: 'desc', page: 1, per_page: 50 }),
  });

  const baseColumns = [
    { key: 'rank', label: 'Rank', sortable: false, render: (val) => (
      <span className={`font-bold ${val === 1 ? 'text-yellow-500' : val === 2 ? 'text-gray-400' : val === 3 ? 'text-amber-600' : 'text-gray-100'}`}>
        #{val}
      </span>
    )},
  ];

  let columns = [];
  if (activeTab === 'pair' || activeTab === 'llm') {
    columns = [
      ...baseColumns,
      { key: 'name', label: 'Configuration', sortable: false },
      { key: 'f1_score', label: 'F1 Score', sortable: false, render: v => v?.toFixed(4) || '-' },
      { key: 'em_loose', label: 'EM Loose', sortable: false, render: v => v?.toFixed(4) || '-' },
      { key: 'em_strict', label: 'EM Strict', sortable: false, render: v => v?.toFixed(4) || '-' },
      { key: 'total_score', label: 'Context Score', sortable: false, render: v => v?.toFixed(4) || '-' },
    ];
  } else if (activeTab === 'retriever') {
    columns = [
      ...baseColumns,
      { key: 'name', label: 'Retriever', sortable: false },
      { key: 'f1_score', label: 'F1 Score@5', sortable: false, render: v => v?.toFixed(4) || '-' },
      { key: 'em_loose', label: 'NDCG@5', sortable: false, render: v => v?.toFixed(4) || '-' },
      { key: 'em_strict', label: 'Recall@5', sortable: false, render: v => v?.toFixed(4) || '-' },
    ];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Leaderboard</h1>
      </div>

      <div className="card overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-border bg-cardHover">
          {[
            { id: 'pair', label: 'LLM + Retriever Pairs' },
            { id: 'llm', label: 'LLM Only (Base/Oracle)' },
            { id: 'retriever', label: 'Retrievers' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-card text-accent border-b-2 border-accent' 
                  : 'text-gray-500 hover:text-gray-100 hover:bg-cardHover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="p-6"><SkeletonLoader type="table" count={10} /></div>
          ) : error || !data?.items?.length ? (
            <EmptyState 
              title="No leaderboard data"
              description="Run an experiment to generate evaluation results for the leaderboard."
              icon={Trophy}
            />
          ) : (
            <DataTable columns={columns} data={data.items} />
          )}
        </div>
      </div>
    </div>
  );
}
