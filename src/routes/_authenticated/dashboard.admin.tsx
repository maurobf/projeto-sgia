import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { exigirPainel } from "@/lib/sessao";
import { atualizarUsuario, listarUsuarios } from "@/lib/auth.functions";
import { ROTULO_PERFIL, type Perfil } from "@/lib/sgma";
import { LayoutPainel, Metrica, useEu } from "@/components/sgma/painel";
import { NovoUsuarioForm } from "@/components/sgma/novo-usuario";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  head: () => ({ meta: [{ title: "Administração – SGMA" }, { name: "description", content: "Gestão de usuários do SGMA." }] }),
  beforeLoad: () => exigirPainel("admin"),
  component: PainelAdmin,
});

const PERFIS: Perfil[] = ["admin", "coordenador", "monitor", "aluno"];

function PainelAdmin() {
  const { perfil } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: eu } = useEu();
  const listar = useServerFn(listarUsuarios);
  const atualizar = useServerFn(atualizarUsuario);
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => listar() });

  async function alterar(id: string, mudanca: { perfil?: Perfil; ativo?: boolean }) {
    const r = await atualizar({ data: { id, ...mudanca } });
    if ("erro" in r && r.erro) { toast.error(r.erro); return; }
    toast.success("Usuário atualizado.");
    qc.invalidateQueries({ queryKey: ["usuarios"] });
  }

  return (
    <LayoutPainel perfil={perfil} titulo="Administração do Sistema" descricao="Cadastre usuários, altere perfis e controle o acesso ao SGMA.">
      <div className="grid gap-4 sm:grid-cols-4">
        {PERFIS.map((p) => <Metrica key={p} rotulo={ROTULO_PERFIL[p]} valor={usuarios.filter((u) => u.perfil === p).length} />)}
      </div>
      <section aria-labelledby="novo" className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 id="novo" className="mb-4 text-xl font-semibold">Novo usuário</h2>
        <NovoUsuarioForm perfis={PERFIS} padrao="aluno" />
      </section>
      <section aria-labelledby="usuarios" className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 id="usuarios" className="mb-3 text-xl font-semibold">Usuários cadastrados</h2>
        <Table>
          <TableCaption>Todos os usuários do sistema</TableCaption>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Matrícula</TableHead><TableHead>Perfil</TableHead><TableHead>Situação</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
          <TableBody>
            {usuarios.map((u) => {
              const proprio = u.id === eu?.id;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.matricula ?? "—"}</TableCell>
                  <TableCell>
                    <Select value={u.perfil ?? ""} disabled={proprio} onValueChange={(v) => alterar(u.id, { perfil: v as Perfil })}>
                      <SelectTrigger className="w-48" aria-label={`Perfil de ${u.nome}`}><SelectValue placeholder="Sem perfil" /></SelectTrigger>
                      <SelectContent>{PERFIS.map((p) => <SelectItem key={p} value={p}>{ROTULO_PERFIL[p]}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Badge variant={u.ativo ? "default" : "destructive"}>{u.ativo ? "Ativo" : "Desativado"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled={proprio} onClick={() => alterar(u.id, { ativo: !u.ativo })} aria-label={`${u.ativo ? "Desativar" : "Reativar"} ${u.nome}`}>
                      {u.ativo ? "Desativar" : "Reativar"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </LayoutPainel>
  );
}
