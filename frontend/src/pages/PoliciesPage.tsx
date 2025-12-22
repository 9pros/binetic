import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Plus, Search, Filter, Loader2 } from 'lucide-react';
import { SafetyPolicy } from '@shared/types';
import { PolicyCard } from '@/components/policies/PolicyCard';
import { PolicyEditorDialog } from '@/components/policies/PolicyEditorDialog';
import { usePolicies, useCreatePolicy, useUpdatePolicy, useDeletePolicy } from '@/hooks/use-nexus-api';

export default function PoliciesPage() {
  const { data: policies = [], isLoading } = usePolicies();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();
  
  const [search, setSearch] = useState('');
  const [editingPolicy, setEditingPolicy] = useState<SafetyPolicy | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [policies, search]);

  const handleCreate = () => {
    setEditingPolicy(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (policy: SafetyPolicy) => {
    setEditingPolicy(policy);
    setIsEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    deletePolicy.mutate(id);
  };

  const handleSave = (policy: SafetyPolicy) => {
    if (editingPolicy) {
      updatePolicy.mutate({ id: policy.id, data: policy });
    } else {
      createPolicy.mutate(policy);
    }
    setIsEditorOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black text-white tracking-tight flex items-center gap-4">
              <Shield className="h-10 w-10 text-indigo-500" />
              Safety Directives
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Define immutable behavioral constraints and resource access levels.</p>
          </div>
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-600/20">
            <Plus className="mr-2 h-4 w-4" /> Create Directive
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
            <Input
              placeholder="Filter directives by name or purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white h-11"
            />
          </div>
          <Button variant="outline" className="h-11 border-white/10 bg-white/5 text-white">
            <Filter className="mr-2 h-4 w-4" /> All Categories
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 glass-dark border border-white/5 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map(policy => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onEdit={() => handleEdit(policy)}
                onDelete={() => handleDelete(policy.id)}
              />
            ))}
            {filteredPolicies.length === 0 && (
              <div className="col-span-full h-64 glass-dark border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                <Shield className="h-12 w-12 mb-4 opacity-10" />
                <p className="font-bold text-white">No Directives Found</p>
                <p className="text-sm">Adjust your filters or initiate a new alignment protocol.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <PolicyEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialData={editingPolicy}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}
