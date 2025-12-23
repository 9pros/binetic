import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrchestrationChat } from '@/components/brain/OrchestrationChat';
import { ThoughtInterface } from '@/components/brain/ThoughtInterface';
import { GoalRegistry } from '@/components/brain/GoalRegistry';
import { SubsystemOverview } from '@/components/brain/SubsystemOverview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StatsCard } from '@/components/dashboard/StatsWidgets';
import { Brain, Cpu, Target, Zap, Activity, RefreshCw, Power, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useBrain, useUpdateBrain, useSyncBrain, useNeuralActivity } from '@/hooks/use-nexus-api';

export default function BrainPage() {
  const { data: brain, isLoading } = useBrain();
  const { data: neuralData } = useNeuralActivity();
  const updateBrain = useUpdateBrain();
  const syncBrain = useSyncBrain();

  const SUCCESS_DATA = [
    { name: 'Success', value: brain?.successRate ?? 92, color: '#10b981' },
    { name: 'Failure', value: 100 - (brain?.successRate ?? 92), color: '#f43f5e' },
  ];

  const handleLearningRateChange = (value: number[]) => {
    updateBrain.mutate({ learningRate: value[0] });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </DashboardLayout>
    );
  }

  const status = brain?.status ?? 'READY';
  const learningRate = brain?.learningRate ?? 75;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Status Header */}
        <Card className="glass-dark border-white/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Brain size={120} className={status === 'LEARNING' ? 'animate-pulse' : ''} />
          </div>
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                  <Activity size={40} className="text-indigo-400 animate-pulse" />
                </div>
                <div className={`absolute -top-1 -right-1 h-6 w-6 rounded-full border-4 border-[#030712] ${
                  status === 'READY' ? 'bg-emerald-500' : 
                  status === 'LEARNING' ? 'bg-amber-500' : 
                  status === 'SYNCING' ? 'bg-indigo-500' : 'bg-slate-500'
                } animate-pulse`} />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-display font-black text-white tracking-tighter flex items-center gap-3">
                  Cognitive Status: {status}
                </h1>
                <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
                  Uptime: {brain?.uptime ?? '14d 02h 11m'} // Neural Stability: {brain?.stability?.toFixed(1) ?? '99.4'}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Global Success Rate</p>
                <div className="h-16 w-16 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={SUCCESS_DATA} innerRadius={20} outerRadius={30} paddingAngle={5} dataKey="value">
                        {SUCCESS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-lg font-mono font-black text-emerald-400 mt-1">{brain?.successRate ?? 92}%</p>
              </div>
              <Button 
                onClick={() => syncBrain.mutate()}
                disabled={syncBrain.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 px-8 shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw size={18} className={`mr-2 ${syncBrain.isPending ? 'animate-spin' : ''}`} /> Sync Neural Nodes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-dark border-white/5 p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Thoughts</span>
              <Cpu size={14} className="text-indigo-400" />
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-white font-mono">{((brain?.thoughtCount ?? 1200000) / 1000000).toFixed(1)}M</h3>
              <div className="h-10 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={neuralData || []}>
                    <Area type="monotone" dataKey="load" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
          <StatsCard label="Active Goals" value={String(brain?.activeGoals ?? 12)} subValue="4 Critical / 8 Routine" icon={Target} color="emerald" />
          <StatsCard label="Synaptic Load" value={`${brain?.synapticLoad ?? 42}%`} subValue="Nominal Processing Range" icon={Activity} color="indigo" />
          <Card className="glass-dark border-white/5 p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Learning Velocity</span>
              <Zap size={14} className="text-amber-400" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white font-mono">{learningRate}%</h3>
              <Slider 
                value={[learningRate]} 
                onValueChange={handleLearningRateChange} 
                max={100} 
                step={1} 
                className="[&_[role=slider]]:bg-amber-500" 
              />
            </div>
          </Card>
        </div>

        {/* Orchestration Layer */}
        <div className="w-full">
          <OrchestrationChat />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <ThoughtInterface />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <GoalRegistry />
            <SubsystemOverview />
          </div>
        </div>

        {/* Fixed Action Bar Fallback */}
        <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4 justify-center">
          <Button variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/10 px-8 h-12 font-bold uppercase tracking-widest text-xs">
            Trigger Adaptation
          </Button>
          <Button variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/10 px-8 h-12 font-bold uppercase tracking-widest text-xs">
            Global Reflection
          </Button>
          <Button variant="outline" className="border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 px-8 h-12 font-bold uppercase tracking-widest text-xs">
            <Power size={16} className="mr-2" /> Suspend Cycles
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
