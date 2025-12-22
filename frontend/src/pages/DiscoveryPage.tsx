import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DiscoveryToolbar } from '@/components/discovery/DiscoveryToolbar';
import { SourceManager } from '@/components/discovery/SourceManager';
import { CapabilityGrid } from '@/components/discovery/CapabilityGrid';
import { DiscoveryStats } from '@/components/discovery/DiscoveryStats';
import { DiscoverySource, DiscoveryCapability } from '@shared/types';
import { useDiscovery, useCreateDiscoverySource, useDeleteDiscoverySource, nexusKeys } from '@/hooks/use-nexus-api';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function DiscoveryPage() {
  const { data, isLoading, refetch } = useDiscovery();
  const createSource = useCreateDiscoverySource();
  const deleteSource = useDeleteDiscoverySource();
  const queryClient = useQueryClient();

  const sources = data?.sources ?? [];
  const capabilities = data?.capabilities ?? [];

  const handleAddSource = (source: DiscoverySource) => {
    createSource.mutate(source);
  };

  const handleRemoveSource = (id: string) => {
    deleteSource.mutate(id);
  };

  const handleRefreshAll = () => {
    refetch();
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

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black text-white tracking-tight">Capability Discovery</h1>
            <p className="text-slate-400 mt-2 text-lg">Integrate and orchestrate external AGI modules and data streams.</p>
          </div>
          <DiscoveryToolbar onRefreshAll={handleRefreshAll} />
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Infrastructure Sources
            </h2>
          </div>
          <SourceManager 
            sources={sources} 
            onAdd={handleAddSource} 
            onRemove={handleRemoveSource} 
          />
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Discovered Capabilities
            </h2>
          </div>
          <CapabilityGrid 
            capabilities={capabilities} 
            sources={sources} 
          />
        </section>

        <section className="pt-10 border-t border-white/5">
          <DiscoveryStats 
            sources={sources} 
            capabilities={capabilities} 
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
