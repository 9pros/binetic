import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/use-nexus-api';
import { Loader2, Save } from 'lucide-react';

export function AIConfigSection() {
  const { data: config, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  
  const [formData, setFormData] = React.useState({
    baseUrl: '',
    apiKey: '',
    defaultModelId: ''
  });

  React.useEffect(() => {
    if (config) {
      setFormData({
        baseUrl: config.llm.baseUrl,
        apiKey: config.llm.apiKey,
        defaultModelId: config.llm.defaultModelId
      });
    }
  }, [config]);

  const handleSave = () => {
    if (!config) return;
    updateConfig.mutate({
      ...config,
      llm: {
        ...config.llm,
        ...formData
      }
    });
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>LLM Gateway Configuration</CardTitle>
          <CardDescription>Configure the connection to the AI inference engine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input 
              id="baseUrl" 
              value={formData.baseUrl} 
              onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
              placeholder="https://apis.iflow.cn/v1"
              className="bg-slate-950 border-slate-800"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input 
              id="apiKey" 
              type="password"
              value={formData.apiKey} 
              onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
              placeholder="sk-..."
              className="bg-slate-950 border-slate-800"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="modelId">Default Model ID</Label>
            <Input 
              id="modelId" 
              value={formData.defaultModelId} 
              onChange={(e) => setFormData({...formData, defaultModelId: e.target.value})}
              placeholder="glm-4.6"
              className="bg-slate-950 border-slate-800"
            />
          </div>
          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
