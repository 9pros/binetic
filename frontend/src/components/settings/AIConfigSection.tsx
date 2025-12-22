import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/use-nexus-api';
import { Loader2, Save, Plus, Trash2, Check } from 'lucide-react';
import { LLMProvider } from '@shared/types';

export function AIConfigSection() {
  const { data: config, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  
  const [providers, setProviders] = React.useState<LLMProvider[]>([]);
  const [defaultProviderId, setDefaultProviderId] = React.useState('');

  React.useEffect(() => {
    if (config?.llm) {
      // Handle migration from old format if needed, though we updated the seed
      if (config.llm.providers) {
        setProviders(config.llm.providers);
        setDefaultProviderId(config.llm.defaultProviderId);
      } else {
         // Fallback for old data
         const legacyProvider: LLMProvider = {
             id: 'legacy',
             name: 'Legacy Provider',
             baseUrl: (config.llm as any).baseUrl || '',
             apiKey: (config.llm as any).apiKey || '',
             defaultModelId: (config.llm as any).defaultModelId || '',
             type: 'custom'
         };
         setProviders([legacyProvider]);
         setDefaultProviderId('legacy');
      }
    }
  }, [config]);

  const handleSave = () => {
    if (!config) return;
    updateConfig.mutate({
      ...config,
      llm: {
        providers,
        defaultProviderId
      }
    });
  };

  const addProvider = () => {
    const newProvider: LLMProvider = {
      id: crypto.randomUUID(),
      name: 'New Provider',
      baseUrl: 'https://apis.iflow.cn/v1',
      apiKey: '',
      defaultModelId: 'glm-4.6',
      type: 'custom'
    };
    setProviders([...providers, newProvider]);
    if (providers.length === 0) setDefaultProviderId(newProvider.id);
  };

  const updateProvider = (id: string, updates: Partial<LLMProvider>) => {
    setProviders(providers.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeProvider = (id: string) => {
    setProviders(providers.filter(p => p.id !== id));
    if (defaultProviderId === id && providers.length > 1) {
        setDefaultProviderId(providers.find(p => p.id !== id)?.id || '');
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>LLM Gateway Configuration</CardTitle>
          <CardDescription>Configure connection providers for the AI inference engine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {providers.map((provider, index) => (
            <div key={provider.id} className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 space-y-4 relative">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-400">Provider #{index + 1}</span>
                        {defaultProviderId === provider.id && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center">
                                <Check className="w-3 h-3 mr-1" /> Default
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {defaultProviderId !== provider.id && (
                            <Button variant="ghost" size="sm" onClick={() => setDefaultProviderId(provider.id)}>
                                Set Default
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => removeProvider(provider.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input 
                            value={provider.name} 
                            onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                            className="bg-slate-900 border-slate-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={provider.type} onValueChange={(v: any) => updateProvider(provider.id, { type: v })}>
                            <SelectTrigger className="bg-slate-900 border-slate-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">Custom (OpenAI Compatible)</SelectItem>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="anthropic">Anthropic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input 
                        value={provider.baseUrl} 
                        onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                        className="bg-slate-900 border-slate-800"
                        placeholder="https://api.openai.com/v1"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input 
                            type="password"
                            value={provider.apiKey} 
                            onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                            className="bg-slate-900 border-slate-800"
                            placeholder="sk-..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Default Model ID</Label>
                        <Input 
                            value={provider.defaultModelId} 
                            onChange={(e) => updateProvider(provider.id, { defaultModelId: e.target.value })}
                            className="bg-slate-900 border-slate-800"
                            placeholder="gpt-4"
                        />
                    </div>
                </div>
            </div>
          ))}

          <Button variant="outline" onClick={addProvider} className="w-full border-dashed border-slate-700 hover:border-slate-500">
            <Plus className="mr-2 h-4 w-4" /> Add Provider
          </Button>

          <div className="pt-4 flex justify-end border-t border-slate-800">
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
