import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Brain,
  Key,
  Shield,
  FileText,
  Sparkles,
  Users,
  Search,
  Settings,
  LogOut,
  Loader2
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
const NAV_ITEMS = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "API Keys", icon: Key, href: "/keys" },
  { title: "Policies", icon: Shield, href: "/policies" },
  { title: "Network", icon: Activity, href: "/network" },
  { title: "Memory", icon: Brain, href: "/memory" },
  { title: "Operators", icon: Users, href: "/operators" },
];
const SECONDARY_ITEMS = [
  { title: "Brain State", icon: Sparkles, href: "/brain" },
  { title: "Discovery", icon: Search, href: "/discovery" },
  { title: "Audit Logs", icon: FileText, href: "/logs" },
  { title: "Settings", icon: Settings, href: "/settings" },
];
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const userName = useAuthStore((s) => s.user?.name);
  const userRole = useAuthStore((s) => s.user?.role);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise(r => setTimeout(r, 1200));
    useAuthStore.getState().logout();
  };
  return (
    <Sidebar className="border-r border-white/5 bg-[#030712] text-slate-400 w-[280px]">
      <SidebarHeader className="p-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-display font-bold text-base tracking-tight leading-none">Nexus Core</span>
            <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase mt-1">AGI Terminal</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3 space-y-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2 px-3">
            Command Center
          </SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "group/btn relative hover:bg-white/5 transition-all h-11 px-3 rounded-lg overflow-hidden",
                      isActive ? "text-white bg-indigo-600/10" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <Link to={item.href}>
                      {isActive && (
                        <motion.div
                          layoutId="active-bar"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                        />
                      )}
                      <item.icon className={cn("size-[18px] transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover/btn:text-slate-300")} />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2 px-3">
            System Subsystems
          </SidebarGroupLabel>
          <SidebarMenu>
            {SECONDARY_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "group/btn relative hover:bg-white/5 transition-all h-11 px-3 rounded-lg overflow-hidden",
                      isActive ? "text-white bg-indigo-600/10" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <Link to={item.href}>
                      {isActive && (
                        <motion.div
                          layoutId="active-bar-secondary"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                        />
                      )}
                      <item.icon className={cn("size-[18px] transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover/btn:text-slate-300")} />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Interface</span>
            <ThemeToggle className="relative top-0 right-0 h-8 w-8" />
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 group-hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                <AvatarImage src="" />
                <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                  {userName?.charAt(0) ?? 'O'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white truncate">{userName}</p>
                  <Badge className="h-4 px-1 text-[8px] bg-emerald-500/20 text-emerald-400 border-none font-mono">ALFA-9</Badge>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{userRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {isLoggingOut ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
              {isLoggingOut ? 'Severing...' : 'Sever Connection'}
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}