import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Shield, Bell, Palette, Cpu, Zap, Save, AlertTriangle, BrainCircuit, Bot } from 'lucide-react';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { APIDocumentation } from '@/components/settings/APIDocumentation';
import { DangerZone } from '@/components/settings/DangerZone';
import { AIConfigSection } from '@/components/settings/AIConfigSection';
import { AgentsConfigSection } from '@/components/settings/AgentsConfigSection';
import { toast } from 'sonner';
export default function SettingsPage() {
  const handleGlobalSave = () => {
    toast.success('Configuration Synchronized', {
      description: 'System parameters propagated across the Nexus grid.'
    });
  };
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-black text-white tracking-tight flex items-center gap-4">
                <Cpu className="h-10 w-10 text-indigo-500" />
                Nexus Configuration
              </h1>
              <p className="text-slate-400 mt-2 text-lg">Calibrate terminal behavior, security protocols, and visual density.</p>
            </div>
            <Button onClick={handleGlobalSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 px-8 shadow-glow">
              <Save className="mr-2 h-5 w-5" /> Propagate Changes
            </Button>
          </div>
          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="bg-white/5 border border-white/10 p-1 h-12 flex items-center justify-start overflow-x-auto overflow-y-hidden custom-scrollbar">
              <TabsTrigger value="profile" className="flex gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"><User size={14}/> Profile</TabsTrigger>
              <TabsTrigger value="ai-models" className="flex gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"><BrainCircuit size={14}/> AI Models</TabsTrigger>
              <TabsTrigger value="agents" className="flex gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"><Bot size={14}/> Agents</TabsTrigger>
              <TabsTrigger value="security" className="flex gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"><Shield size={14}/> Security</TabsTrigger>
              <TabsTrigger value="appearance" className="flex gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"><Palette size={14}/> Interface</TabsTrigger>
              <TabsTrigger value="api" className="flex gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"><Zap size={14}/> API & Docs</TabsTrigger>
              <TabsTrigger value="danger" className="flex gap-2 data-[state=active]:bg-rose-600 data-[state=active]:text-white text-rose-400"><AlertTriangle size={14}/> Danger Zone</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-6">
              <ProfileSection />
            </TabsContent>
            <TabsContent value="ai-models" className="space-y-6">
              <AIConfigSection />
            </TabsContent>
            <TabsContent value="agents" className="space-y-6">
              <AgentsConfigSection />
            </TabsContent>
            <TabsContent value="security" className="space-y-6">
              <SecuritySection />
            </TabsContent>
            <TabsContent value="appearance" className="space-y-6">
              <AppearanceSection />
            </TabsContent>
            <TabsContent value="api" className="space-y-6">
              <APIDocumentation />
            </TabsContent>
            <TabsContent value="danger" className="space-y-6">
              <DangerZone />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}