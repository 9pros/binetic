import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/dashboard/Header';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { TerminalOverlay } from '@/components/terminal/TerminalOverlay';
import { useAuthStore } from '@/lib/auth-store';
interface DashboardLayoutProps {
  children: React.ReactNode;
}
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!isAuthenticated) {
      const searchParams = new URLSearchParams();
      searchParams.set('redirect', location.pathname);
      navigate(`/login?${searchParams.toString()}`, { replace: true });
    }
  }, [isAuthenticated, navigate, location.pathname]);
  if (!isAuthenticated) {
    return null;
  }
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#030712] overflow-x-hidden relative">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent pb-20 md:pb-0 relative z-10">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
              {children}
            </div>
          </main>
        </SidebarInset>
        <MobileNav />
        <TerminalOverlay />
      </div>
    </SidebarProvider>
  );
}