import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queriesAPI } from '../api/endpoints';
import DataTable from '../components/ui/DataTable';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Button from '../components/ui/Button';
import { BrainCircuit, Search, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

function QueryDetailRow({ queryId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['query-detail', queryId],
    queryFn: () => queriesAPI.get(queryId, { sections: 'chunks,responses' }),
  });

  if (isLoading) return <div className="p-4 bg-card-elevated border-b border-border"><SkeletonLoader count={1} /></div>;
  if (!data) return null;

  return (
    <div className="p-6 bg-[#0F172A] border-b border-border space-y-6 shadow-inner text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Responses */}
        <div className="space-y-4">
           <h4 className="font-semibold text-white flex items-center"><BrainCircuit className="w-4 h-4 mr-2" /> Model Responses</h4>
           {data.responses && Object.keys(data.responses).length > 0 ? (
             Object.entries(data.responses).map(([mode, text]) => (
               <div key={mode} className="bg-navbar p-3 rounded shadow-sm border border-border">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-accent uppercase">{mode}</span>
                   {data.eval_labels?.[mode] && (
                     <span className={`text-xs font-medium px-2 py-0.5 rounded ${data.eval_labels[mode].em_loose ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                       {data.eval_labels[mode].em_loose ? 'Correct' : 'Incorrect'}
                     </span>
                   )}
                 </div>
                 <p className="text-sm text-slate-300 whitespace-pre-wrap">{text}</p>
               </div>
             ))
           ) : (
             <p className="text-sm text-slate-900">No responses available.</p>
           )}
        </div>

        {/* Retrieved Context */}
        <div className="space-y-4">
           <h4 className="font-semibold text-white flex items-center"><Search className="w-4 h-4 mr-2" /> Top Retrieved Chunks</h4>
           {data.retrieved_chunks && data.retrieved_chunks.length > 0 ? (
             data.retrieved_chunks.slice(0, 3).map((chunk, i) => (
               <div key={i} className="bg-navbar p-3 rounded shadow-sm border border-border">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-500">{chunk.retriever} - Rank {i+1}</span>
                   <span className="text-xs text-slate-900">Score: {chunk.score?.toFixed(4)}</span>
                 </div>
                 <p className="text-sm text-slate-300 line-clamp-4">{chunk.doc_chunk}</p>
               </div>
             ))
           ) : (
             <p className="text-sm text-slate-900">No retrieved chunks available.</p>
           )}
        </div>
      </div>
    </div>
  );
}

export default function QueryExplorer() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['queries', { page, search }],
    queryFn: () => queriesAPI.list({ page, per_page: 20, search }),
    placeholderData: (prev) => prev
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const columns = [
    { key: 'query', label: 'Query', sortable: false, render: (val) => <span className="font-medium">{val}</span> },
    { key: 'answer', label: 'Valid Answers', sortable: false, render: (val) => (
      <div className="flex flex-wrap gap-1">
        {Array.isArray(val) ? val.map((ans, i) => (
          <span key={i} className="px-2 py-1 bg-card-elevated rounded text-xs text-slate-900 truncate max-w-[150px]" title={ans}>{ans}</span>
        )) : val}
      </div>
    )},
    { key: 'source', label: 'Source', sortable: false, render: (val) => <span className="text-slate-900 text-sm">{val}</span> },
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setExpandedRow(expandedRow === row.query_id ? null : row.query_id)}
      >
        {expandedRow === row.query_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-black">Query Explorer</h1>
        <form onSubmit={handleSearch} className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Search queries..." 
            className="input w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {isLoading && !data ? (
          <div className="p-6"><SkeletonLoader type="table" count={10} /></div>
        ) : error ? (
          <div className="p-6 text-center text-error">Failed to load queries.</div>
        ) : data?.items?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white uppercase bg-sidebar border-b border-border">
                  <tr>
                    {columns.map(col => (
                      <th key={col.key} className="px-4 py-3">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row, idx) => (
                    <Fragment key={row.query_id || idx}>
                      <tr className="bg-card border-b border-border hover:bg-card-elevated transition-colors">
                        {columns.map(col => (
                          <td key={col.key} className="px-4 py-4">{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
                        ))}
                      </tr>
                      {expandedRow === row.query_id && (
                        <tr>
                          <td colSpan={columns.length} className="p-0">
                            <QueryDetailRow queryId={row.query_id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-card">
              <span className="text-sm text-slate-900">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total}
              </span>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="secondary" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="No queries found" description="No evaluation data exists yet, or no queries match your search." icon={Search} />
        )}
      </div>
    </div>
  );
}
