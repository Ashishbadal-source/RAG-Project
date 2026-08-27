import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardAPI, experimentsAPI } from '../api/endpoints';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';

export default function RunExperiment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: 'New Experiment',
    mode: 'RAG',
    llms: [],
    retrievers: [],
    temperature: 0.1,
    top_p: 0.1,
    max_tokens: 256,
    top_k: 5,
    use_cuda: false
  });

  const { data: configData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardAPI.getDashboard,
  });

  const runMutation = useMutation({
    mutationFn: experimentsAPI.run,
    onSuccess: (data) => {
      navigate(`/experiments/${data.id}/live`);
    }
  });

  const handleLlmToggle = (llm) => {
    setFormData(prev => ({
      ...prev,
      llms: prev.llms.includes(llm) 
        ? prev.llms.filter(l => l !== llm)
        : [...prev.llms, llm]
    }));
  };

  const handleRetrieverToggle = (ret) => {
    setFormData(prev => ({
      ...prev,
      retrievers: prev.retrievers.includes(ret) 
        ? prev.retrievers.filter(r => r !== ret)
        : [...prev.retrievers, ret]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.llms.length === 0 && (formData.mode === 'RAG' || formData.mode === 'LLM')) {
        alert("Please select at least one LLM.");
        return;
    }
    if (formData.retrievers.length === 0 && (formData.mode === 'RAG' || formData.mode === 'RET')) {
        alert("Please select at least one Retriever.");
        return;
    }
    runMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Run Experiment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-6 bg-card">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="label">Experiment Name</label>
              <input 
                type="text" 
                className="input" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Execution Mode</label>
              <select 
                className="input"
                value={formData.mode}
                onChange={(e) => setFormData({...formData, mode: e.target.value, llms: [], retrievers: []})}
              >
                <option value="RAG">RAG (LLM + Retriever)</option>
                <option value="LLM">LLM Only</option>
                <option value="RET">Retriever Only</option>
              </select>
            </div>
          </div>

          {/* Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border">
            {/* LLMs */}
            {(formData.mode === 'RAG' || formData.mode === 'LLM') && (
              <div className="space-y-3">
                <div className="flex justify-between">
                   <label className="label text-base">Select LLMs</label>
                   <span className="text-xs text-muted">(Default: OpenAI for CPU)</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {configData?.available_llms.map(llm => (
                    <label key={llm} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-cardHover cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-accent border-border rounded focus:ring-accent"
                        checked={formData.llms.includes(llm)}
                        onChange={() => handleLlmToggle(llm)}
                      />
                      <span className="text-sm font-medium text-gray-300">{llm}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Retrievers */}
            {(formData.mode === 'RAG' || formData.mode === 'RET') && (
              <div className="space-y-3">
                <label className="label text-base">Select Retrievers</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {configData?.available_retrievers.map(ret => (
                    <label key={ret} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-cardHover cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-accent border-border rounded focus:ring-accent"
                        checked={formData.retrievers.includes(ret)}
                        onChange={() => handleRetrieverToggle(ret)}
                      />
                      <span className="text-sm font-medium text-gray-300">{ret}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hyperparameters */}
          <div className="pt-4 border-t border-border space-y-4">
            <h3 className="label text-base">Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted">Temperature</label>
                <input type="number" step="0.1" min="0" max="2" className="input text-sm h-8" value={formData.temperature} onChange={e=>setFormData({...formData, temperature: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Top P</label>
                <input type="number" step="0.1" min="0" max="1" className="input text-sm h-8" value={formData.top_p} onChange={e=>setFormData({...formData, top_p: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Max Tokens</label>
                <input type="number" min="1" max="4096" className="input text-sm h-8" value={formData.max_tokens} onChange={e=>setFormData({...formData, max_tokens: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Top K (Retrieval)</label>
                <input type="number" min="1" max="20" className="input text-sm h-8" value={formData.top_k} onChange={e=>setFormData({...formData, top_k: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="use_cuda" className="rounded" checked={formData.use_cuda} onChange={e=>setFormData({...formData, use_cuda: e.target.checked})} />
                <label htmlFor="use_cuda" className="text-sm text-gray-300">Use CUDA for Retrieval (Uncheck for CPU mode)</label>
            </div>
          </div>

        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={runMutation.isPending} className="px-8 shadow-md">
            {runMutation.isPending ? 'Queuing...' : (
              <span className="flex items-center"><PlayCircle className="mr-2 h-5 w-5" /> Launch Experiment</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
