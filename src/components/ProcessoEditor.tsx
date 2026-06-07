import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

interface Cliente {
  id: string;
  nome: string;
}

interface ProcessoEditorProps {
  onAnalysisStart?: () => void;
  onAnalysisComplete?: (result: any) => void;
  onAnalysisError?: (error: string) => void;
}

type AIEngine = "gemini" | "chatgpt" | "jus_ia";

export const ProcessoEditor: React.FC<ProcessoEditorProps> = ({
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError
}) => {
  // ── Estados para Extração e Gerenciamento de Fluxo ──
  const [extraindoTexto, setExtraindoTexto] = useState(false);
  const [textoExtraido, setTextoExtraido] = useState("");
  const [analisando, setAnalisando] = useState(false);

  // ── Estados do Formulário e Metadados ──
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<AIEngine>("jus_ia");
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [valorCausa, setValorCausa] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [vara, setVara] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega lista de clientes para vinculação
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nome")
          .order("nome", { ascending: true });

        if (error) throw error;
        if (data) setClientes(data);
      } catch (err: any) {
        console.error("Erro ao carregar carteira de clientes:", err.message);
      }
    };
    carregarClientes();
  }, []);

  // Extração de texto de arquivos PDF usando pdf.js
  const extrairTextoDoPdf = async (arquivoPdf: File): Promise<string> => {
    const pdfjs = (window as any).pdfjsLib || null;
    if (!pdfjs) {
      throw new Error("Biblioteca de leitura de PDF não carregada no navegador.");
    }
    const arrayBuffer = await arquivoPdf.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalPaginas = pdf.numPages;
    let textoCompleto = "";

    for (let i = 1; i <= totalPaginas; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      textoCompleto += pageText + "\n";
    }

    return textoCompleto.trim();
  };

  // Processamento do arquivo selecionado (PDF ou TXT)
  const processarArquivo = async (file: File) => {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "pdf" && ext !== "txt") {
      alert("Formato de arquivo inválido. Por favor, selecione um arquivo .pdf ou .txt.");
      return;
    }

    setExtraindoTexto(true);
    setNomeArquivo(file.name);

    try {
      let texto = "";
      if (ext === "txt") {
        texto = await file.text();
      } else if (ext === "pdf") {
        texto = await extrairTextoDoPdf(file);
      }

      if (!texto.trim()) {
        throw new Error("O arquivo está vazio ou não possui camada de texto digitalizável.");
      }

      setTextoExtraido(texto);

      // Tenta extrair o número do processo (CNJ) por regex se não estiver preenchido
      if (!numeroProcesso) {
        const cnjRegex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
        const match = texto.match(cnjRegex);
        if (match) {
          setNumeroProcesso(match[0]);
        }
      }
    } catch (err: any) {
      console.error("Erro no processamento do arquivo:", err);
      alert(err.message || "Erro ao processar o arquivo. Certifique-se de que é um PDF textual válido.");
      setNomeArquivo("");
      setTextoExtraido("");
    } finally {
      setExtraindoTexto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processarArquivo(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarArquivo(e.dataTransfer.files[0]);
    }
  };

  // Dispara a chamada de análise para a JUS IA
  const handleExecutarAnalise = async () => {
    if (!textoExtraido.trim()) {
      alert("Por favor, faça upload de um arquivo .txt ou .pdf, ou cole o teor do processo no campo de texto.");
      return;
    }
    if (!clienteSelecionadoId) {
      alert("Por favor, selecione um cliente para vincular esta análise processual.");
      return;
    }

    setAnalisando(true);
    if (onAnalysisStart) onAnalysisStart();

    const rotaApi =
      selectedEngine === "chatgpt"
        ? "/api/analisar-chatgpt"
        : selectedEngine === "jus_ia"
        ? "/api/analisar-jus_ia"
        : "/api/analisar-processo";

    try {
      const response = await fetch(rotaApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoDocumento: textoExtraido })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Erro na resposta do motor de inteligência artificial.");
      }

      const result = await response.json();
      
      // Vincula no banco de dados se houver um número de processo e cliente selecionado
      if (numeroProcesso && clienteSelecionadoId) {
        const { data: existingProc } = await supabase
          .from("processos")
          .select("id")
          .eq("numero_processo", numeroProcesso)
          .maybeSingle();

        let procId = existingProc?.id;

        if (!procId) {
          const { data: newProc, error: insertErr } = await supabase
            .from("processos")
            .insert({
              cliente_id: clienteSelecionadoId,
              numero_processo: numeroProcesso,
              titulo: `Análise Processual - ${numeroProcesso}`,
              valor_causa: valorCausa ? parseFloat(valorCausa) : null,
              tribunal: tribunal || null,
              vara: vara || null,
              status: "Análise Inicial"
            })
            .select("id")
            .single();
          
          if (!insertErr && newProc) {
            procId = newProc.id;
          }
        }

        if (procId) {
          await supabase.from("analise_cache").insert({
            processo_id: procId,
            engine: selectedEngine,
            resultado_json: result
          });
        }
      }

      if (onAnalysisComplete) onAnalysisComplete(result);
    } catch (err: any) {
      console.error("Erro na análise IA:", err);
      if (onAnalysisError) onAnalysisError(err.message);
      alert(err.message || "Falha ao processar a requisição com o motor selecionado.");
    } finally {
      setAnalisando(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#111c30] border border-slate-200 dark:border-[#d4af37]/10 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* ── 1. Entrada de Documento ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
          Entrada de Documento
        </h3>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-[#d4af37] bg-slate-100 dark:bg-slate-800/50"
              : nomeArquivo
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-slate-300 dark:border-slate-700 hover:border-[#d4af37]/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="space-y-2">
            <svg
              className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            
            {nomeArquivo ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#0f1e36] dark:text-slate-200">
                  Documento Selecionado:
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {nomeArquivo}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-[#0f1e36] dark:text-slate-200">
                  Arraste e solte os autos do processo (.txt ou .pdf)
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Ou clique para navegar em seus arquivos locais (máximo 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Indicador de Progresso de Leitura de Alta Densidade */}
        {extraindoTexto && (
          <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
            <p className="text-xs text-[#0f1e36] dark:text-slate-300 font-medium animate-pulse">
              Lendo páginas do documento técnico e extraindo conteúdo...
            </p>
          </div>
        )}

        {/* Campo de Texto para Visualização / Edição Manual */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Teor do Processo / Petição Inicial
          </label>
          <textarea
            value={textoExtraido}
            onChange={(e) => setTextoExtraido(e.target.value)}
            rows={5}
            placeholder="O texto extraído do documento aparecerá aqui, ou você pode colar diretamente os fatos e andamentos..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-[#0f1e36] dark:text-slate-200 outline-none focus:border-[#d4af37] transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* ── 2. Associação Jurídica e Metadados ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
          Associação Jurídica
        </h3>

        <div className="space-y-3">
          {/* Selecionar Cliente */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Vincular ao Cliente *
            </label>
            <select
              value={clienteSelecionadoId}
              onChange={(e) => setClienteSelecionadoId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer transition-colors"
              required
            >
              <option value="">Selecione o cliente destinatário...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Grid de Metadados Processuais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Número do Processo (CNJ)
              </label>
              <input
                type="text"
                placeholder="0000000-00.0000.0.00.0000"
                value={numeroProcesso}
                onChange={(e) => setNumeroProcesso(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Valor da Causa (R$)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={valorCausa}
                onChange={(e) => setValorCausa(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Tribunal
              </label>
              <input
                type="text"
                placeholder="Ex: TJSP, TRF3, TRT2"
                value={tribunal}
                onChange={(e) => setTribunal(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Vara / Câmara
              </label>
              <input
                type="text"
                placeholder="Ex: 3ª Vara Cível, 2ª Vara Trabalho"
                value={vara}
                onChange={(e) => setVara(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
            </div>
          </div>

          {/* Seleção do Motor IA */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Motor de Inteligência Artificial
            </label>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value as AIEngine)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer transition-colors"
            >
              <option value="jus_ia">Jus IA (Motor de Admissibilidade e Teses)</option>
              <option value="gemini">Google Gemini (Análise Multimodal e Alta Densidade)</option>
              <option value="chatgpt">OpenAI ChatGPT (Análise Semântica e Doutrinária)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. Botão de Disparo da IA ── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleExecutarAnalise}
          disabled={extraindoTexto || analisando || !textoExtraido.trim()}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            extraindoTexto || analisando || !textoExtraido.trim()
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-none"
              : "bg-[#0f1e36] hover:bg-[#1b3255] text-white border border-[#d4af37]/35 cursor-pointer shadow-md hover:shadow-lg"
          }`}
        >
          {analisando ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Processando Análise IA...</span>
            </div>
          ) : (
            <span>
              {extraindoTexto
                ? "Processando documento técnico..."
                : "Gerar Peça Processual via JUS IA"}
            </span>
          )}
        </button>
      </div>

    </div>
  );
};
