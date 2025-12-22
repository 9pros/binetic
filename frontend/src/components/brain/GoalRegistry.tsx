import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, CheckCircle2, Trash2, Layers, AlertCircle } from 'lucide-react';
import { Goal, GoalStatus } from '@shared/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
const INITIAL_GOALS: Goal[] = [
  { id: 'G1', description: 'Minimize Synaptic Latency in Cluster A', priority: 5, progress: 65, status: 'Active', subgoals: [], createdAt: Date.now() },
  { id: 'G2', description: 'Integrate Heuristic Pattern 0x82f', priority: 3, progress: 20, status: 'Active', subgoals: [], createdAt: Date.now() },
];
export function GoalRegistry() {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState(3);
  const addGoal = () => {
    if (!newDesc.trim()) return;
    const goal: Goal = {
      id: `G-${Math.floor(Math.random() * 1000)}`,
      description: newDesc,
      priority: newPriority,
      progress: 0,
      status: 'Pending',
      subgoals: [],
      createdAt: Date.now()
    };
    setGoals([goal, ...goals]);
    setNewDesc('');
    toast.success('Objective Anchored', { description: 'Nexus tracking system updated.' });
  };
  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast.error('Objective Terminated');
  };
  const updateGoal = (id: string, patch: Partial<Goal>) => {
    setGoals(goals.map(g => g.id === id ? { ...g, ...patch } : g));
  };
  const getPriorityColor = (p: number) => {
    if (p >= 5) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (p >= 3) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };
  return (
    <Card className="glass-dark border-white/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Target className="text-indigo-400" size={18} />
          <CardTitle className="text-white text-base">Goal Hierarchy Registry</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
          <Input 
            placeholder="Define new AGI objective..." 
            className="bg-black/40 border-white/10 text-white h-10 text-sm"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority Index: {newPriority}</p>
              <Slider value={[newPriority]} onValueChange={([v]) => setNewPriority(v)} min={1} max={5} step={1} className="[&_[role=slider]]:bg-indigo-500" />
            </div>
            <Button size="sm" onClick={addGoal} disabled={!newDesc.trim()} className="bg-indigo-600 hover:bg-indigo-500 h-9 px-4 text-xs font-bold">
              <Plus size={14} className="mr-2" /> Anchoring
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {goals.map(goal => (
            <div key={goal.id} className="p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-indigo-500/20 transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[8px] border font-black tracking-tighter uppercase px-1.5 py-0", getPriorityColor(goal.priority))}>
                      P{goal.priority}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-500">{goal.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{goal.description}</h4>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => updateGoal(goal.id, { status: 'Completed', progress: 100 })} className="h-7 w-7 text-slate-500 hover:text-emerald-400">
                    <CheckCircle2 size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeGoal(goal.id)} className="h-7 w-7 text-slate-500 hover:text-rose-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-white">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-1 bg-white/5" />
              </div>
              <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" className="h-7 text-[10px] font-bold border-white/10 bg-white/5 text-slate-400 hover:text-white flex-1">
                  <Layers size={10} className="mr-1" /> Sub-task
                </Button>
                <Button variant="outline" className="h-7 text-[10px] font-bold border-white/10 bg-white/5 text-slate-400 hover:text-white flex-1">
                  <AlertCircle size={10} className="mr-1" /> Re-prioritize
                </Button>
              </div>
            </div>
          ))}
          {goals.length === 0 && (
            <div className="text-center py-8 text-slate-600 italic text-xs">
              No active objectives in current cognitive buffer.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}