import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/use-nexus-api';
import { Loader2, Save, Bot } from 'lucide-react';

const AGENT_IDS = ['ORCHESTRATOR', 'SWE_AGENT', 'SWE_MINI', 'SWE_REX'];

export function AgentsConfigSection() {
  const { data: config, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  
  const [overrides, setOverrides] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (config) {
      const newOverrides: Record<string, string> = {};
      AGENT_IDS.forEach(id => {
        newOverrides[id] = config.agentOverrides?.[id]?.model || '';
      });
      setOverrides(newOverrides);
    }
  }, [config]);

  const handleSave = () => {
    if (!config) return;
    
    const newAgentOverrides = { ...config.agentOverrides };
    Object.entries(overrides).forEach(([id, model]) => {
      if (model) {
        newAgentOverrides[id] = { ...newAgentOverrides[id], model };
      } else {
        if (newAgentOverrides[id]) delete newAgentOverrides[id].model;
      }
    });

    updateConfig.mutate({
      ...config,
      agentOverrides: newAgentOverrides
    });
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>Orchestration Agents</CardTitle>
          <CardDescription>Configure specific models for each agent in the swarm.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {AGENT_IDS.map(agentId => (
            <div key={agentId} className="grid gap-2 p-4 border border-slate-800 rounded-lg bg-slate-950/50">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-5 w-5 text-indigo-400" />
                <Label className="text-base font-semibold">{agentId}</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`model-${agentId}`} className="text-xs text-slate-400">Override Model ID</Label>
                <Input 
                  id={`model-${agentId}`}
                  value={overrides[agentId] || ''} 
                  onChange={(e) => setOverrides({...overrides, [agentId]: e.target.value})}
                  placeholder="Default (inherit from system)"
                  className="bg-slate-900 border-slate-800"
                />
              </div>
            </div>
          ))}
          
          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Agent Config
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
