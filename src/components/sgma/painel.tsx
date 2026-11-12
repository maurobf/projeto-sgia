import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ROTULO_PERFIL, type Perfil } from "@/lib/sgma";
import { BarraAcessibilidade, OuvirBotao } from "./acessibilidade";

export function useEu() {
  return useQuery({
    queryKey: ["eu"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("id, nome, email, matricula").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });
}

export function Cabecalho({ perfil }: { perfil?: Perfil }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: eu } = useEu();
  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <GraduationCap className="size-8 shrink-0" aria-hidden="true" />
        <div className="mr-auto leading-tight">
          <p className="text-lg font-bold">SGMA</p>
          <p className="text-xs opacity-90">IFTM – Campus Uberaba Parque Tecnológico</p>
        </div>
        {eu && (
          <p className="hidden text-right text-sm sm:block">
            <span className="block font-semibold">{eu.nome}</span>
            {perfil && <span className="opacity-90">{ROTULO_PERFIL[perfil]}</span>}
          </p>
        )}
        <Button variant="secondary" size="sm" onClick={sair}>
          <LogOut aria-hidden="true" /> Sair
        </Button>
      </div>
    </header>
  );
}

export function LayoutPainel({ titulo, descricao, perfil, children }: { titulo: string; descricao: string; perfil: Perfil; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">
        Pular para o conteúdo
      </a>
      <BarraAcessibilidade />
      <Cabecalho perfil={perfil} />
      {perfil === "admin" && <NavAdmin />}
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{titulo}</h1>
            <p className="text-muted-foreground">{descricao}</p>
          </div>
          <OuvirBotao texto={`${titulo}. ${descricao}`} rotulo="Ouvir descrição" />
        </div>
        {children}
      </main>
    </div>
  );
}

function NavAdmin() {
  const links = [
    { to: "/dashboard/admin", label: "Usuários" },
    { to: "/dashboard/coordenador", label: "Coordenação" },
    { to: "/dashboard/monitor", label: "Monitoria" },
    { to: "/dashboard/aluno", label: "Aluno" },
  ] as const;
  return (
    <nav aria-label="Painéis do administrador" className="border-b bg-card">
      <ul className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="rounded-md px-3 py-1.5 font-medium text-foreground hover:bg-accent" activeProps={{ className: "bg-accent text-accent-foreground" }}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Metrica({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-3xl font-bold text-primary">{valor}</p>
    </div>
  );
}
