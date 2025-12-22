import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Shield, MessageSquare, Power, Globe, Activity, Search, Loader2 } from 'lucide-react';
import { useOperators } from '@/hooks/use-nexus-api';
import { toast } from 'sonner';
export default function OperatorsPage() {
  const { data: operators, isLoading } = useOperators();
  const [search, setSearch] = useState('');
  const filtered = operators?.filter(op => 
    op.name.toLowerCase().includes(search.toLowerCase()) || 
    op.role.toLowerCase().includes(search.toLowerCase())
  ) || [];
  const handleOverride = (name: string) => {
    toast.warning(`Security Override Requested`, {
      description: `Attempting to revoke access for ${name}. Verification required.`
    });
  };
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-black text-white tracking-tight flex items-center gap-4">
                <Users className="h-10 w-10 text-indigo-500" />
                Operator Registry
              </h1>
              <p className="text-slate-400 mt-2 text-lg">Command hierarchy and active personnel monitoring.</p>
            </div>
            <div className="relative w-full md:w-84">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
              <Input 
                placeholder="Search operators..." 
                className="bg-white/5 border-white/10 text-white pl-10 h-11"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Synchronizing personnel manifest...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {filtered.map(op => (
                <Card key={op.id} className="glass-dark border-white/5 hover:border-white/10 transition-all group overflow-hidden">
                  <CardContent className="p-6 relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-all" />
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-white/5">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-indigo-600 text-white font-bold">{op.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#030712] ${op.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold leading-none truncate">{op.name}</h3>
                        <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest truncate">{op.role}</p>
                        <Badge variant="outline" className="mt-2 h-4 px-1.5 text-[8px] border-indigo-500/20 text-indigo-400">CLEARANCE L{op.clearance}</Badge>
                      </div>
                    </div>
                    <div className="space-y-3 py-4 border-y border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-2"><Globe size={12} /> Location</span>
                        <span className="text-slate-300 font-medium">{op.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-2"><Activity size={12} /> Activity</span>
                        <span className="text-slate-300 font-medium truncate ml-4 text-right">{op.lastAction}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <Button variant="outline" className="h-9 text-[10px] font-bold uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10">
                        <MessageSquare size={12} className="mr-2" /> Message
                      </Button>
                      <Button
                        onClick={() => handleOverride(op.name)}
                        variant="outline"
                        className="h-9 text-[10px] font-bold uppercase tracking-widest border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                      >
                        <Power size={12} className="mr-2" /> Override
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}