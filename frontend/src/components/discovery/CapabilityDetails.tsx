import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DiscoveryCapability } from '@shared/types';
import {
  Zap, Code, Activity, ShieldCheck, Terminal, Play, Save, RefreshCw, Loader2, ChevronRight, Copy
} from 'lucide-react';
import { toast } from 'sonner';
interface CapabilityDetailsProps {
  capability: DiscoveryCapability | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function CapabilityDetails({ capability, open, onOpenChange }: CapabilityDetailsProps) {
  const [testPayload, setTestPayload] = useState('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  if (!capability) return null;
  const handleRunTest = async () => {
    setIsTesting(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setTestResponse({
        status: 200,
        ok: true,
        data: {
          result: "Integration simulation successful.",
          confidence: 0.94,
          execution_id: `exec_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }
      });
      toast.success('Simulation Complete');
    } catch (e) {
      setTestResponse({ status: 500, error: 'Simulation Fault: Node Unreachable' });
    } finally {
      setIsTesting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-emerald-600 to-indigo-600" />
        <div className="p-8 flex-1 overflow-y-auto">
          <DialogHeader className="mb-8">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-600 text-white font-mono uppercase text-[10px]">{capability.method}</Badge>
                  <Badge variant="outline" className="border-white/10 text-slate-400 font-mono text-[10px]">{capability.type}</Badge>
                </div>
                <DialogTitle className="text-3xl font-display font-black tracking-tight">{capability.name}</DialogTitle>
                <DialogDescription className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                  {capability.description}
                </DialogDescription>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Stability</p>
                <p className="text-2xl font-mono font-black text-emerald-400">{capability.successRate}%</p>
              </div>
            </div>
          </DialogHeader>
          <Tabs defaultValue="integration" className="space-y-8">
            <TabsList className="bg-white/5 border border-white/5 p-1 h-12">
              <TabsTrigger value="integration" className="data-[state=active]:bg-indigo-600 flex gap-2"><Zap size={14}/> Integration</TabsTrigger>
              <TabsTrigger value="schema" className="data-[state=active]:bg-indigo-600 flex gap-2"><Code size={14}/> Schema Manifest</TabsTrigger>
              <TabsTrigger value="telemetry" className="data-[state=active]:bg-indigo-600 flex gap-2"><Activity size={14}/> Node Telemetry</TabsTrigger>
            </TabsList>
            <TabsContent value="integration" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Test Payload (JSON)</h4>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold text-indigo-400" onClick={() => setTestPayload(JSON.stringify(capability.schema.input, null, 2))}>
                      Use Template
                    </Button>
                  </div>
                  <Textarea
                    className="bg-slate-950 border-white/10 h-[240px] font-mono text-xs text-indigo-300"
                    placeholder="{ ... }"
                    value={testPayload}
                    onChange={e => setTestPayload(e.target.value)}
                  />
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold h-12 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                    onClick={handleRunTest}
                    disabled={isTesting}
                  >
                    {isTesting ? <RefreshCw className="animate-spin mr-2" /> : <Play className="mr-2 h-4 w-4" />}
                    {isTesting ? 'Simulating...' : 'Invoke Integration Simulation'}
                  </Button>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Response</h4>
                  <div className="bg-slate-950 border border-white/5 rounded-xl h-[300px] p-4 overflow-y-auto">
                    {testResponse ? (
                      <pre className="text-xs font-mono text-emerald-400">
                        {JSON.stringify(testResponse, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-700 space-y-2">
                        <Terminal size={32} />
                        <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting execution signal...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="schema" className="space-y-4">
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="input" className="border-white/5 bg-white/5 rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-sm font-bold text-white flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" /> Input Definition
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-black/40 p-4 rounded-lg text-xs font-mono text-indigo-300">
                      {JSON.stringify(capability.schema.input, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="output" className="border-white/5 bg-white/5 rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-sm font-bold text-white flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" /> Output Manifest
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-black/40 p-4 rounded-lg text-xs font-mono text-emerald-300">
                      {JSON.stringify(capability.schema.output, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="telemetry" className="space-y-6">
               <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Average Response Time</p>
                  <p className="text-3xl font-mono font-bold text-white">{capability.responseTime}ms</p>
                </div>
                <div className="h-16 w-[120px] bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
                  <Activity size={32} className="text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl flex items-start gap-4">
                <ShieldCheck size={20} className="text-rose-500 mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Policy Enforcement</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This capability is bound to directive <span className="text-indigo-400 font-mono">POL-CORE-01</span>.
                    Calls are rate-limited to 60/min.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="p-6 border-t border-white/5 bg-slate-950 flex justify-between items-center">
           <Button variant="ghost" className="text-slate-400 hover:text-white flex gap-2">
            <Save size={16}/> Save Integration Profile
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white/5 border-white/10 text-white" onClick={() => onOpenChange(false)}>Close Inspector</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 font-bold px-8">Confirm Binding</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}