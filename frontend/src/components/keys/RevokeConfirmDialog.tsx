import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Terminal, Loader2 } from 'lucide-react';
import { ApiKey } from '@shared/types';
import { toast } from 'sonner';
interface RevokeConfirmDialogProps {
  keyData: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevoked: (id: string) => void;
}
export function RevokeConfirmDialog({ keyData, open, onOpenChange, onRevoked }: RevokeConfirmDialogProps) {
  const [confirmId, setConfirmId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  if (!keyData) return null;
  const handleRevoke = async () => {
    if (confirmId !== keyData.id) return;
    setIsProcessing(true);
    // Simulate link severance
    await new Promise(r => setTimeout(r, 1500));
    onRevoked(keyData.id);
    setIsProcessing(false);
    onOpenChange(false);
    setConfirmId('');
    toast.error('Link Severed', {
      description: `Access vector ${keyData.id} has been permanently revoked.`,
    });
  };
  return (
    <AlertDialog open={open} onOpenChange={(v) => !isProcessing && onOpenChange(v)}>
      <AlertDialogContent className="bg-slate-950 border-rose-500/20 text-white max-w-md">
        <AlertDialogHeader>
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
            <ShieldAlert size={28} />
          </div>
          <AlertDialogTitle className="text-2xl font-display font-black text-white">Sever Neural Link?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 text-sm leading-relaxed pt-2">
            You are about to permanently revoke <span className="text-white font-mono font-bold bg-white/5 px-1 rounded">{keyData.id}</span>. 
            This will terminate all associated AGI interactions and purge the cryptographic handshake.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-6 space-y-4">
          <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active Impact</p>
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-rose-400" />
              <span className="text-xs font-mono text-rose-400">{keyData.stats.activeSessions} active sessions will crash.</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operator Confirmation</label>
            <p className="text-[10px] text-slate-500 italic">Type the Vector ID <span className="text-slate-300 font-mono select-all">{keyData.id}</span> to enable termination.</p>
            <Input 
              value={confirmId}
              onChange={(e) => setConfirmId(e.target.value)}
              placeholder="Confirm ID..."
              className="bg-black border-rose-500/20 focus:border-rose-500 text-white h-11"
              autoComplete="off"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Abort</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleRevoke();
            }}
            disabled={confirmId !== keyData.id || isProcessing}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest min-w-[140px]"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {isProcessing ? 'Severing...' : 'Confirm Revoke'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}