import { NavLink } from "react-router-dom";
import { BarChart3, ClipboardList, Gauge, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Painel", icon: Gauge },
  { to: "/demandas", label: "Demandas", icon: ClipboardList },
  { to: "/metricas", label: "Métricas", icon: BarChart3 },
  { to: "/configurar", label: "Configurar", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-sidebar lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-8 lg:p-4">
          <div className="flex items-center gap-3 lg:py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">PC</div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-sidebar-foreground">Projetos</p>
              <p className="text-xs text-muted-foreground">Controle de validade</p>
            </div>
          </div>
          <nav className="flex gap-1 lg:flex-col">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex h-9 items-center gap-2 rounded-md px-3 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <Button className="hidden lg:flex" variant="ghost" onClick={() => supabase.auth.signOut()}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
