import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, EyeOff, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setIsLoading(true);
    try {
      const result = await useAuthStore.getState().login(apiKey);
      if (result.success) {
        toast.success('Neural Link Established', {
          description: 'Welcome back, Operator.',
        });
        const redirectTo = searchParams.get('redirect') || '/';
        navigate(redirectTo);
      } else {
        // Show specific error from backend
        toast.error('Access Denied', {
          description: result.error || 'Invalid AGI Access Key.',
        });
      }
    } catch (error) {
      toast.error('System Fault', {
        description: 'Failed to authenticate with Nexus.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] relative overflow-hidden">
      {/* Background Neural Network Animation Effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      </div>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/20 floating">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <Card className="glass-dark border-white/10 text-white backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display font-bold">Nexus Access</CardTitle>
            <CardDescription className="text-slate-400">
              Authorized personnel only. Provide AGI Control Key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder="fgk_xxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-2xs text-slate-500 flex items-center gap-1">
                  <ShieldAlert size={12} /> Format: fgk_ + 16 chars
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-11 transition-all"
                disabled={isLoading || !apiKey}
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? 'Decrypting...' : 'Establish Link'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}