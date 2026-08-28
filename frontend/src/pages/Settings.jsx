import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../api/endpoints';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { Save, Key } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [openaiKey, setOpenaiKey] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsAPI.get,
  });

  useEffect(() => {
    if (data?.api_keys?.openai) {
      setOpenaiKey(data.api_keys.openai);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: settingsAPI.update,
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      alert("Settings saved successfully.");
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    const updatePayload = {
      api_keys: {
        openai: openaiKey
      }
    };
    updateMutation.mutate(updatePayload);
  };

  if (isLoading) return <div className="p-8 max-w-2xl mx-auto"><SkeletonLoader count={2} /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-black">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* API Keys */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-medium text-black">API Keys</h2>
          </div>
          <p className="text-sm text-slate-900 mb-6">
            Configure keys required for LLM generation. Keys are stored in the backend `.env` file.
          </p>
          
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="label">OpenAI API Key</label>
              <input 
                type="text" 
                className="input font-mono" 
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* System Settings (Read Only for now) */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-black mb-4">Core Configuration</h2>
          <p className="text-sm text-slate-900 mb-4">
            These settings are read from `config.yaml` and currently managed by the experiment runner.
          </p>
          
          <div className="bg-card-elevated p-4 rounded font-mono text-xs text-slate-500 overflow-x-auto border border-border">
            <pre>{JSON.stringify(data?.config, null, 2)}</pre>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} className="shadow-sm">
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
