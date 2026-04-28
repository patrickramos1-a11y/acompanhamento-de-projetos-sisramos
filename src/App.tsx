import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/project/AppShell";
import Index from "./pages/Index";
import ClientDetail from "./pages/ClientDetail";
import Demands from "./pages/Demands";
import Metrics from "./pages/Metrics";
import Configure from "./pages/Configure";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors position="top-right" />
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clientes/:id" element={<ClientDetail />} />
            <Route path="/demandas" element={<Demands />} />
            <Route path="/metricas" element={<Metrics />} />
            <Route path="/configurar" element={<Configure />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
