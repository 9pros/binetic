import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/auth-store';
import { ShieldCheck, Monitor, MapPin, Clock, LogOut } from 'lucide-react';
export function ProfileSection() {
  const userName = useAuthStore(s => s.user?.name);
  const userRole = useAuthStore(s => s.user?.role);
  const sessions = [
    { id: '1', device: 'Nexus Workstation Alpha', ip: '10.0.4.12', location: 'London, UK', active: true, lastSeen: 'Just now' },
    { id: '2', device: 'Mobile Neural Link', ip: '172.16.0.5', location: 'Austin, TX', active: false, lastSeen: '4h ago' },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="glass-dark border-white/5 lg:col-span-1">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative w-24 h-24">
            <Avatar className="w-full h-full border-4 border-indigo-500/20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-indigo-600 text-3xl font-bold text-white">
                {userName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-emerald-500 h-6 w-6 rounded-full border-4 border-[#030712] shadow-glow" title="Verified Operator" />
          </div>
          <CardTitle className="text-xl font-bold text-white">{userName}</CardTitle>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-indigo-400">{userRole}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Security Clearance</Label>
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
              <ShieldCheck className="text-indigo-400" size={18} />
              <span className="text-sm font-bold text-white">LEVEL ALPHA-9</span>
            </div>
          </div>
          <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10">Edit Operator Persona</Button>
        </CardContent>
      </Card>
      <Card className="glass-dark border-white/5 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Monitor size={18} className="text-indigo-400" /> Active Session Registry
          </CardTitle>
          <CardDescription>Monitor and terminate concurrent neural links associated with your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="divide-y divide-white/5">
            {sessions.map(session => (
              <div key={session.id} className="py-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${session.active ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-500/10 text-slate-500'}`}>
                    <Monitor size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      {session.device}
                      {session.active && <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black uppercase">Current</span>}
                    </h5>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin size={10}/> {session.location} ({session.ip})</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10}/> {session.lastSeen}</span>
                    </div>
                  </div>
                </div>
                {!session.active && (
                  <Button variant="ghost" size="sm" className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <LogOut size={14} className="mr-2" /> Sever Link
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="destructive" className="w-full bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600/20">
            Sever All Other Sessions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}