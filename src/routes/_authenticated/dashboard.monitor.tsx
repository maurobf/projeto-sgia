import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exigirPainel } from "@/lib/sessao";
import { alunosQuery, atendimentosQuery, monitoriasQuery } from "@/lib/consultas";
import { formatarData, hora } from "@/lib/sgma";
import { LayoutPainel, Metrica, useEu } from "@/components/sgma/painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/dashboard/monitor")({
  head: () => ({ meta: [{ title: "Painel do Monitor – SGMA" }, { name: "description", content: "Registre atendimentos e presenças." }] }),
  beforeLoad: () => exigirPainel("monitor"),
  component: PainelMonitor,
});

function PainelMonitor() {
  const { perfil } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: eu } = useEu();
  const { data: todas = [] } = useQuery(monitoriasQuery);
  const { data: alunos = [] } = useQuery(alunosQuery);
  const { data: atendimentos = [] } = useQuery(atendimentosQuery);
  const minhas = todas.filter((m) => m.monitor_id === eu?.id);
  const meus = atendimentos.filter((a) => a.monitor_id === eu?.id);

  const [monitoriaId, setMonitoriaId] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [topicos, setTopicos] = useState("");
  const [presentes, setPresentes] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  function alternar(id: string) {
    setPresentes((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function registrar(e: FormEvent) {
    e.preventDefault();
    if (!monitoriaId || !topicos.trim() || !eu) { toast.error("Selecione a monitoria e informe os tópicos abordados."); return; }
    setSalvando(true);
    const { data: at, error } = await supabase.from("atendimentos").insert({ monitoria_id: monitoriaId, monitor_id: eu.id, data, topicos: topicos.trim() }).select("id").single();
    if (error || !at) {
      setSalvando(false);
      { toast.error("Não foi possível registrar o atendimento."); return; }
    }
    if (alunos.length) {
      await supabase.from("presencas").insert(alunos.map((a) => ({ atendimento_id: at.id, aluno_id: a.id, presente: presentes.has(a.id) })));
    }
    setSalvando(false);
    setTopicos("");
    setPresentes(new Set());
    qc.invalidateQueries({ queryKey: ["atendimentos"] });
    toast.success("Atendimento e presenças registrados com sucesso.");
  }

  return (
    <LayoutPainel perfil={perfil} titulo="Painel do Monitor" descricao="Registre seus atendimentos e a presença dos alunos.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metrica rotulo="Minhas monitorias" valor={minhas.length} />
        <Metrica rotulo="Atendimentos realizados" valor={meus.length} />
        <Metrica rotulo="Presenças registradas" valor={meus.reduce((t, a) => t + a.presencas.filter((p) => p.presente).length, 0)} />
      </div>

      <section aria-labelledby="registrar" className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 id="registrar" className="mb-4 text-xl font-semibold">Registrar Atendimento</h2>
        {minhas.length === 0 ? (
          <p className="text-muted-foreground">Você ainda não está vinculado a nenhuma monitoria. Procure a coordenação.</p>
        ) : (
          <form onSubmit={registrar} className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monitoria">Monitoria</Label>
                <Select value={monitoriaId} onValueChange={setMonitoriaId}>
                  <SelectTrigger id="monitoria"><SelectValue placeholder="Selecione a disciplina" /></SelectTrigger>
                  <SelectContent>
                    {minhas.map((m) => <SelectItem key={m.id} value={m.id}>{m.disciplinas?.nome} – {m.dia_semana} {hora(m.horario_inicio)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topicos">Tópicos abordados</Label>
                <Textarea id="topicos" rows={4} value={topicos} onChange={(e) => setTopicos(e.target.value)} placeholder="Ex.: Laços de repetição e exercícios de vetores" required />
              </div>
              <Button type="submit" disabled={salvando}>Registrar atendimento</Button>
            </div>
            <fieldset className="rounded-md border p-4">
              <legend className="px-1 font-medium">Lista de presença ({presentes.size} de {alunos.length})</legend>
              <ul className="max-h-80 space-y-2 overflow-auto">
                {alunos.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-muted">
                    <Checkbox id={`aluno-${a.id}`} checked={presentes.has(a.id)} onCheckedChange={() => alternar(a.id)} />
                    <Label htmlFor={`aluno-${a.id}`} className="flex-1 cursor-pointer font-normal">
                      {a.nome} <span className="text-muted-foreground">– Matrícula {a.matricula}</span>
                    </Label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </form>
        )}
      </section>

      <section aria-labelledby="historico" className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 id="historico" className="mb-3 text-xl font-semibold">Histórico de atendimentos</h2>
        <Table>
          <TableCaption>Atendimentos realizados por você</TableCaption>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Disciplina</TableHead><TableHead>Tópicos</TableHead><TableHead className="text-right">Presentes</TableHead></TableRow></TableHeader>
          <TableBody>
            {meus.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground">Nenhum atendimento registrado.</TableCell></TableRow>}
            {meus.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{formatarData(a.data)}</TableCell>
                <TableCell>{a.monitorias?.disciplinas?.nome}</TableCell>
                <TableCell>{a.topicos}</TableCell>
                <TableCell className="text-right">{a.presencas.filter((p) => p.presente).length} / {a.presencas.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </LayoutPainel>
  );
}
