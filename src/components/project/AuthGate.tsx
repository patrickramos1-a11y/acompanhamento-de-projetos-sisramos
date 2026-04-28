import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const { error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(mode === "login" ? "Login realizado." : "Cadastro criado. Verifique seu e-mail.");
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message ?? "Não foi possível entrar com Google.");
  }

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (session) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-2xl shadow-background">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">Projetos por Cliente</h1>
            <p className="text-sm text-muted-foreground">Acesse o painel da consultoria</p>
          </div>
        </div>

        <Button className="mb-4 w-full" variant="outline" onClick={handleGoogle} type="button">
          Entrar com Google
        </Button>

        <form className="space-y-4" onSubmit={handleEmail}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "login" ? "signup" : "login")} type="button">
          {mode === "login" ? "Não tenho conta" : "Já tenho conta"}
        </button>
      </section>
    </main>
  );
}
