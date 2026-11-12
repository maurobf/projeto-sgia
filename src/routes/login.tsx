import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ERRO_LOGIN, ehEmail, painelDoPerfil } from "@/lib/sgma";
import { meuPerfil } from "@/lib/sessao";
import { entrarComMatricula } from "@/lib/auth.functions";
import { BarraAcessibilidade, OuvirBotao } from "@/components/sgma/acessibilidade";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar – SGMA | IFTM" },
      { name: "description", content: "Faça login no SGMA com seu e-mail ou matrícula para acessar seu painel de monitoria." },
      { property: "og:title", content: "Entrar – SGMA | IFTM" },
      { property: "og:description", content: "Faça login no SGMA com seu e-mail ou matrícula para acessar seu painel de monitoria." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const loginMatricula = useServerFn(entrarComMatricula);
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) navigate({ to: painelDoPerfil(await meuPerfil()), replace: true });
    });
  }, [navigate]);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const id = identificador.trim();
      if (ehEmail(id)) {
        const { error } = await supabase.auth.signInWithPassword({ email: id, password: senha });
        if (error) throw new Error();
      } else {
        const r = await loginMatricula({ data: { matricula: id, senha } });
        if ("erro" in r) throw new Error();
        const { error } = await supabase.auth.setSession(r);
        if (error) throw new Error();
      }
      const perfil = await meuPerfil();
      if (!perfil) {
        await supabase.auth.signOut();
        throw new Error();
      }
      navigate({ to: painelDoPerfil(perfil), replace: true });
    } catch {
      setErro(ERRO_LOGIN);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BarraAcessibilidade />
      <main id="conteudo" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="bg-primary px-8 py-6 text-primary-foreground">
            <GraduationCap className="size-10" aria-hidden="true" />
            <h1 className="mt-3 text-2xl font-bold">SGMA</h1>
            <p className="text-sm opacity-90">Sistema de Gestão de Monitoria Acadêmica</p>
            <p className="text-xs opacity-90">IFTM – Campus Uberaba Parque Tecnológico</p>
          </div>
          <form onSubmit={entrar} className="space-y-5 px-8 py-6" noValidate>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Acesse sua conta</h2>
              <OuvirBotao texto="Tela de login do SGMA. Informe seu e-mail ou matrícula, sua senha e pressione Entrar." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="identificador">E-mail ou Matrícula</Label>
              <Input id="identificador" autoComplete="username" required value={identificador} onChange={(e) => setIdentificador(e.target.value)} aria-invalid={!!erro} aria-describedby={erro ? "erro-login" : undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input id="senha" type={mostrar ? "text" : "password"} autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="pr-11" aria-invalid={!!erro} aria-describedby={erro ? "erro-login" : undefined} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0.5 top-1/2 -translate-y-1/2" aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"} aria-pressed={mostrar} onClick={() => setMostrar((v) => !v)}>
                  {mostrar ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
            </div>
            <div aria-live="assertive">
              {erro && (
                <p id="erro-login" role="alert" className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  <AlertCircle className="size-4" aria-hidden="true" /> {erro}
                </p>
              )}
            </div>
            <Button type="submit" className="h-11 w-full text-base" disabled={carregando}>
              {carregando && <Loader2 className="animate-spin" aria-hidden="true" />} Entrar
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
