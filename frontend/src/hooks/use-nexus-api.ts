import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import * as Types from '@shared/types';
import { toast } from 'sonner';

export const nexusKeys = {
  all: ['nexus'] as const,
  stats: () => [...nexusKeys.all, 'stats'] as const,
  keys: () => [...nexusKeys.all, 'keys'] as const,
  policies: () => [...nexusKeys.all, 'policies'] as const,
  operators: () => [...nexusKeys.all, 'operators'] as const,
  logs: () => [...nexusKeys.all, 'logs'] as const,
  discovery: () => [...nexusKeys.all, 'discovery'] as const,
  network: () => [...nexusKeys.all, 'network'] as const,
  memory: () => [...nexusKeys.all, 'memory'] as const,
  brain: () => [...nexusKeys.all, 'brain'] as const,
  approvals: () => [...nexusKeys.all, 'approvals'] as const,
};

// === CHARTS & ANALYTICS ===
export function useNeuralActivity() {
  return useQuery({
    queryKey: [...nexusKeys.stats(), 'neural'],
    queryFn: () => api<{ time: string; load: number; stability: number }[]>('/stats/neural-activity'),
    refetchInterval: 5000,
  });
}

export function useKeyUsageStats(keyId?: string) {
  return useQuery({
    queryKey: [...nexusKeys.keys(), 'usage', keyId],
    queryFn: () => api<{ time: string; reqs: number }[]>(`/keys/${keyId}/usage`),
    enabled: !!keyId,
  });
}

// === SYSTEM ===
export function useSystemStats() {
  return useQuery({
    queryKey: nexusKeys.stats(),
    queryFn: () => api<{ load: number; uptime: string; stability: number; activeKeys: number; netHealth: string; memoryLoad: number }>('/stats'),
    refetchInterval: 10000,
  });
}

// === API KEYS ===
export function useApiKeys() {
  return useQuery({
    queryKey: nexusKeys.keys(),
    queryFn: () => api<Types.ApiKey[]>('/keys'),
  });
}

export function useCreateKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Types.ApiKey>) => api<Types.ApiKey>('/keys', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.keys() });
      toast.success('Key Provisioned');
    }
  });
}

export function useRevokeKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ revoked: boolean }>(`/keys/${id}/revoke`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.keys() });
      toast.success('Key Revoked');
    }
  });
}

export function useDeleteKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/keys/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.keys() });
      toast.success('Key Deleted');
    }
  });
}

// === POLICIES ===
export function usePolicies() {
  return useQuery({
    queryKey: nexusKeys.policies(),
    queryFn: () => api<Types.SafetyPolicy[]>('/policies'),
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Types.SafetyPolicy>) => api<Types.SafetyPolicy>('/policies', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.policies() });
      toast.success('Policy Created');
    }
  });
}

export function useUpdatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Types.SafetyPolicy> }) => 
      api<Types.SafetyPolicy>(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.policies() });
      toast.success('Policy Updated');
    }
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/policies/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.policies() });
      toast.success('Policy Deleted');
    }
  });
}

// === OPERATORS ===
export function useOperators() {
  return useQuery({
    queryKey: nexusKeys.operators(),
    queryFn: () => api<Types.OperatorProfile[]>('/operators'),
  });
}

// === AUDIT LOGS ===
export function useAuditLogs() {
  return useQuery({
    queryKey: nexusKeys.logs(),
    queryFn: async () => {
      const result = await api<{ items: Types.AuditLog[]; next: string | null }>('/logs');
      return result.items;
    },
  });
}

export function useCreateAuditLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Types.AuditLog>) => api<Types.AuditLog>('/logs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.logs() });
    }
  });
}

// === DISCOVERY ===
export function useDiscovery() {
  return useQuery({
    queryKey: nexusKeys.discovery(),
    queryFn: () => api<{ sources: Types.DiscoverySource[]; capabilities: Types.DiscoveryCapability[] }>('/discovery'),
  });
}

export function useCreateDiscoverySource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Types.DiscoverySource>) => api<Types.DiscoverySource>('/discovery/sources', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.discovery() });
      toast.success('Source Added');
    }
  });
}

export function useDeleteDiscoverySource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/discovery/sources/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.discovery() });
      toast.success('Source Removed');
    }
  });
}

// === NETWORK SLOTS ===
export function useNetworkSlots() {
  return useQuery({
    queryKey: nexusKeys.network(),
    queryFn: () => api<Types.NetworkSlot[]>('/network/slots'),
  });
}

export function useCreateNetworkSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Types.NetworkSlot>) => api<Types.NetworkSlot>('/network/slots', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.network() });
      toast.success('Slot Created');
    }
  });
}

export function useUpdateNetworkSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Types.NetworkSlot> }) => 
      api<Types.NetworkSlot>(`/network/slots/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.network() });
    }
  });
}

export function useDeleteNetworkSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/network/slots/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.network() });
      toast.success('Slot Deleted');
    }
  });
}

// === MEMORY CLUSTERS ===
export function useMemoryClusters() {
  return useQuery({
    queryKey: nexusKeys.memory(),
    queryFn: () => api<Types.MemoryCluster[]>('/memory'),
  });
}

export function useCreateMemoryCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Types.MemoryCluster>) => api<Types.MemoryCluster>('/memory', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.memory() });
      toast.success('Cluster Created');
    }
  });
}

export function useDefragMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ message: string; clustersOptimized: number }>('/memory/defrag', { method: 'POST' }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: nexusKeys.memory() });
      toast.success(data.message);
    }
  });
}

// === BRAIN ===
export function useBrain() {
  return useQuery({
    queryKey: nexusKeys.brain(),
    queryFn: () => api<Types.BrainState>('/brain'),
    refetchInterval: 5000,
  });
}

export function useUpdateBrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Types.BrainState>) => api<Types.BrainState>('/brain', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.brain() });
    }
  });
}

export function useSyncBrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ message: string }>('/brain/sync', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.brain() });
      toast.success('Neural sync initiated');
    }
  });
}

// === APPROVALS ===
export function useApprovals() {
  return useQuery({
    queryKey: nexusKeys.approvals(),
    queryFn: () => api<Types.ApprovalRequest[]>('/approvals'),
  });
}

export function useUpdateApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => 
      api<Types.ApprovalRequest>(`/approvals/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nexusKeys.approvals() });
      toast.success('Request Updated');
    }
  });
}

export function useOrchestrateChat() {
  return useMutation({
    mutationFn: (payload: { message: string; history: any[] }) => 
      api<{ thought: string; responses: { agent: string; content: string }[] }>('/chat/orchestrate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}