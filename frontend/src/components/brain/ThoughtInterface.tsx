import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Clock, Terminal, ChevronDown, ChevronUp, Sparkles, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought, ThoughtType } from '@shared/types';
import { toast } from 'sonner';
export function ThoughtInterface() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [type, setType] = useState<ThoughtType>('Query');
  const [content, setContent] = useState('');
  const [context, setContext] = useState<{ k: string, v: string }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const addContext = () => setContext([...context, { k: '', v: '' }]);
  const removeContext = (i: number) => setContext(context.filter((_, idx) => idx !== i));
  const updateContext = (i: number, field: 'k' | 'v', val: string) => {
    const next = [...context];
    next[i][field] = val;
    setContext(next);
  };
  const handleDispatch = () => {
    if (!content.trim()) return;
    const newThought: Thought = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      context: context.reduce((acc, curr) => ({ ...acc, [curr.k]: curr.v }), {}),
      timestamp: Date.now(),
      duration: Math.floor(Math.random() * 800) + 200,
      status: 'completed',
      result: `Processed directive with ${Object.keys(context).length} parameters. Simulation result: Success. Patterns recognized: ${Math.floor(Math.random() * 100)}`
    };
    setThoughts([newThought, ...thoughts].slice(0, 20));
    setContent('');
    setContext([]);
    toast.success('Thought Dispatched', { description: 'Neural processing cycle initiated.' });
  };
  return (
    <div className="space-y-6">
      <Card className="glass-dark border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Brain size={20} />
            </div>
            <CardTitle className="text-white text-base">Thought Orchestrator</CardTitle>
          </div>
          <Select value={type} onValueChange={(v) => setType(v as ThoughtType)}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 h-8 text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="Query">Query</SelectItem>
              <SelectItem value="Command">Command</SelectItem>
              <SelectItem value="Observation">Observation</SelectItem>
              <SelectItem value="Reflection">Reflection</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Learning">Learning</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-6">
          <Textarea 
            placeholder="Enter cognitive directive content..." 
            className="bg-white/5 border-white/10 text-white h-32 focus:ring-indigo-500/30"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contextual Parameters</h4>
              <Button variant="ghost" size="sm" onClick={addContext} className="h-6 text-[10px] font-bold text-indigo-400 hover:text-indigo-300">
                <Plus size={12} className="mr-1" /> Add Param
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {context.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    placeholder="Key" 
                    className="bg-white/5 border-white/10 h-8 text-xs" 
                    value={c.k} 
                    onChange={(e) => updateContext(i, 'k', e.target.value)} 
                  />
                  <Input 
                    placeholder="Value" 
                    className="bg-white/5 border-white/10 h-8 text-xs" 
                    value={c.v} 
                    onChange={(e) => updateContext(i, 'v', e.target.value)} 
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeContext(i)} className="h-8 w-8 text-slate-500 hover:text-rose-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {context.length === 0 && <p className="text-[10px] italic text-slate-600">No additional context provided.</p>}
            </div>
          </div>
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/20"
            onClick={handleDispatch}
            disabled={!content.trim()}
          >
            <Send size={18} className="mr-2" /> Dispatch Cognitive Cycle
          </Button>
        </CardContent>
      </Card>
      <Card className="glass-dark border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Processing History</CardTitle>
            <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 text-[10px]">{thoughts.length} Recorded</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {thoughts.map((t) => (
                  <motion.div 
                    key={t.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 group hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px] uppercase tracking-tighter">
                            {t.type}
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-500">#{t.id}</span>
                        </div>
                        <p className="text-xs text-white font-medium line-clamp-1">{t.content}</p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={10} /> {t.duration}ms</span>
                        {expandedId === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                    {expandedId === t.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 rounded-lg bg-black/40 border border-white/5 space-y-4"
                      >
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                            <Terminal size={10} /> Execution Result
                          </h5>
                          <p className="text-xs text-slate-300 font-mono leading-relaxed">{t.result}</p>
                        </div>
                        {Object.keys(t.context).length > 0 && (
                          <div className="space-y-1">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parameters</h5>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(t.context).map(([k, v]) => (
                                <Badge key={k} variant="outline" className="text-[8px] border-white/10 text-slate-500">
                                  {k}: {v}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {thoughts.length === 0 && (
                <div className="p-12 text-center text-slate-600 space-y-2">
                  <Sparkles size={32} className="mx-auto opacity-20" />
                  <p className="font-mono text-xs">NO COGNITIVE SESSIONS ACTIVE</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}