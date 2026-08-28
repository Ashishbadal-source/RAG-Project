import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { experimentsAPI } from '../api/endpoints';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';

export default function Experiments() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['experiments', { page, status: statusFilter }],
    queryFn: () => experimentsAPI.list({ page, status: statusFilter, per_page: 15 }),
  });

  const columns = [
    { key: 'name', label: 'Name', sortable: false },
    { key: 'mode', label: 'Mode', sortable: false },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: false,
      render: (val) => <StatusBadge status={val} />
    },
    { 
      key: 'created_at', 
      label: 'Created At', 
      sortable: false,
      render: (val) => new Date(val).toLocaleString()
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex justify-end space-x-2">
          {row.status === 'running' || row.status === 'paused' ? (
             <Button variant="ghost" size="sm" onClick={() => navigate(`/experiments/${row.id}/live`)}>
               View Live
             </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/experiments/${row.id}/results`)}>
              View Results
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-black">Experiments</h1>
        <Button onClick={() => navigate('/run')}>Run New Experiment</Button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border bg-card-elevated flex items-center space-x-4">
          <label className="text-sm font-medium text-slate-900">Filter by Status:</label>
          <select 
            className="input max-w-xs h-9 py-1"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-6">
            <SkeletonLoader type="table" count={5} />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-error">Failed to load experiments.</div>
        ) : data?.items?.length > 0 ? (
          <>
            <DataTable columns={columns} data={data.items} />
            
            {/* Pagination Controls */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-card">
              <span className="text-sm text-slate-900">
                Showing {((page - 1) * 15) + 1} to {Math.min(page * 15, data.total)} of {data.total}
              </span>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={page * 15 >= data.total}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState 
            title="No experiments found"
            description="You haven't run any experiments yet, or none match the selected filter."
            icon={FlaskConical}
            action={<Button onClick={() => navigate('/run')}>Start your first run</Button>}
          />
        )}
      </div>
    </div>
  );
}
