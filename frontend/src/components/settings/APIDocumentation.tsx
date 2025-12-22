import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Code, Search, Copy, Terminal, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
export function APIDocumentation() {
  const [search, setSearch] = useState('');
  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.info('Snippet Copied', { description: 'Implementation code stored in buffer.' });
  };
  const snippets = [
    { title: 'Neural Sync Dispatch', lang: 'curl', code: 'curl -X POST https://api.nexus.core/brain/sync \\\n  -H "Authorization: Bearer fgk_xxxx" \\\n  -d \'{"priority": 5, "sector": "alpha"}\'' },
    { title: 'Discover Capabilities', lang: 'js', code: 'const res = await nexus.discovery.list();\nconst analyticTools = res.filter(c => c.type === "Analytic");' },
    { title: 'Slot Diagnostics', lang: 'python', code: 'import nexus_cli\n\nnode = nexus_cli.get_node("S-01")\nnode.run_diagnostics(depth=3)' }
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="glass-dark border-white/5 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap size={18} className="text-indigo-400" /> API Telemetry
          </CardTitle>
          <CardDescription>Real-time usage vs Tier quotas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Requests (24h)</span>
              <span className="text-lg font-mono font-bold text-white">12,450 / 50k</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 shadow-glow" style={{ width: '25%' }} />
            </div>
            <p className="text-[10px] text-slate-500 italic">25.0% of L4 tier allowance consumed.</p>
          </div>
          <Button variant="outline" className="w-full border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 h-10">
            View Granular Logs <ExternalLink className="ml-2" size={12} />
          </Button>
        </CardContent>
      </Card>
      <Card className="glass-dark border-white/5 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Code size={18} className="text-emerald-400" /> Developer Reference
            </CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
              <Input 
                placeholder="Search endpoints..." 
                className="h-8 bg-black/40 border-white/10 text-[10px] pl-7" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="space-y-4">
            <TabsList className="bg-transparent border-b border-white/5 rounded-none p-0 h-8 gap-6">
              <TabsTrigger value="curl" className="px-0 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none text-xs">cURL</TabsTrigger>
              <TabsTrigger value="js" className="px-0 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none text-xs">Node.js</TabsTrigger>
              <TabsTrigger value="py" className="px-0 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none text-xs">Python</TabsTrigger>
            </TabsList>
            <div className="space-y-6">
              {snippets.map(snip => (
                <div key={snip.title} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Terminal size={10} /> {snip.title}
                    </h5>
                    <button onClick={() => copySnippet(snip.code)} className="text-[10px] text-indigo-400 hover:text-white flex items-center gap-1 font-bold">
                      <Copy size={10} /> Copy
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-white/5">
                    <pre className="text-xs font-mono text-indigo-300 overflow-x-auto">
                      {snip.code}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}