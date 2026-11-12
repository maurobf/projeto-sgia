import { useEffect, useState } from "react";
import { Volume2, Square, Contrast, AArrowUp, AArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function falar(texto: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  window.speechSynthesis.speak(u);
}

export function pararFala() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Botão "Ouvir" que lê um texto ou o conteúdo de um elemento. */
export function OuvirBotao({ texto, alvoId, rotulo = "Ouvir" }: { texto?: string; alvoId?: string; rotulo?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`${rotulo}: leitura em voz alta`}
      onClick={() => falar(texto ?? document.getElementById(alvoId ?? "")?.innerText ?? "")}
    >
      <Volume2 aria-hidden="true" />
      <span>{rotulo}</span>
    </Button>
  );
}

const ESCALAS = [87.5, 100, 112.5, 125, 150];

export function BarraAcessibilidade() {
  const [escala, setEscala] = useState(1);
  const [contraste, setContraste] = useState(false);

  useEffect(() => {
    const e = Number(localStorage.getItem("sgma-fonte") ?? "1");
    const c = localStorage.getItem("sgma-contraste") === "1";
    setEscala(Number.isFinite(e) ? e : 1);
    setContraste(c);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${ESCALAS[escala]}%`;
    document.documentElement.classList.toggle("alto-contraste", contraste);
    localStorage.setItem("sgma-fonte", String(escala));
    localStorage.setItem("sgma-contraste", contraste ? "1" : "0");
  }, [escala, contraste]);

  return (
    <div role="toolbar" aria-label="Recursos de acessibilidade" className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-1 px-4 py-1 text-sm">
        <span className="mr-auto hidden sm:inline">Acessibilidade</span>
        <Button variant="toolbar" size="sm" aria-label="Diminuir tamanho da fonte" disabled={escala === 0} onClick={() => setEscala((v) => Math.max(0, v - 1))}>
          <AArrowDown aria-hidden="true" /> A-
        </Button>
        <Button variant="toolbar" size="sm" aria-label="Aumentar tamanho da fonte" disabled={escala === ESCALAS.length - 1} onClick={() => setEscala((v) => Math.min(ESCALAS.length - 1, v + 1))}>
          <AArrowUp aria-hidden="true" /> A+
        </Button>
        <Button variant="toolbar" size="sm" aria-pressed={contraste} onClick={() => setContraste((v) => !v)}>
          <Contrast aria-hidden="true" /> Alto contraste
        </Button>
        <Button variant="toolbar" size="sm" onClick={() => falar(document.getElementById("conteudo")?.innerText ?? "")}>
          <Volume2 aria-hidden="true" /> Ouvir esta página
        </Button>
        <Button variant="toolbar" size="sm" aria-label="Parar leitura" onClick={pararFala}>
          <Square aria-hidden="true" /> Parar
        </Button>
      </div>
    </div>
  );
}
