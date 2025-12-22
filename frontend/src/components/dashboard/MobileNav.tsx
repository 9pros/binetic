import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Brain, 
  Key, 
  FileText 
} from 'lucide-react';
import { cn } from '@/lib/utils';
const MOBILE_ITEMS = [
  { icon: LayoutDashboard, href: "/", label: "Home" },
  { icon: Activity, href: "/network", label: "Net" },
  { icon: Brain, href: "/brain", label: "Brain" },
  { icon: Key, href: "/keys", label: "Keys" },
  { icon: FileText, href: "/logs", label: "Logs" },
];
export function MobileNav() {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-around h-16 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {MOBILE_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link 
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all relative",
                isActive ? "text-indigo-400" : "text-slate-500"
              )}
            >
              {isActive && (
                <span className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
              )}
              <item.icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]")} />
              <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}