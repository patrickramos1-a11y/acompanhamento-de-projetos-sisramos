import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, Gauge, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Painel", icon: Gauge },
  { to: "/metricas", label: "Métricas", icon: BarChart3 },
  { to: "/configurar", label: "Configurar", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const currentLabel =
    nav.find((item) => (item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)))?.label ?? "Projetos";

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      {/* Top bar (mobile only) */}
      <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur lg:hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          PC
        </div>
        <p className="truncate text-sm font-semibold text-foreground">{currentLabel}</p>
      </header>

      {/* Sidebar (desktop only) */}
      <aside className="hidden border-r border-border bg-sidebar lg:flex lg:min-h-screen lg:flex-col">
        <div className="flex flex-col gap-8 p-4">
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              PC
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">Projetos</p>
              <p className="text-xs text-muted-foreground">Controle de validade</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center gap-2 rounded-md px-3 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:py-6 lg:pb-8">{children}</div>

      {/* Bottom navigation (mobile only) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-border bg-card shadow-card safe-pb lg:hidden"
        aria-label="Navegação principal"
      >
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors active:bg-accent",
                isActive && "text-primary",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
