import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, Maximize, Brain, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
export function AppearanceSection() {
  const { isDark, toggleTheme } = useTheme();
  const themes = [
    { id: 'nexus-dark', name: 'Cyber-Dark', primary: '#6366f1', current: isDark },
    { id: 'nexus-light', name: 'Mono-Light', primary: '#94a3b8', current: !isDark },
    { id: 'high-contrast', name: 'Scientific High', primary: '#ffffff', current: false },
  ];
  return (
    <div className="space-y-8">
      <Card className="glass-dark border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Palette size={18} className="text-indigo-400" /> Visual Manifest
          </CardTitle>
          <CardDescription>Choose your primary operational palette and interface density.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={theme.id.includes('light') === isDark ? toggleTheme : undefined}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left space-y-3",
                  theme.current 
                    ? "bg-indigo-600/10 border-indigo-600 shadow-glow" 
                    : "bg-white/5 border-white/5 hover:border-white/20"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                  {theme.current && <Badge className="bg-indigo-600 text-white text-[8px] h-4 uppercase">Active</Badge>}
                </div>
                <p className="text-sm font-bold text-white">{theme.name}</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex gap-4">
                  <Maximize className="text-slate-400 mt-1" size={18} />
                  <div className="space-y-0.5">
                    <Label className="text-white font-bold">Compact HUD</Label>
                    <p className="text-[10px] text-slate-500">Compress UI spacing for maximum data density.</p>
                  </div>
                </div>
                <Switch className="data-[state=checked]:bg-indigo-600" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex gap-4">
                  <LayoutTemplate className="text-slate-400 mt-1" size={18} />
                  <div className="space-y-0.5">
                    <Label className="text-white font-bold">Autohide Sidebar</Label>
                    <p className="text-[10px] text-slate-500">Maximize workspace area when not navigating.</p>
                  </div>
                </div>
                <Switch className="data-[state=checked]:bg-indigo-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex gap-4">
                  <Brain className="text-indigo-400 mt-1" size={18} />
                  <div className="space-y-0.5">
                    <Label className="text-white font-bold">Neural Motion</Label>
                    <p className="text-[10px] text-slate-500">Enable animated background node vectors.</p>
                  </div>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex gap-4">
                  <Palette className="text-slate-400 mt-1" size={18} />
                  <div className="space-y-0.5">
                    <Label className="text-white font-bold">Glassmorphism Effects</Label>
                    <p className="text-[10px] text-slate-500">Enable translucent panel backdrops (CPU intensive).</p>
                  </div>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}