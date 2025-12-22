import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
export function SecuritySection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="glass-dark border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Lock size={18} className="text-indigo-400" /> Access Hardening
          </CardTitle>
          <CardDescription>Configure mandatory security layers for high-level operations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all">
            <div className="flex gap-4">
              <Fingerprint className="text-indigo-400 mt-1" size={20} />
              <div className="space-y-0.5">
                <Label className="text-white font-bold">Biometric / MFA Lock</Label>
                <p className="text-[10px] text-slate-500">Require secondary validation for Master keys.</p>
              </div>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all">
            <div className="flex gap-4">
              <RefreshCw className="text-indigo-400 mt-1" size={20} />
              <div className="space-y-0.5">
                <Label className="text-white font-bold">Auto-Rotation</Label>
                <p className="text-[10px] text-slate-500">Automatically rotate API secrets every 30 days.</p>
              </div>
            </div>
            <Switch className="data-[state=checked]:bg-indigo-600" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all">
            <div className="flex gap-4">
              <ShieldCheck className="text-indigo-400 mt-1" size={20} />
              <div className="space-y-0.5">
                <Label className="text-white font-bold">IP Geo-Fencing</Label>
                <p className="text-[10px] text-slate-500">Restrict access to known Nexus regional clusters.</p>
              </div>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
          </div>
        </CardContent>
      </Card>
      <Card className="glass-dark border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-400" /> Session Persistence
          </CardTitle>
          <CardDescription>Adjust inactivity thresholds for automatic link severance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <Label className="text-white">Operator Idle Timeout</Label>
              <span className="text-indigo-400 font-mono font-bold text-sm">45 Minutes</span>
            </div>
            <Slider defaultValue={[45]} max={120} min={5} step={5} className="[&_[role=slider]]:bg-indigo-500" />
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              <span>5m (Strict)</span>
              <span>120m (Relaxed)</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
            <ShieldAlert size={24} className="text-amber-400 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Extended timeout increases exposure window. Current setting (45m) is the recommended balance for Level Alpha operators.
            </p>
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold uppercase tracking-widest text-xs h-11">
            Update Security Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}