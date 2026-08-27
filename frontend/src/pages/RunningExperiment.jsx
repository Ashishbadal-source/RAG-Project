import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { experimentsAPI } from '../api/endpoints';
import { createWebSocket } from '../api/websocket';
import { useUIStore } from '../store/uiStore';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { Play, Pause, Square, Terminal, Loader2 } from 'lucide-react';

export default function RunningExperiment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActiveExperiment } = useUIStore();
  
  const [wsData, setWsData] = useState(null);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const { data: exp, isLoading } = useQuery({
    queryKey: ['experiment', id],
    queryFn: () => experimentsAPI.get(id),
  });

  const pauseMutation = useMutation({ mutationFn: () => experimentsAPI.pause(id), onSuccess: () => queryClient.invalidateQueries(['experiment', id]) });
  const resumeMutation = useMutation({ mutationFn: () => experimentsAPI.resume(id), onSuccess: () => queryClient.invalidateQueries(['experiment', id]) });
  const cancelMutation = useMutation({ mutationFn: () => experimentsAPI.cancel(id), onSuccess: () => queryClient.invalidateQueries(['experiment', id]) });

  useEffect(() => {
    if (exp?.status === 'running' || exp?.status === 'paused') {
      setActiveExperiment(id);
    } else {
      setActiveExperiment(null);
    }
    return () => setActiveExperiment(null);
  }, [exp?.status, id, setActiveExperiment]);

  useEffect(() => {
    // Only connect if it's potentially active
    if (exp && (exp.status === 'completed' || exp.status === 'failed' || exp.status === 'cancelled')) return;
    
    const ws = createWebSocket(
      id,
      (msg) => {
        if (msg.type === 'progress') setWsData(msg.data);
        if (msg.type === 'log') {
          setLogs(prev => {
            const newLogs = [...prev, msg.data.message];
            return newLogs.length > 500 ? newLogs.slice(newLogs.length - 500) : newLogs;
          });
        }
        if (msg.type === 'stage_change' || msg.type === 'completed' || msg.type === 'error') {
           queryClient.invalidateQueries(['experiment', id]);
        }
      },
      (err) => console.error("WS Error:", err)
    );

    return () => ws.close();
  }, [id, exp?.status, queryClient]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-accent h-8 w-8" /></div>;

  const isCompleted = exp?.status === 'completed';
  const isFailed = exp?.status === 'failed';
  const isCancelled = exp?.status === 'cancelled';
  const isDone = isCompleted || isFailed || isCancelled;

  // Use wsData if available, fallback to DB progress, fallback to empty
  const progress = wsData || exp?.progress || {};
  const { stage = 'Initializing', llm, retriever, query_index = 0, total = 0, elapsed_sec = 0, eta_sec = 0 } = progress;
  const percent = total > 0 ? Math.round((query_index / total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">{exp?.name || 'Experiment'}</h1>
          <div className="flex items-center space-x-3 mt-2">
            <StatusBadge status={exp?.status || 'queued'} />
            <span className="text-sm text-muted">ID: {id}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isDone && exp?.status === 'running' && (
            <Button variant="secondary" size="sm" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
              <Pause className="h-4 w-4 mr-2" /> Pause
            </Button>
          )}
          {!isDone && exp?.status === 'paused' && (
            <Button variant="secondary" size="sm" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending}>
              <Play className="h-4 w-4 mr-2" /> Resume
            </Button>
          )}
          {!isDone && (
            <Button variant="danger" size="sm" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              <Square className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
          {isDone && (
            <Button variant="primary" onClick={() => navigate(`/experiments/${id}/results`)}>
              View Final Results
            </Button>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Stage: <span className="text-accent">{stage}</span></span>
          <span className="text-sm font-medium text-gray-300">{percent}%</span>
        </div>
        <div className="w-full bg-border/50 rounded-full h-2.5 mb-6">
          <div className="bg-accent h-2.5 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-cardHover p-3 rounded border border-border">
            <span className="block text-muted text-xs mb-1">Current LLM</span>
            <span className="font-medium text-gray-100 truncate" title={llm}>{llm || '-'}</span>
          </div>
          <div className="bg-cardHover p-3 rounded border border-border">
            <span className="block text-muted text-xs mb-1">Current Retriever</span>
            <span className="font-medium text-gray-100 truncate" title={retriever}>{retriever || '-'}</span>
          </div>
          <div className="bg-cardHover p-3 rounded border border-border">
            <span className="block text-muted text-xs mb-1">Progress</span>
            <span className="font-medium text-gray-100">{query_index} / {total || '-'}</span>
          </div>
          <div className="bg-cardHover p-3 rounded border border-border">
            <span className="block text-muted text-xs mb-1">Time</span>
            <span className="font-medium text-gray-100">{elapsed_sec}s elapsed {eta_sec ? `(~${eta_sec}s left)` : ''}</span>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden flex flex-col">
        <div className="bg-gray-900 px-4 py-2 flex items-center text-gray-300 border-b border-gray-800">
          <Terminal className="h-4 w-4 mr-2" />
          <span className="text-xs font-mono uppercase tracking-wider">Live Logs</span>
        </div>
        <div className="bg-[#1e1e1e] p-4 h-96 overflow-y-auto font-mono text-sm text-gray-300">
          {logs.length === 0 ? (
            <span className="text-gray-500">Waiting for logs...</span>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap mb-1">{log}</div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
