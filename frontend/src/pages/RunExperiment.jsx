import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardAPI, experimentsAPI } from '../api/endpoints';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Check, Settings2, Database, Cpu, Layers } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-black">Run Experiment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Details */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-border pb-4 mb-6">
            <Settings2 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-black">Experiment Details</h2>
          </div>
          
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
        </div>

        {/* Section 2: Models */}
        {(formData.mode === 'RAG' || formData.mode === 'LLM' || formData.mode === 'RET') && (
          <div className="card p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-border pb-4 mb-6">
              <Database className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-black">Model Selection</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LLMs */}
              {(formData.mode === 'RAG' || formData.mode === 'LLM') && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="text-sm font-medium text-black">Language Models</label>
                     <span className="text-xs text-slate-900 bg-card-elevated px-2 py-1 rounded">Select one or more</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
                    {configData?.available_llms.map(llm => {
                      const isSelected = formData.llms.includes(llm);
                      return (
                        <div 
                          key={llm} 
                          onClick={() => handleLlmToggle(llm)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'border-accent bg-accent/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                              : 'border-border bg-card-elevated hover:border-slate-500'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`font-medium text-sm ${isSelected ? 'text-accent' : 'text-black'}`}>{llm}</span>
                          </div>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'border-accent bg-accent text-background' : 'border-slate-600 bg-transparent'}`}>
                             {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Retrievers */}
              {(formData.mode === 'RAG' || formData.mode === 'RET') && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="text-sm font-medium text-black">Retrieval Models</label>
                     <span className="text-xs text-slate-900 bg-card-elevated px-2 py-1 rounded">Select one or more</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
                    {configData?.available_retrievers.map(ret => {
                      const isSelected = formData.retrievers.includes(ret);
                      return (
                        <div 
                          key={ret} 
                          onClick={() => handleRetrieverToggle(ret)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'border-accent bg-accent/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                              : 'border-border bg-card-elevated hover:border-slate-500'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`font-medium text-sm ${isSelected ? 'text-accent' : 'text-black'}`}>{ret}</span>
                          </div>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'border-accent bg-accent text-background' : 'border-slate-600 bg-transparent'}`}>
                             {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

          {/* Section 3: Parameters & Execution */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-border pb-4 mb-6">
            <Layers className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-black">Parameters & Execution</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-900">Temperature</label>
              <input type="number" step="0.1" min="0" max="2" className="input" value={formData.temperature} onChange={e=>setFormData({...formData, temperature: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-900">Top P</label>
              <input type="number" step="0.1" min="0" max="1" className="input" value={formData.top_p} onChange={e=>setFormData({...formData, top_p: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-900">Max Tokens</label>
              <input type="number" min="1" max="4096" className="input" value={formData.max_tokens} onChange={e=>setFormData({...formData, max_tokens: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-900">Top K (Retrieval)</label>
              <input type="number" min="1" max="20" className="input" value={formData.top_k} onChange={e=>setFormData({...formData, top_k: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-card-elevated rounded-xl border border-border mt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-card-elevated rounded-lg"><Cpu className="w-5 h-5 text-accent" /></div>
              <div className="flex flex-col">
                <span className="font-medium text-black text-sm">Hardware Acceleration</span>
                <span className="text-xs text-slate-900">Use CUDA for Retrieval (Disable for CPU mode)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, use_cuda: !formData.use_cuda})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background ${
                formData.use_cuda ? 'bg-accent' : 'bg-[#1e293b]'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.use_cuda ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
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
