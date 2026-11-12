import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exigirPainel } from "@/lib/sessao";
import { DIAS, atendimentosQuery, disciplinasQuery, monitoresQuery, monitoriasQuery } from "@/lib/consultas";
import { formatarData, gerarCsv, hora } from "@/lib/sgma";
import { LayoutPainel, Metrica } from "@/components/sgma/painel";
import { NovoUsuarioForm } from "@/components/sgma/novo-usuario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/dashboard/coordenador")({
  head: () => ({ meta: [{ title: "Painel do Coordenador – SGMA" }, { name: "description", content: "Gestão de disciplinas, monitores e relatórios." }] }),
  beforeLoad: () => exigirPainel("coordenador"),
  component: PainelCoordenador,
});

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function PainelCoordenador() {
  const { perfil } = Route.useRouteContext();
  const { data: disciplinas = [] } = useQuery(disciplinasQuery);
  const { data: monitores = [] } = useQuery(monitoresQuery);
  const { data: monitorias = [] } = useQuery(monitoriasQuery);
  const { data: atendimentos = [] } = useQuery(atendimentosQuery);
  const todas = atendimentos.flatMap((a) => a.presencas);
  const freq = todas.length ? Math.round((todas.filter((p) => p.presente).length / todas.length) * 100) : 0;

  return (
    <LayoutPainel perfil={perfil} titulo="Painel do Coordenador" descricao="Acompanhe as monitorias, cadastre disciplinas e monitores e exporte relatórios.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica rotulo="Monitorias ativas" valor={monitorias.length} />
        <Metrica rotulo="Monitores" valor={monitores.length} />
        <Metrica rotulo="Atendimentos" valor={atendimentos.length} />
        <Metrica rotulo="Frequência média" valor={`${freq}%`} />
      </div>
      <Tabs defaultValue="disciplinas">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="disciplinas">Cadastrar Disciplina</TabsTrigger>
          <TabsTrigger value="monitores">Cadastrar/Gerenciar Monitores</TabsTrigger>
          <TabsTrigger value="atividades">Acompanhar Atividades</TabsTrigger>
          <TabsTrigger value="relatorios">Exportar Relatórios de Frequência</TabsTrigger>
        </TabsList>
        <TabsContent value="disciplinas" className="space-y-6"><Disciplinas disciplinas={disciplinas} /></TabsContent>
        <TabsContent value="monitores" className="space-y-6"><Monitores /></TabsContent>
        <TabsContent value="atividades"><Atividades /></TabsContent>
        <TabsContent value="relatorios"><Relatorios /></TabsContent>
      </Tabs>
    </LayoutPainel>
  );
}

function Disciplinas({ disciplinas }: { disciplinas: { id: string; codigo: string; nome: string; curso: string }[] }) {
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !nome.trim()) { toast.error("Informe código e nome da disciplina."); return; }
    const { error } = await supabase.from("disciplinas").insert({ codigo: codigo.trim().toUpperCase(), nome: nome.trim() });
    if (error) { toast.error("Não foi possível cadastrar (código já existe?)."); return; }
    setCodigo(""); setNome("");
    qc.invalidateQueries({ queryKey: ["disciplinas"] });
    toast.success("Disciplina cadastrada.");
  }
  return (
    <>
      <Secao titulo="Nova disciplina com monitoria">
        <form onSubmit={salvar} className="grid gap-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
          <div className="space-y-2"><Label htmlFor="d-cod">Código</Label><Input id="d-cod" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="DS203" /></div>
          <div className="space-y-2"><Label htmlFor="d-nome">Nome da disciplina</Label><Input id="d-nome" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <Button type="submit">Cadastrar disciplina</Button>
        </form>
      </Secao>
      <Secao titulo="Disciplinas cadastradas">
        <Table>
          <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Disciplina</TableHead><TableHead>Curso</TableHead></TableRow></TableHeader>
          <TableBody>{disciplinas.map((d) => <TableRow key={d.id}><TableCell className="font-medium">{d.codigo}</TableCell><TableCell>{d.nome}</TableCell><TableCell>{d.curso}</TableCell></TableRow>)}</TableBody>
        </Table>
      </Secao>
    </>
  );
}

function Monitores() {
  const qc = useQueryClient();
  const { data: disciplinas = [] } = useQuery(disciplinasQuery);
  const { data: monitores = [] } = useQuery(monitoresQuery);
  const { data: monitorias = [] } = useQuery(monitoriasQuery);
  const [v, setV] = useState({ disciplina_id: "", monitor_id: "", dia_semana: "Segunda-feira", horario_inicio: "14:00", horario_fim: "16:00", local: "" });

  async function vincular(e: FormEvent) {
    e.preventDefault();
    if (!v.disciplina_id || !v.monitor_id || !v.local.trim()) { toast.error("Preencha disciplina, monitor e local."); return; }
    const { error } = await supabase.from("monitorias").insert(v);
    if (error) { toast.error("Não foi possível vincular a monitoria."); return; }
    qc.invalidateQueries({ queryKey: ["monitorias"] });
    setV({ ...v, local: "" });
    toast.success("Monitoria vinculada e disponível para os alunos.");
  }
  async function remover(id: string) {
    await supabase.from("monitorias").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["monitorias"] });
    toast.success("Monitoria removida.");
  }

  return (
    <>
      <Secao titulo="Cadastrar novo monitor"><NovoUsuarioForm perfis={["monitor"]} padrao="monitor" /></Secao>
      <Secao titulo="Vincular monitor a disciplina e horário">
        <form onSubmit={vincular} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="v-disc">Disciplina</Label>
            <Select value={v.disciplina_id} onValueChange={(x) => setV({ ...v, disciplina_id: x })}><SelectTrigger id="v-disc"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{disciplinas.map((d) => <SelectItem key={d.id} value={d.id}>{d.codigo} – {d.nome}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="v-mon">Monitor</Label>
            <Select value={v.monitor_id} onValueChange={(x) => setV({ ...v, monitor_id: x })}><SelectTrigger id="v-mon"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{monitores.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="v-dia">Dia da semana</Label>
            <Select value={v.dia_semana} onValueChange={(x) => setV({ ...v, dia_semana: x })}><SelectTrigger id="v-dia"><SelectValue /></SelectTrigger>
              <SelectContent>{DIAS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="v-ini">Início</Label><Input id="v-ini" type="time" value={v.horario_inicio} onChange={(e) => setV({ ...v, horario_inicio: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="v-fim">Término</Label><Input id="v-fim" type="time" value={v.horario_fim} onChange={(e) => setV({ ...v, horario_fim: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="v-local">Local</Label><Input id="v-local" value={v.local} onChange={(e) => setV({ ...v, local: e.target.value })} placeholder="Laboratório 2 – Bloco A" /></div>
          <Button type="submit" className="sm:col-span-2 lg:col-span-3 lg:justify-self-start">Vincular monitoria</Button>
        </form>
      </Secao>
      <Secao titulo="Monitores cadastrados">
        <Table>
          <TableCaption>Equipes de monitoria e seus horários</TableCaption>
          <TableHeader><TableRow><TableHead>Monitor</TableHead><TableHead>Matrícula</TableHead><TableHead>Monitorias</TableHead></TableRow></TableHeader>
          <TableBody>
            {monitores.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}<span className="block text-xs text-muted-foreground">{m.email}</span></TableCell>
                <TableCell>{m.matricula ?? "—"}</TableCell>
                <TableCell>
                  <ul className="space-y-1">
                    {monitorias.filter((x) => x.monitor_id === m.id).map((x) => (
                      <li key={x.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <span>{x.disciplinas?.nome} · {x.dia_semana} {hora(x.horario_inicio)}–{hora(x.horario_fim)} · {x.local}</span>
                        <Button variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={() => remover(x.id)} aria-label={`Remover monitoria de ${x.disciplinas?.nome}`}>Remover</Button>
                      </li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Secao>
    </>
  );
}

function Atividades() {
  const { data: atendimentos = [] } = useQuery(atendimentosQuery);
  return (
    <Secao titulo="Atividades dos monitores">
      <Table>
        <TableCaption>Atendimentos registrados, do mais recente ao mais antigo</TableCaption>
        <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Monitor</TableHead><TableHead>Disciplina</TableHead><TableHead>Tópicos</TableHead><TableHead className="text-right">Presentes</TableHead></TableRow></TableHeader>
        <TableBody>
          {atendimentos.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{formatarData(a.data)}</TableCell>
              <TableCell>{a.profiles?.nome}</TableCell>
              <TableCell>{a.monitorias?.disciplinas?.nome}</TableCell>
              <TableCell>{a.topicos}</TableCell>
              <TableCell className="text-right">{a.presencas.filter((p) => p.presente).length} / {a.presencas.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Secao>
  );
}

function Relatorios() {
  const { data: atendimentos = [] } = useQuery(atendimentosQuery);
  const porDisciplina = new Map<string, { atend: number; pres: number; total: number }>();
  for (const a of atendimentos) {
    const nome = a.monitorias?.disciplinas?.nome ?? "—";
    const r = porDisciplina.get(nome) ?? { atend: 0, pres: 0, total: 0 };
    r.atend += 1;
    r.pres += a.presencas.filter((p) => p.presente).length;
    r.total += a.presencas.length;
    porDisciplina.set(nome, r);
  }
  function exportar() {
    const linhas: (string | number)[][] = [["Data", "Disciplina", "Monitor", "Tópicos", "Presentes", "Total de alunos", "Frequência (%)"]];
    for (const a of atendimentos) {
      const p = a.presencas.filter((x) => x.presente).length;
      linhas.push([formatarData(a.data), a.monitorias?.disciplinas?.nome ?? "", a.profiles?.nome ?? "", a.topicos, p, a.presencas.length, a.presencas.length ? Math.round((p / a.presencas.length) * 100) : 0]);
    }
    const blob = new Blob(["\ufeff" + gerarCsv(linhas)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-frequencia-sgma-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado.");
  }
  return (
    <Secao titulo="Relatório de frequência e atendimentos">
      <Table>
        <TableHeader><TableRow><TableHead>Disciplina</TableHead><TableHead className="text-right">Atendimentos</TableHead><TableHead className="text-right">Presenças</TableHead><TableHead className="text-right">Frequência</TableHead></TableRow></TableHeader>
        <TableBody>
          {[...porDisciplina].map(([nome, r]) => (
            <TableRow key={nome}><TableCell>{nome}</TableCell><TableCell className="text-right">{r.atend}</TableCell><TableCell className="text-right">{r.pres} / {r.total}</TableCell><TableCell className="text-right">{r.total ? Math.round((r.pres / r.total) * 100) : 0}%</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
      <Button className="mt-4" onClick={exportar}><Download aria-hidden="true" /> Exportar CSV</Button>
    </Secao>
  );
}
