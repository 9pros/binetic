import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { ShieldAlert, Trash2, ZapOff, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
export function DangerZone() {
  const handleGlobalRevoke = () => {
    toast.error('Global Revocation Initiated', {
      description: 'Terminating all neural links... Systems locking.'
    });
  };
  const handleSystemReset = () => {
    toast.warning('Memory Purge Executed', {
      description: 'Working clusters cleared. Synchronizing with cold storage.'
    });
  };
  return (
    <Card className="border-rose-500/20 bg-rose-500/5 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] pointer-events-none" />
      <CardHeader>
        <CardTitle className="text-rose-400 text-lg flex items-center gap-2">
          <AlertTriangle size={20} /> Critical Failure Prevention Zone
        </CardTitle>
        <CardDescription className="text-rose-400/60">
          These actions are irreversible and will affect the entire Nexus cluster. Use with extreme caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-black/40 border border-rose-500/10 space-y-4">
            <h4 className="text-sm font-bold text-white">Emergency Global Revocation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Immediately sever all active access vectors, keys, and operator sessions.
              The system will enter a "Stasis" state requiring physical L1 authentication to recover.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs h-10">
                  <ZapOff className="mr-2 h-4 w-4" /> Sever Global Linkage
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-950 border-rose-500/20 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Execute Global Stasis?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will terminate EVERY active session across the Nexus ecosystem.
                    This is an emergency protocol.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Abort</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGlobalRevoke} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">Confirm Severance</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <h4 className="text-sm font-bold text-white">System Cognitive Reset</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Purge all transient working memory and reset semantic cluster states to cold-storage defaults.
              Recommended after major goal alignment failures.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 h-10 font-bold uppercase tracking-widest text-xs">
                  <RefreshCw className="mr-2 h-4 w-4" /> Initialize Purge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Memory Purge?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will reset current working memory clusters. Unsaved cognitive patterns will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Abort</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSystemReset} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Execute Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="pt-6 border-t border-rose-500/10 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="p-3 rounded-xl bg-white/5 text-slate-400">
              <Download size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Master Forensic Package</p>
              <p className="text-[10px] text-slate-500">Generate encrypted export of all logs, keys, and memory schemas.</p>
            </div>
          </div>
          <Button variant="outline" className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 px-8 h-10 font-bold">
            Start Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}