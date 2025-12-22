import React from 'react';
import { useApprovals, useUpdateApproval } from '@/hooks/use-nexus-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ApprovalQueue() {
  const { data: approvals, isLoading } = useApprovals();
  const updateApproval = useUpdateApproval();

  const pendingApprovals = approvals?.filter(a => a.status === 'pending') || [];

  if (isLoading) return <div className="animate-pulse h-32 bg-white/5 rounded-xl" />;

  if (pendingApprovals.length === 0) {
    return (
      <Card className="glass-dark border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <ShieldAlert size={16} className="text-emerald-500" />
            Approval Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 text-sm">
            No pending actions required. System autonomous.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-dark border-white/5">
      <CardHeader>
        <CardTitle className="text-white text-base flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-500" />
          Approval Queue
          <Badge variant="secondary" className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/20">
            {pendingApprovals.length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingApprovals.map((request) => (
          <div key={request.id} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-white/20">
                    {request.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} /> {formatDistanceToNow(new Date(request.createdAt))} ago
                  </span>
                </div>
                <h4 className="text-sm font-medium text-white">
                  {request.payload.name || 'Unnamed Request'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Requested by: <span className="text-indigo-400">{request.requestedBy}</span>
                </p>
              </div>
            </div>
            
            <div className="bg-black/20 p-2 rounded text-[10px] font-mono text-slate-400 overflow-hidden">
              {JSON.stringify(request.payload, null, 2)}
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                onClick={() => updateApproval.mutate({ id: request.id, status: 'approved' })}
                disabled={updateApproval.isPending}
              >
                <CheckCircle size={14} className="mr-2" /> Approve
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                onClick={() => updateApproval.mutate({ id: request.id, status: 'rejected' })}
                disabled={updateApproval.isPending}
              >
                <XCircle size={14} className="mr-2" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
