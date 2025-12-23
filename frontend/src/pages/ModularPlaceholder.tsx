import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
interface ModularPlaceholderProps {
  title: string;
}
export default function ModularPlaceholder({ title }: ModularPlaceholderProps) {
  return (
    <DashboardLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fade-in px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative h-24 w-24 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 floating">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-display font-black text-white mb-4 tracking-tight">{title}</h1>
        <div className="flex items-center gap-3 text-indigo-400 font-mono text-xs uppercase tracking-[0.3em] mb-8">
          <Loader2 className="animate-spin h-3 w-3" /> System Initializing Interface
        </div>
        <p className="max-w-md text-slate-400 text-sm leading-relaxed mb-10">
          This Nexus subsystem is currently being calibrated for Level-4 cognitive link. 
          Neural propagation for the <strong>{title}</strong> module is estimated to complete in the next cycle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 h-11">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Mission Control
            </Link>
          </Button>
          <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/10 font-bold px-8 h-11">
            Check Sync Status
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}