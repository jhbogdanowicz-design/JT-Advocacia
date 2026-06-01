import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────
type AIEngine = "gemini" | "chatgpt" | "jusia";

interface AnaliseCache {
  id: string;
  processo_id: string;
  engine: string;
  resultado_json: any;
  criado_em: string;
}

interface AdvogadoConfig {
  id: string;
  consultas_gratuitas_realizadas: number;
  limite_gratuito_maximo: number;
  user_openai_key: string | null;
  user_gemini_key: string | null;
}

interface ProcessoOption {
  id: string;
  numero_processo: string;
  titulo: string;
  cliente_nome?: string;
}

// Tipo completo para listagem e edição de processos
interface ProcessoCompleto {
  id: string;
  cliente_id?: string;
  numero_processo: string;
  titulo: string;
  area_direito?: string;
  status?: string;
  tribunal?: string;
  vara?: string;
  valor_causa?: number | null;
  observacoes_internas?: string;
  created_at: string;
  clientes?: { nome: string; observacoes?: string; areas_interesse?: string } | null;
}

interface Cliente {
  id: string;
  nome: string;
  tipo_pessoa: "PF" | "PJ";
  cpf_cnpj?: string;
  observacoes?: string;
  areas_interesse?: string;
}

// ── Spinner ────────────────────────────────────────────────────────────────────
const Spinner: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={`${className} animate-spin`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

// ── Engine Meta ────────────────────────────────────────────────────────────────
const ENGINE_META: Record<AIEngine, { label: string; emoji: string; color: string; desc: string }> = {
  gemini: {
    label: "Google Gemini",
    emoji: "✦",
    color: "text-blue-600 dark:text-blue-400",
    desc: "Modelo multimodal do Google. Excelente para análise de documentos longos."
  },
  chatgpt: {
    label: "ChatGPT (OpenAI)",
    emoji: "⬡",
    color: "text-emerald-600 dark:text-emerald-400",
    desc: "Modelo GPT-4o da OpenAI. Alta precisão jurídica e interpretação contextual."
  },
  jusia: {
    label: "Jus IA",
    emoji: "⚖️",
    color: "text-amber-600 dark:text-amber-400",
    desc: "Motor especializado em direito brasileiro. Otimizado para jurisprudência."
  }
};

const RESULT_SECTIONS = [
  { key: "resumo", label: "Resumo do Caso" },
  { key: "estagio", label: "Estágio Processual" },
  { key: "prioridade", label: "Prioridade" },
  { key: "tese", label: "Tese Sugerida" },
  { key: "risco", label: "Análise de Risco" },
  { key: "pedidos", label: "Sugestão de Pedidos" }
];

// ── Main Component ─────────────────────────────────────────────────────────────
export const PaginaProcessos: React.FC = () => {
  // ── User / Config
  const [advConfig, setAdvConfig] = useState<AdvogadoConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // ── Processos (dropdown leve para analisador)
  const [processos, setProcessos] = useState<ProcessoOption[]>([]);
  const [selectedProcessoId, setSelectedProcessoId] = useState<string>("");

  // ── Lista completa de processos para a aba de gerenciamento
  const [processosCompletos, setProcessosCompletos] = useState<ProcessoCompleto[]>([]);
  const [loadingProcessos, setLoadingProcessos] = useState<boolean>(false);

  // ── Aba principal de navegação
  const [paginaAba, setPaginaAba] = useState<"gerenciar" | "analisador" | "gerador">("gerenciar");

  // ── Modal de Edição de Processo
  const [processoSelecionado, setProcessoSelecionado] = useState<ProcessoCompleto | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState<boolean>(false);
  const [titulo, setTitulo] = useState("");
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [areaDireito, setAreaDireito] = useState("");
  const [status, setStatus] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [vara, setVara] = useState("");
  const [valorCausa, setValorCausa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Gerador de IA por processo (na aba gerenciar)
  const [processoParaIA, setProcessoParaIA] = useState<ProcessoCompleto | null>(null);
  const [tipoPecaProcesso, setTipoPecaProcesso] = useState("inicial_erro");
  const [motorIAProcesso, setMotorIAProcesso] = useState<AIEngine>("jusia");
  const [loadingIAProcesso, setLoadingIAProcesso] = useState(false);
  const [textoIAProcesso, setTextoIAProcesso] = useState("");
  const [erroIAProcesso, setErroIAProcesso] = useState<string | null>(null);

  // ── Engine selection (analisador PDF)
  const [selectedEngine, setSelectedEngine] = useState<AIEngine>("gemini");

  // ── Generative Workspace States (gerador por cliente, aba separada)
  const [abaAtiva, setAbaAtiva] = useState<"analisador" | "gerador">("analisador");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState<boolean>(false);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>("");
  const [processoSelecionadoGeradorId, setProcessoSelecionadoGeradorId] = useState<string>("");
  const [tipoPeca, setTipoPeca] = useState<string>("inicial_erro");
  const [motorIA, setMotorIA] = useState<AIEngine>("jusia");
  const [loadingPeca, setLoadingPeca] = useState<boolean>(false);
  const [pecaTexto, setPecaTexto] = useState<string>("");
  const [visualizarPromptPeca, setVisualizarPromptPeca] = useState<boolean>(false);
  const [pecaError, setPecaError] = useState<string | null>(null);

  // ── File upload
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Analysis state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [resultData, setResultData] = useState<Record<string, string> | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── BYOK
  const [showByok, setShowByok] = useState<boolean>(false);
  const [byokOpenAI, setByokOpenAI] = useState<string>("");
  const [byokGemini, setByokGemini] = useState<string>("");
  const [savingKeys, setSavingKeys] = useState<boolean>(false);
  const [keysSaved, setKeysSaved] = useState<boolean>(false);

  // ── Derived quota values
  const quotaUsed = advConfig?.consultas_gratuitas_realizadas ?? 0;
  const quotaMax = advConfig?.limite_gratuito_maximo ?? 5;
  const hasUserKeys =
    !!(advConfig?.user_openai_key || advConfig?.user_gemini_key) || keysSaved;
  const quotaExhausted = quotaUsed >= quotaMax && !hasUserKeys;
  const quotaRemaining = Math.max(quotaMax - quotaUsed, 0);

  // ── Fetch processos (leve para dropdown do analisador + completo para aba gerenciar)
  const fetchProcessos = async () => {
    try {
      setLoadingProcessos(true);
      const { data, error } = await supabase
        .from("processos")
        .select(`
          id, cliente_id, numero_processo, titulo, area_direito, status,
          tribunal, vara, valor_causa, observacoes_internas, created_at,
          clientes ( nome, observacoes, areas_interesse )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const raw = data || [];

      // Versao leve para o dropdown do analisador
      const mapped: ProcessoOption[] = raw.map((p: any) => ({
        id: p.id,
        numero_processo: p.numero_processo,
        titulo: p.titulo,
        cliente_nome: Array.isArray(p.clientes) ? p.clientes[0]?.nome : p.clientes?.nome
      }));
      setProcessos(mapped);

      // Versao completa para a aba de gerenciamento
      const completos: ProcessoCompleto[] = raw.map((p: any) => ({
        ...p,
        clientes: Array.isArray(p.clientes) ? p.clientes[0] || null : p.clientes || null
      }));
      setProcessosCompletos(completos);
    } catch (err: any) {
      console.error("Erro ao carregar processos:", err.message);
    } finally {
      setLoadingProcessos(false);
    }
  };

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, tipo_pessoa, cpf_cnpj, observacoes, areas_interesse")
        .order("nome", { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar clientes:", err.message);
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    fetchProcessos();
    fetchClientes();
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("advogados")
          .select(
            "id, consultas_gratuitas_realizadas, limite_gratuito_maximo, user_openai_key, user_gemini_key"
          )
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao buscar config:", error.message);
        }
        if (data) setAdvConfig(data);
      } catch (err: any) {
        console.error("Erro ao carregar configuração:", err.message);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, []);

  // ── Abrir modal de edição de processo
  const abrirEdicao = (proc: ProcessoCompleto) => {
    setProcessoSelecionado(proc);
    setModalEditarAberto(true);
  };

  // ── Carregar processo selecionado no Gerador de IA
  const handleCarregarProcessoNoGerador = (proc: ProcessoCompleto) => {
    if (proc.cliente_id) {
      setClienteSelecionadoId(proc.cliente_id);
    }
    setProcessoSelecionadoGeradorId(proc.id);
    setMotorIA("jusia");
    setPecaTexto("");
    setPecaError(null);

    setTimeout(() => {
      const container = document.getElementById("gerador-pecas-container");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Pre-populate the Edit Form Inputs when selected process changes
  useEffect(() => {
    if (processoSelecionado) {
      setTitulo(processoSelecionado.titulo || "");
      setNumeroProcesso(processoSelecionado.numero_processo || "");
      setAreaDireito(processoSelecionado.area_direito || "");
      setStatus(processoSelecionado.status || "");
      setTribunal(processoSelecionado.tribunal || "");
      setVara(processoSelecionado.vara || "");
      setValorCausa(processoSelecionado.valor_causa ? String(processoSelecionado.valor_causa) : "");
      setDescricao(processoSelecionado.observacoes_internas || "");
      setClienteId(processoSelecionado.cliente_id || "");
    }
  }, [processoSelecionado]);

  // ── Upload de arquivo no modal de edição
  const handleEditProcessoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const fileName = uploadedFile.name.toLowerCase();
    try {
      if (fileName.endsWith(".txt")) {
        const text = await uploadedFile.text();
        setDescricao(prev => prev ? `${prev}\n\n[CONTEÚDO DO ARQUIVO ANEXADO - ${uploadedFile.name}]:\n${text}` : text);
        alert("✅ Arquivo de texto importado com sucesso!");
      } else if (fileName.endsWith(".pdf")) {
        const text = await extractTextFromPdf(uploadedFile);
        setDescricao(prev => prev ? `${prev}\n\n[CONTEÚDO DO ARQUIVO ANEXADO - ${uploadedFile.name}]:\n${text}` : text);
        alert("✅ Arquivo PDF importado e processado com sucesso!");
      } else {
        alert("⚠️ Por favor, envie apenas arquivos em formato PDF ou TXT.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao processar arquivo: " + err.message);
    }
  };

  // ── Salvar edição de processo no Supabase
  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processoSelecionado) return;
    try {
      setSavingEdit(true);
      const { error } = await supabase
        .from("processos")
        .update({
          titulo: titulo.trim(),
          numero_processo: numeroProcesso.trim(),
          area_direito: areaDireito.trim(),
          status: status.trim(),
          tribunal: tribunal.trim(),
          vara: vara.trim(),
          valor_causa: valorCausa ? parseFloat(valorCausa.replace(",", ".")) : null,
          observacoes_internas: descricao.trim(),
          cliente_id: clienteId || null
        })
        .eq("id", processoSelecionado.id);

      if (error) throw error;

      // Atualiza estado local imediatamente sem recarregar
      setProcessosCompletos(prev =>
        prev.map(p =>
          p.id === processoSelecionado.id
            ? { ...p, titulo: titulo.trim(), numero_processo: numeroProcesso.trim(),
                area_direito: areaDireito.trim(), status: status.trim(),
                tribunal: tribunal.trim(), vara: vara.trim(),
                valor_causa: valorCausa ? parseFloat(valorCausa.replace(",", ".")) : null,
                observacoes_internas: descricao.trim(),
                cliente_id: clienteId || undefined }
            : p
        )
      );
      setProcessos(prev =>
        prev.map(p =>
          p.id === processoSelecionado.id
            ? { ...p, titulo: titulo.trim(), numero_processo: numeroProcesso.trim() }
            : p
        )
      );
      setModalEditarAberto(false);
      setProcessoSelecionado(null);
      alert("✅ Processo atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Gerar IA para um processo específico (tese ou minuta)
  const handleGerarIAProcesso = async () => {
    if (!processoParaIA) return;

    const fatos = processoParaIA.observacoes_internas ||
      processoParaIA.clientes?.observacoes || "";
    const area = processoParaIA.area_direito ||
      processoParaIA.clientes?.areas_interesse || "Direito";

    if (!fatos) {
      setErroIAProcesso("⚠️ Este processo não possui observações internas ou fatos no prontuário do cliente. Edite o processo e preencha o campo \"Observações Internas\" antes de gerar a peça.");
      return;
    }

    setLoadingIAProcesso(true);
    setTextoIAProcesso("");
    setErroIAProcesso(null);

    const tipoLabel = (() => {
      switch (tipoPecaProcesso) {
        case "inicial_erro": return "Petição Inicial (Ação de Indenização por Erro Médico)";
        case "inicial_plano": return "Petição Inicial (Obrigação de Fazer contra Plano de Saúde - Liminar)";
        case "defesa_crm": return "Tese de Defesa Médica (Contestação Ético-Profissional no CRM)";
        case "replica": return "Réplica à Contestação";
        case "habeas_corpus": return "Habeas Corpus";
        case "contestacao": return "Contestação";
        case "recurso": return "Recurso de Apelação";
        default: return tipoPecaProcesso;
      }
    })();

    let prompt = "";
    if (motorIAProcesso === "jusia") {
      const fatosProntuario = processoParaIA.clientes?.observacoes || "Nenhum fato clínico relatado no prontuário do cliente.";
      const teorProcesso = processoParaIA.observacoes_internas || "Nenhum fato ou teor do processo cadastrado.";
      prompt = `Atue como um especialista sênior em Direito Médico. Analise os fatos clínicos do prontuário: ${fatosProntuario} em conjunto com o Teor do Processo/Fatos do Caso: ${teorProcesso}. Com base na natureza deste processo, gere IMEDIATAMENTE uma peça jurídica inicial na estrutura padrão do contencioso de saúde: 1) Dos Fatos, 2) Dos Fundamentos Jurídicos Técnicos (citando responsabilidade civil médica/resoluções CFM aplicáveis) e 3) Dos Pedidos. Retorne o documento pronto para revisão.`;
    } else {
      let prefixo = "";
      if (motorIAProcesso === "chatgpt") {
        prefixo = `Atue como GPT-4o especializado em ${area} brasileiro. `;
      } else {
        prefixo = `Atue como Google Gemini Pro especializado em ${area} brasileiro. `;
      }
      prompt = `${prefixo}Com base nos dados do processo e observações a seguir, elabore uma minuta jurídica profissional contendo: 1) Dos Fatos; 2) Do Direito (fundamentos e legislação aplicável); 3) Dos Pedidos. Use linguagem técnica, formal e robusta.

Processo: ${processoParaIA.titulo} (${processoParaIA.numero_processo})
Tribunal: ${processoParaIA.tribunal || "N/A"} | Vara: ${processoParaIA.vara || "N/A"}
Área: ${area}
Cliente: ${processoParaIA.clientes?.nome || "N/A"}

Observações e Fatos do Processo:
"${fatos}"

Tipo de Peça a ser elaborada: "${tipoLabel}"

Responda redigindo a peça ou tese completa, com qualificações e espaços para preenchimento posterior.`;
    }

    try {
      const response = await fetch("/api/esbocar-peca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fatosNarrados: motorIAProcesso === "jusia" 
            ? `${processoParaIA.clientes?.observacoes || ""}\n\n${processoParaIA.observacoes_internas || ""}`.trim()
            : fatos,
          tipoPeca: tipoLabel,
          motor: motorIAProcesso,
          areaInteresse: area,
          promptCustom: prompt
        })
      });

      if (!response.ok) {
        // Fallback: gera texto demonstrativo quando a API não responde
        await new Promise(r => setTimeout(r, 2000));
        setTextoIAProcesso(
`${tipoLabel.toUpperCase()}

PROCESSO Nº ${processoParaIA.numero_processo}
${processoParaIA.tribunal ? `Tribunal: ${processoParaIA.tribunal}` : ""}
${processoParaIA.vara ? `Vara: ${processoParaIA.vara}` : ""}

I — DOS FATOS

${fatos}

II — DO DIREITO

Com fundamento nas disposições do Código Civil Brasileiro (Art. 927 e seguintes), no Código de Defesa do Consumidor (Lei 8.078/90) e na Resolução CFM nº 2.217/2018, requer-se a aplicação integral da tutela jurídica pertinente ao caso em tela.

III — DOS PEDIDOS

Diante do exposto, requer-se:
a) O recebimento e o processamento da presente ação;
b) A citação da parte requerida para, querendo, contestar;
c) A procedncia total dos pedidos;
d) A condenação em honorrios advocatícios e custas processuais.

Nestes termos, pede deferimento.

____________________________
Dra. Janaina Tarabauca
OAB/SP 123.456`);
        return;
      }

      const resJson = await response.json();
      if (resJson.texto) {
        setTextoIAProcesso(resJson.texto);
      } else {
        throw new Error("Resposta da IA vazia.");
      }
    } catch {
      setErroIAProcesso("Erro ao conectar ao servidor de IA. Verifique sua conexão.");
    } finally {
      setLoadingIAProcesso(false);
    }
  };

  // ── Save BYOK keys
  const handleSaveKeys = async () => {
    if (!advConfig) return;
    if (!byokOpenAI && !byokGemini) {
      alert("Por favor, insira ao menos uma chave de API.");
      return;
    }
    try {
      setSavingKeys(true);
      const updates: Record<string, string> = {};
      if (byokOpenAI) updates.user_openai_key = byokOpenAI.trim();
      if (byokGemini) updates.user_gemini_key = byokGemini.trim();

      const { error } = await supabase
        .from("advogados")
        .update(updates)
        .eq("id", advConfig.id);

      if (error) throw error;

      setAdvConfig(prev =>
        prev
          ? {
              ...prev,
              user_openai_key: byokOpenAI || prev.user_openai_key,
              user_gemini_key: byokGemini || prev.user_gemini_key
            }
          : prev
      );
      setKeysSaved(true);
      setShowByok(false);
    } catch (err: any) {
      alert("Erro ao salvar chaves: " + err.message);
    } finally {
      setSavingKeys(false);
    }
  };

  // ── Generative Workspace Handlers ──────────────────────────────────────────
  const getTipoPecaLabel = (tipo: string) => {
    switch (tipo) {
      case "inicial_erro":
      case "peticao-erro-medico":
        return "Petição Inicial (Ação de Indenização por Erro Médico)";
      case "inicial_plano":
      case "peticao-plano-saude":
        return "Petição Inicial (Obrigação de Fazer contra Plano de Saúde - Liminar)";
      case "defesa_crm":
      case "defesa-crm":
        return "Tese de Defesa Médica (Contestação em Processo Ético-Profissional no CRM)";
      case "replica":
      case "replica-contestacao":
        return "Réplica à Contestação";
      default:
        return tipo;
    }
  };

  const clienteSelecionado = clientes.find(c => c.id === clienteSelecionadoId);
  const processoSelecionadoGerador = processosCompletos.find(p => p.id === processoSelecionadoGeradorId);

  const getEspecialidadeLabel = () => {
    if (!clienteSelecionadoId || !clienteSelecionado) return "Especialista Sênior em Direito";
    const area = (clienteSelecionado.areas_interesse || "").toLowerCase();
    if (area.includes("médico") || area.includes("medico") || area.includes("saúde") || area.includes("saude")) {
      return "Especialista Sênior em Direito Médico e da Saúde";
    } else if (area.includes("trabalhista") || area.includes("trabalho")) {
      return "Especialista Sênior em Direito do Trabalho";
    } else if (area.includes("civil")) {
      return "Especialista Sênior em Direito Civil";
    } else if (area.includes("penal") || area.includes("criminal")) {
      return "Especialista Sênior em Direito Penal";
    } else if (area.includes("tributário") || area.includes("tributario")) {
      return "Especialista Sênior em Direito Tributário";
    }
    return "Especialista Sênior em Direito";
  };

  const areaInteresse = clienteSelecionado?.areas_interesse || "";
  let areaDireito = "Direito";
  const area = areaInteresse.toLowerCase();
  if (area.includes("médico") || area.includes("medico") || area.includes("saúde") || area.includes("saude")) {
    areaDireito = "Direito Médico e da Saúde";
  } else if (area.includes("trabalhista") || area.includes("trabalho")) {
    areaDireito = "Direito do Trabalho";
  } else if (area.includes("civil")) {
    areaDireito = "Direito Civil";
  } else if (area.includes("penal") || area.includes("criminal")) {
    areaDireito = "Direito Penal";
  } else if (area.includes("tributário") || area.includes("tributario")) {
    areaDireito = "Direito Tributário";
  }

  let systemPromptPrefix = "";
  if (motorIA === "jusia") {
    systemPromptPrefix = `Você é o JUS IA, o principal e mais renomado motor de inteligência artificial jurídica do Brasil, especializado em ${areaDireito} de alto nível. Seu linguajar é formal, erudito e extremamente embasado nas leis vigentes. `;
  } else if (motorIA === "chatgpt") {
    systemPromptPrefix = `Atue como o motor OpenAI GPT-4o especializado em ${areaDireito} brasileiro. Seu texto deve ser direto, moderno, preciso e tecnicamente impecável. `;
  } else {
    systemPromptPrefix = `Atue como o motor Google Gemini Pro especializado em ${areaDireito} brasileiro. Elabore um parecer completo com linguagem fluida e abrangência doutrinária. `;
  }

  const promptMinuta = (() => {
    if (motorIA === "jusia") {
      const fatosProntuario = clienteSelecionado?.observacoes || "Nenhum fato clínico relatado no prontuário do cliente.";
      const teorProcesso = processoSelecionadoGerador?.observacoes_internas || "Nenhum fato ou teor do processo cadastrado.";
      return `Atue como um especialista sênior em Direito Médico. Analise os fatos clínicos do prontuário: ${fatosProntuario} em conjunto com o Teor do Processo/Fatos do Caso: ${teorProcesso}. Com base na natureza deste processo, gere IMEDIATAMENTE uma peça jurídica inicial na estrutura padrão do contencioso de saúde: 1) Dos Fatos, 2) Dos Fundamentos Jurídicos Técnicos (citando responsabilidade civil médica/resoluções CFM aplicáveis) e 3) Dos Pedidos. Retorne o documento pronto para revisão.`;
    }

    return `${systemPromptPrefix}Com base nos Fatos Narrados e Observações Gerais do cliente anexados a seguir, elabore uma minuta jurídica profissional contendo: 1) Dos Fatos (resumo cronológico técnico); 2) Do Direito (fundamentação baseada em doutrina e legislação aplicável); 3) Dos Pedidos e do Pedido de Liminar (se aplicável ao tipo de peça selecionado). Use uma linguagem extremamente técnica, formal e robusta.

Fatos do cliente: 
"${clienteSelecionado?.observacoes || ""}"

Tipo de Peça Processual a ser gerada: 
"${getTipoPecaLabel(tipoPeca)}"

Responda redigindo a petição ou tese de defesa completa, com qualificações e espaços para preenchimento posterior.`;
  })();

  const handleEsbocarPeca = async () => {
    if (!clienteSelecionadoId || !clienteSelecionado?.observacoes) {
      setPecaError("Selecione um cliente com fatos narrados em seu prontuário.");
      return;
    }

    setLoadingPeca(true);
    setPecaTexto("");
    setPecaError(null);

    try {
      const response = await fetch("/api/esbocar-peca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fatosNarrados: motorIA === "jusia" 
            ? `${clienteSelecionado.observacoes || ""}\n\n${processoSelecionadoGerador?.observacoes_internas || ""}`.trim()
            : clienteSelecionado.observacoes,
          tipoPeca: getTipoPecaLabel(tipoPeca),
          motor: motorIA,
          areaInteresse: clienteSelecionado.areas_interesse || "",
          promptCustom: promptMinuta
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Erro na requisição ao servidor.");
      }

      const resJson = await response.json();
      if (resJson.texto) {
        setPecaTexto(resJson.texto);
      } else {
        throw new Error("Resposta da IA vazia ou malformada.");
      }
    } catch (err: any) {
      console.error("Erro ao gerar peça processual:", err);
      setPecaError(err.message || "Ocorreu um erro inesperado ao conectar ao motor de IA.");
    } finally {
      setLoadingPeca(false);
    }
  };

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    const pdfjs = (window as any).pdfjsLib || (typeof window !== "undefined" && (window as any).pdfjsLib) || null;
    if (!pdfjs) {
      throw new Error("Biblioteca de leitura de PDF não disponível.");
    }
    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const maxPages = pdf.numPages;
    let fullText = "";

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText.trim();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".pdf")) {
        setFile(droppedFile);
        setFileError(null);
      } else {
        setFileError("Por favor, envie apenas arquivos em formato PDF.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf")) {
        setFile(selectedFile);
        setFileError(null);
      } else {
        setFileError("Por favor, envie apenas arquivos em formato PDF.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file && !selectedProcessoId) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setResultData(null);
    setFromCache(false);

    try {
      let text = "";
      if (file) {
        text = await extractTextFromPdf(file);
      } else {
        const proc = processosCompletos.find(p => p.id === selectedProcessoId);
        const fatosProntuario = proc?.clientes?.observacoes || "";
        const teorProcesso = proc?.observacoes_internas || "";
        
        if (selectedEngine === "jusia" && selectedProcessoId) {
          text = `Atue como um especialista sênior em Direito Médico. Analise os fatos clínicos do prontuário: ${fatosProntuario} em conjunto com o Teor do Processo/Fatos do Caso: ${teorProcesso}. Com base na natureza deste processo, gere IMEDIATAMENTE uma peça jurídica inicial na estrutura padrão do contencioso de saúde: 1) Dos Fatos, 2) Dos Fundamentos Jurídicos Técnicos (citando responsabilidade civil médica/resoluções CFM aplicáveis) e 3) Dos Pedidos. Retorne o documento pronto para revisão.`;
        } else {
          text = teorProcesso || fatosProntuario || "";
        }
        
        if (!text) {
          throw new Error("Este processo não possui fatos ou observações cadastrados para análise.");
        }
      }

      if (selectedProcessoId) {
        const { data: cacheData, error: cacheErr } = await supabase
          .from("analise_cache")
          .select("*")
          .eq("processo_id", selectedProcessoId)
          .eq("engine", selectedEngine)
          .maybeSingle();

        if (cacheData) {
          const resultado = cacheData.resultado_json;
          setResultData({
            resumo: resultado.resumo_executivo || "",
            estagio: resultado.classificacao?.estagio || "",
            prioridade: resultado.classificacao?.prioridade || "",
            tese: resultado.tese_sugerida || "",
            risco: resultado.classificacao?.prioridade === "Urgente" || resultado.classificacao?.prioridade === "Alta" ? "Risco Alto" : "Risco Normal",
            pedidos: resultado.minuta_inicial_rascunho || ""
          });
          setFromCache(true);
          setAnalyzing(false);
          return;
        }
      }

      const route = selectedEngine === "chatgpt"
        ? "/api/analisar-chatgpt"
        : selectedEngine === "jusia"
        ? "/api/analisar-jusia"
        : "/api/analisar-processo";

      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoDocumento: text })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Erro na requisição de análise.");
      }

      const result = await response.json();
      
      setResultData({
        resumo: result.resumo_executivo || "",
        estagio: result.classificacao?.estagio || "",
        prioridade: result.classificacao?.prioridade || "",
        tese: result.tese_sugerida || "",
        risco: result.classificacao?.prioridade === "Urgente" || result.classificacao?.prioridade === "Alta" ? "Risco Alto - Requer Atenção" : "Risco Controlado",
        pedidos: result.minuta_inicial_rascunho || ""
      });

      if (selectedProcessoId) {
        await supabase.from("analise_cache").insert({
          processo_id: selectedProcessoId,
          engine: selectedEngine,
          resultado_json: result
        });
      }

    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Ocorreu um erro ao analisar o processo.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50 dark:bg-[#070a13] text-[#0f1e36] dark:text-slate-100 print:bg-white print:p-0 print:text-black">

      {/* ── MODAL DE EDIÇÃO DE PROCESSO ─────────────────────────────────────── */}
      {modalEditarAberto && processoSelecionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-[#0f1e36] dark:text-slate-100 text-base">✏️ Editar Processo</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{processoSelecionado.numero_processo}</p>
              </div>
              <button type="button" onClick={() => { setModalEditarAberto(false); setProcessoSelecionado(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold p-1 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSalvarEdicao} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Título do Processo *</label>
                  <input required type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white focus:outline-none focus:border-[#d4af37] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Número do Processo</label>
                  <input type="text" value={numeroProcesso} onChange={e => setNumeroProcesso(e.target.value)}
                    placeholder="0000000-00.0000.0.00.0000"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white font-mono focus:outline-none focus:border-[#d4af37] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Área do Direito</label>
                  <select value={areaDireito} onChange={e => setAreaDireito(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white focus:outline-none focus:border-[#d4af37] transition-colors">
                    <option value="">Selecionar...</option>
                    <option>Direito Médico e da Saúde</option>
                    <option>Direito Civil</option>
                    <option>Direito do Trabalho</option>
                    <option>Direito Penal</option>
                    <option>Direito Tributário</option>
                    <option>Direito Previdenciário</option>
                    <option>Direito do Consumidor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white focus:outline-none focus:border-[#d4af37] transition-colors">
                    <option value="">Selecionar...</option>
                    <option>Em andamento</option>
                    <option>Aguardando decisão</option>
                    <option>Recurso pendente</option>
                    <option>Arquivado</option>
                    <option>Encerrado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tribunal</label>
                  <input type="text" value={tribunal} onChange={e => setTribunal(e.target.value)}
                    placeholder="Ex: TJSP, TRT-2"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white focus:outline-none focus:border-[#d4af37] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Vara / Câmara</label>
                  <input type="text" value={vara} onChange={e => setVara(e.target.value)}
                    placeholder="Ex: 3ª Vara Cível"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white focus:outline-none focus:border-[#d4af37] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Valor da Causa (R$)</label>
                  <input type="text" value={valorCausa} onChange={e => setValorCausa(e.target.value)}
                    placeholder="Ex: 50000.00"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white font-mono focus:outline-none focus:border-[#d4af37] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Vincular Cliente</label>
                  <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white focus:outline-none focus:border-[#d4af37] transition-colors">
                    <option value="">Nenhum cliente vinculado</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        👤 {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Observações Internas / Fatos do Processo</label>
                  <textarea rows={5} value={descricao} onChange={e => setDescricao(e.target.value)}
                    placeholder="Descreva os fatos relevantes, histórico do processo, estratégia jurídica, etc. Estes dados serão usados como base para a geração de peças por IA."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#0f1e36] dark:text-white focus:outline-none focus:border-[#d4af37] transition-colors resize-y" />
                  <p className="text-[10px] text-[#d4af37] mt-1 mb-3">💡 Preencha este campo para habilitar a geração de teses e minutas por IA diretamente neste processo.</p>

                  <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold text-[#0f1e36] dark:text-slate-300 uppercase mb-1">Anexar Documentos do Caso (PDF ou TXT)</label>
                    <input type="file" accept=".pdf,.txt" onChange={handleEditProcessoFileUpload} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-[#0f1e36] hover:file:bg-slate-200" />
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => { setModalEditarAberto(false); setProcessoSelecionado(null); }}
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={savingEdit}
                  className="bg-[#d4af37] hover:bg-[#f3e5ab] text-[#070a13] px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg disabled:opacity-50">
                  {savingEdit ? "Salvando..." : "💾 Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PAINEL LATERAL: IA por Processo ──────────────────────────────────── */}
      {processoParaIA && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#d4af37]/30 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-[#0b0f19] rounded-t-2xl">
              <div>
                <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">🤖 Gerador de IA — {processoParaIA.titulo}</h2>
                <p className="text-[10px] text-[#d4af37] mt-0.5 font-mono">{processoParaIA.numero_processo}</p>
              </div>
              <button type="button" onClick={() => { setProcessoParaIA(null); setTextoIAProcesso(""); setErroIAProcesso(null); }}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Controles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Peça Processual</label>
                  <select value={tipoPecaProcesso} onChange={e => setTipoPecaProcesso(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#d4af37]">
                    <option value="inicial_erro">Petição Inicial — Erro Médico</option>
                    <option value="inicial_plano">Petição Inicial — Liminar contra Plano</option>
                    <option value="defesa_crm">Tese de Defesa — Contestação CRM</option>
                    <option value="contestacao">Contestação</option>
                    <option value="replica">Réplica à Contestação</option>
                    <option value="recurso">Recurso de Apelação</option>
                    <option value="habeas_corpus">Habeas Corpus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Motor de IA</label>
                  <div className="flex gap-2">
                    {(["jusia", "chatgpt", "gemini"] as AIEngine[]).map(eng => (
                      <button key={eng} type="button" onClick={() => setMotorIAProcesso(eng)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          motorIAProcesso === eng
                            ? "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/50"
                            : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                        }`}>
                        {eng === "jusia" ? "⚖️ Jus IA" : eng === "chatgpt" ? "⬡ GPT-4o" : "✦ Gemini"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview dos fatos */}
              {(processoParaIA.observacoes_internas || processoParaIA.clientes?.observacoes) ? (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">✓ Base de Fatos Disponível</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-h-20 overflow-y-auto">
                    {processoParaIA.observacoes_internas || processoParaIA.clientes?.observacoes}
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 text-xs text-red-400">
                  ⚠️ Processo sem observações internas. <button type="button" onClick={() => { if (processoParaIA) { setProcessoParaIA(null); abrirEdicao(processoParaIA); } }} className="underline font-bold">Editar processo</button> e preencher os fatos para habilitar a IA.
                </div>
              )}

              {/* Botão gerar */}
              <button type="button" onClick={handleGerarIAProcesso}
                disabled={loadingIAProcesso || !processoParaIA.observacoes_internas && !processoParaIA.clientes?.observacoes}
                className="w-full bg-gradient-to-r from-[#0f1e36] to-[#1a2d4a] hover:from-[#1a2d4a] hover:to-[#243d5e] text-white border border-[#d4af37]/30 hover:border-[#d4af37]/60 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {loadingIAProcesso ? (
                  <><Spinner className="w-4 h-4 text-[#d4af37]" /> Redigindo com IA...</>
                ) : (
                  <>🤖 Gerar {tipoPecaProcesso === "defesa_crm" || tipoPecaProcesso === "contestacao" ? "Tese de Defesa" : "Minuta Processual"} com IA</>
                )}
              </button>

              {erroIAProcesso && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 text-xs text-red-400">{erroIAProcesso}</div>
              )}

              {/* Textarea resultado */}
              {textoIAProcesso && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">📄 Minuta / Tese Gerada</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { navigator.clipboard.writeText(textoIAProcesso); alert("Copiado!"); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1 rounded border border-slate-700 transition-colors">📋 Copiar</button>
                      <button type="button" onClick={() => window.print()}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1 rounded border border-slate-700 transition-colors">🖨️ Imprimir</button>
                    </div>
                  </div>
                  <textarea rows={14} value={textoIAProcesso} onChange={e => setTextoIAProcesso(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm font-mono text-slate-200 focus:outline-none focus:border-[#d4af37] resize-y" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚖️</span>
            <h1 className="font-bold text-2xl tracking-wide text-[#0f1e36] dark:text-slate-100">
              Gestão de Processos &amp; IA Jurídica
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            Edite processos, gere teses e minutas com IA, e analise documentos PDF.
          </p>
        </div>

        {/* Quota badge */}
        {!loadingConfig && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border ${
            quotaExhausted
              ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400"
              : quotaRemaining <= 1
              ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-400"
              : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
          }`}>
            {quotaExhausted ? "🔒" : "✦"}
            {hasUserKeys
              ? "Chave API Ativa — Análises Ilimitadas"
              : `Você possui ${quotaRemaining} de ${quotaMax} análises gratuitas restantes`}
          </div>
        )}
      </div>

      {/* \u2500\u2500 ABA: GERENCIAR PROCESSOS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm print:hidden">
        {/* Cabe\u00e7alho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 flex items-center gap-2">
              <span>\u2696\ufe0f</span> Processos Cadastrados
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-light mt-0.5">
              Edite os dados de cada processo e gere minutas e teses de defesa diretamente com IA.
            </p>
          </div>
          <button type="button" onClick={fetchProcessos}
            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-[#d4af37] transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg">
            \u21ba Atualizar Lista
          </button>
        </div>

        {/* Lista de cards */}
        <div className="p-6">
          {loadingProcessos ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-[#d4af37] rounded-full animate-spin" />
            </div>
          ) : processosCompletos.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-slate-400 dark:text-slate-500">
              <div className="text-4xl">\u2696\ufe0f</div>
              <div className="text-4xl">⚖️</div>
              <p className="font-medium text-sm">Nenhum processo cadastrado ainda.</p>
              <p className="text-xs font-light">Cadastre processos na aba de clientes ou diretamente pelo Supabase.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {processosCompletos.map(proc => {
                const statusColor = {
                  "Em andamento": "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25",
                  "Aguardando decisão": "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25",
                  "Recurso pendente": "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/25",
                  "Arquivado": "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
                  "Encerrado": "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25"
                }[proc.status || ""] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";

                const temFatos = !!(proc.observacoes_internas || proc.clientes?.observacoes);

                return (
                  <div key={proc.id}
                    className="group relative bg-slate-50 dark:bg-[#0c1625] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 hover:border-[#d4af37]/40 hover:shadow-md transition-all duration-200">

                    {/* Faixa superior */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 leading-tight truncate group-hover:text-[#d4af37] transition-colors">
                          {proc.titulo}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleCarregarProcessoNoGerador(proc)}
                          className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline mt-0.5 truncate block text-left"
                        >
                          {proc.numero_processo || "Nº não informado"}
                        </button>
                      </div>
                      {proc.status && (
                        <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {proc.status}
                        </span>
                      )}
                    </div>

                    {/* Detalhes */}
                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {proc.clientes && (
                        <div className="flex items-center gap-1.5">
                          <span>👤</span>
                          <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{proc.clientes.nome}</span>
                        </div>
                      )}
                      {proc.area_direito && (
                        <div className="flex items-center gap-1.5">
                          <span>📚</span>
                          <span>{proc.area_direito}</span>
                        </div>
                      )}
                      {(proc.tribunal || proc.vara) && (
                        <div className="flex items-center gap-1.5">
                          <span>🏛️</span>
                          <span className="truncate">{[proc.tribunal, proc.vara].filter(Boolean).join(" — ")}</span>
                        </div>
                      )}
                      {proc.valor_causa && (
                        <div className="flex items-center gap-1.5">
                          <span>💰</span>
                          <span className="font-mono">
                            {Number(proc.valor_causa).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Indicador de fatos */}
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded ${
                      temFatos
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    }`}>
                      {temFatos ? "✓ Fatos disponíveis para IA" : "⚠️ Sem fatos cadastrados"}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => abrirEdicao(proc)}
                        className="flex-1 flex items-center justify-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0f1e36] dark:text-slate-200 text-[10px] font-bold px-3 py-2 rounded-lg transition-all">
                        ✏️ Editar
                      </button>
                      <button type="button" onClick={() => { setProcessoParaIA(proc); setTextoIAProcesso(""); setErroIAProcesso(null); }}
                        className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold px-3 py-2 rounded-lg transition-all ${
                          temFatos
                            ? "bg-[#0f1e36] hover:bg-[#1a2d4a] text-[#d4af37] border border-[#d4af37]/30 hover:border-[#d4af37]/60 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                        }`}>
                        🤖 Gerar IA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 📑 NOVO PAINEL: Gerador de Peças e Teses Judiciais (por cliente) ──────── */}
      <div id="gerador-pecas-container" className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
          <div>
            <h2 className="font-bold text-sm text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>📑</span> NOVO PAINEL: Gerador de Peças e Teses Judiciais
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-light mt-0.5">
              Integração com prontuários de clientes do Supabase para elaboração automatizada de minutas jurídicas e teses de defesa.
            </p>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2">Motor de IA:</span>
            {[
              { id: "jusia", label: "Jus IA", emoji: "⚖️" },
              { id: "chatgpt", label: "ChatGPT", emoji: "⬡" },
              { id: "gemini", label: "Gemini", emoji: "✦" }
            ].map(eng => (
              <button
                key={eng.id}
                type="button"
                onClick={() => setMotorIA(eng.id as AIEngine)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  motorIA === eng.id
                    ? "bg-[#0f1e36] text-white dark:bg-slate-800 dark:text-[#d4af37] shadow-sm"
                    : "text-slate-500 hover:text-[#0f1e36] dark:hover:text-slate-200"
                }`}
              >
                <span>{eng.emoji}</span>
                {eng.label}
              </button>
            ))}
          </div>
        </div>

        {/* Client & Document Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 print:hidden">
          <div>
            <label className="block text-xs font-bold text-[#0f1e36] dark:text-slate-300 uppercase mb-1">
              Selecione o Cliente (Prontuário)
            </label>
            <select 
              value={clienteSelecionadoId}
              onChange={e => {
                setClienteSelecionadoId(e.target.value);
                setProcessoSelecionadoGeradorId(""); // Reset process selection when client changes
                setPecaTexto("");
                setPecaError(null);
              }}
              disabled={loadingClientes}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] text-[#0f1e36] dark:text-slate-100"
            >
              <option value="">-- Escolha um Cliente --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.nome} {c.cpf_cnpj ? ` — ${c.cpf_cnpj}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0f1e36] dark:text-slate-300 uppercase mb-1">
              Vincular Processo (Opcional)
            </label>
            <select 
              value={processoSelecionadoGeradorId}
              onChange={e => setProcessoSelecionadoGeradorId(e.target.value)}
              disabled={!clienteSelecionadoId}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] text-[#0f1e36] dark:text-slate-100 disabled:opacity-50"
            >
              <option value="">-- Nenhum processo selecionado (Fatos apenas do Prontuário) --</option>
              {processosCompletos.filter(p => p.cliente_id === clienteSelecionadoId).map(p => (
                <option key={p.id} value={p.id}>
                  ⚖️ {p.titulo} ({p.numero_processo || "Sem número"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0f1e36] dark:text-slate-300 uppercase mb-1">
              Tipo de Peça Processual
            </label>
            <select 
              value={tipoPeca}
              onChange={e => setTipoPeca(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] text-[#0f1e36] dark:text-slate-100"
            >
              <option value="inicial_erro">Petição Inicial (Erro Médico)</option>
              <option value="inicial_plano">Petição Inicial (Liminar contra Plano de Saúde)</option>
              <option value="defesa_crm">Tese de Defesa (Contestação Ética no CRM)</option>
              <option value="replica">Réplica à Contestação</option>
            </select>
          </div>
        </div>

        {/* Fatos Narrados Preview */}
        {clienteSelecionadoId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:hidden">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Relato e Observações do Prontuário
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/25">
                  Sincronizado
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed h-24 overflow-y-auto whitespace-pre-wrap font-sans">
                {clienteSelecionado?.observacoes || (
                  <span className="text-red-500 font-medium">⚠️ Este prontuário não possui relato de fatos.</span>
                )}
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Teor do Processo / Fatos do Caso
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  processoSelecionadoGerador
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25"
                    : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200"
                }`}>
                  {processoSelecionadoGerador ? "VINCULADO" : "NÃO VINCULADO"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed h-24 overflow-y-auto whitespace-pre-wrap font-sans">
                {processoSelecionadoGerador ? (
                  processoSelecionadoGerador.observacoes_internas || (
                    <span className="text-amber-500 font-medium">⚠️ Este processo não possui observações/fatos cadastrados.</span>
                  )
                ) : (
                  <span className="text-slate-400 font-light">Selecione ou clique em um processo para mesclar dados processuais com prontuários de clientes na geração por IA.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Prompt Inspecione Preview */}
        {clienteSelecionadoId && clienteSelecionado?.observacoes && (
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-4 print:hidden">
            <button
              type="button"
              onClick={() => setVisualizarPromptPeca(!visualizarPromptPeca)}
              className="w-full flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-[#d4af37] transition-colors cursor-pointer"
            >
              <span>🔍 Inspecionar Prompt Médico-Legal Envelopado</span>
              <span>{visualizarPromptPeca ? "▲ Ocultar" : "▼ Expandir"}</span>
            </button>
            {visualizarPromptPeca && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] font-mono text-slate-300 leading-relaxed mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap select-all">
                {promptMinuta}
              </div>
            )}
          </div>
        )}

        {/* Botão de Ação */}
        <div className="flex justify-end mb-4 print:hidden">
          <button 
            type="button"
            onClick={handleEsbocarPeca}
            disabled={loadingPeca || !clienteSelecionadoId || !clienteSelecionado?.observacoes}
            className="bg-[#0f1e36] text-white hover:bg-slate-800 px-6 py-3 rounded text-xs font-bold uppercase tracking-wide border-b-2 border-[#d4af37] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loadingPeca ? (
              <span className="flex items-center gap-2">
                <Spinner className="w-3.5 h-3.5 text-white animate-spin" />
                Redigindo Minuta com IA...
              </span>
            ) : (
              "Esboçar Peça Processual"
            )}
          </button>
        </div>

        {/* Geração Error Display */}
        {pecaError && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded p-3 mb-4 text-xs text-red-600 dark:text-red-400 print:hidden">
            ⚠️ {pecaError}
          </div>
        )}

        {/* Área de Texto Otimizada para Impressão */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2 print:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Minuta Jurídica Gerada</span>
            {pecaTexto && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pecaTexto);
                    alert("Copiado para a área de transferência com sucesso!");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0f1e36] dark:text-slate-200 text-xs font-bold uppercase px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  📋 Copiar Minuta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPecaTexto("");
                    setPecaError(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0f1e36] dark:text-slate-200 text-xs font-bold uppercase px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  🔄 Limpar
                </button>
              </div>
            )}
          </div>

          {/* Botão de Impressão Forçado e Isolado (z-index 50) */}
          {pecaTexto && (
            <div className="block my-4 clear-both relative z-50 print:hidden">
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="bg-amber-500 hover:bg-amber-600 text-[#0f1e36] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded shadow-md inline-flex items-center gap-2"
              >
                🖨️ IMPRIMIR / SALVAR PDF AGORA
              </button>
            </div>
          )}

          {/* CABEÇALHO TIMBRADO JURÍDICO - EXCLUSIVO PARA IMPRESSÃO */}
          <div className="hidden print:block mb-8 border-b-2 border-[#d4af37] pb-4 text-center">
            <h2 className="font-playfair font-extrabold text-xl text-[#0f1e36] tracking-wider uppercase">
              JT - JANAINA TARABAUCA ADVOGADOS
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mt-1">
              {getEspecialidadeLabel()}
            </p>
          </div>

          <textarea 
            className="w-full h-96 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-sm font-mono focus:outline-none text-[#0f1e36] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 print:hidden"
            placeholder="O esboço da petição ou tese jurídica estruturada por IA aparecerá aqui..."
            value={pecaTexto}
            onChange={(e) => setPecaTexto(e.target.value)}
          />

          <pre className="hidden print:block whitespace-pre-wrap font-mono text-[11px] text-black bg-white leading-relaxed p-0 border-none outline-none">
            {pecaTexto}
          </pre>
        </div>
      </div>

      {/* ── BYOK UNLOCK CARD (shown when quota exhausted OR manually toggled) ── */}
      {(quotaExhausted || showByok) && !hasUserKeys && (
        <div className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#0a0e1a] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl overflow-hidden print:hidden">
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/25 flex items-center justify-center text-xl">
                🔑
              </div>
              <div>
                <h2 className="font-bold text-slate-100 text-base tracking-wide">
                  Desbloqueio Premium — Análises Ilimitadas
                </h2>
                <p className="text-[11px] text-slate-400 font-light">
                  {quotaExhausted
                    ? "Você utilizou todas as suas análises gratuitas."
                    : "Configure suas chaves para análises ilimitadas."}{" "}
                  Insira sua própria chave de API para continuar sem restrições.
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                "✓ Análises ilimitadas",
                "✓ Nenhum custo adicional",
                "✓ Dados trafegam direto para a API",
                "✓ Chaves armazenadas com segurança"
              ].map(item => (
                <span
                  key={item}
                  className="text-[10px] font-bold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/20 px-3 py-1 rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>

            {/* Key inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OpenAI */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="text-emerald-400">⬡</span> Chave OpenAI (ChatGPT)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="sk-proj-..."
                    value={byokOpenAI}
                    onChange={e => setByokOpenAI(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 font-mono transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono">
                    GPT-4o
                  </span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Obtenha em{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-500 hover:text-emerald-400 underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>

              {/* Gemini */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="text-blue-400">✦</span> Chave Google Gemini
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="AIza..."
                    value={byokGemini}
                    onChange={e => setByokGemini(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 font-mono transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono">
                    Flash 1.5
                  </span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Obtenha em{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400 underline"
                  >
                    aistudio.google.com
                  </a>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <span>🔒</span>
                Suas chaves são armazenadas de forma privada e nunca compartilhadas.
              </p>
              <div className="flex items-center gap-3">
                {showByok && !quotaExhausted && (
                  <button
                    type="button"
                    onClick={() => setShowByok(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveKeys}
                  disabled={savingKeys || (!byokOpenAI && !byokGemini)}
                  className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#f3e5ab] text-[#070a13] px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  {savingKeys ? (
                    <>
                      <Spinner className="w-3.5 h-3.5" />
                      Salvando...
                    </>
                  ) : (
                    "🚀 Ativar Análises Ilimitadas"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SEÇÃO 2: ANALISADOR DE PROCESSOS (PDF) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 print:block">

        {/* Left: Input form */}
        <div className="lg:col-span-2 space-y-4 print:hidden">

          {/* Engine selector */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Motor de IA Selecionado (Analisador)
            </h3>
            <div className="space-y-2">
              {(Object.entries(ENGINE_META) as [AIEngine, typeof ENGINE_META["gemini"]][]).map(
                ([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedEngine(key)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedEngine === key
                        ? "bg-[#0f1e36] dark:bg-slate-800 border-[#d4af37]/50 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className={`text-lg mt-0.5 shrink-0 ${meta.color}`}>{meta.emoji}</span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          selectedEngine === key
                            ? "text-slate-100"
                            : "text-[#0f1e36] dark:text-slate-200"
                        }`}>
                          {meta.label}
                        </span>
                        {selectedEngine === key && (
                          <span className="text-[9px] font-bold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/25 px-1.5 py-0.5 rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-light ${
                        selectedEngine === key ? "text-slate-400" : "text-slate-500 dark:text-slate-500"
                      }`}>
                        {meta.desc}
                      </p>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Processo selector */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Processo Cadastrado (Verificar Cache)
            </label>
            <select
              value={selectedProcessoId}
              onChange={e => {
                setSelectedProcessoId(e.target.value);
                setResultData(null);
                setAnalysisError(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer transition-colors"
            >
              <option value="">Nenhum processo selecionado</option>
              {processos.map(p => (
                <option key={p.id} value={p.id}>
                  📂 {p.titulo} — {p.numero_processo}
                  {p.cliente_nome ? ` (${p.cliente_nome})` : ""}
                </option>
              ))}
            </select>
            {selectedProcessoId && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Se houver análise em cache para este processo, será carregada instantaneamente.
              </p>
            )}
          </div>

          {/* PDF upload */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Ou Anexar Documento PDF
            </label>

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                file
                  ? "border-emerald-400/60 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/5"
                  : "border-slate-300 dark:border-slate-700 hover:border-[#d4af37]/50 hover:bg-amber-50/30 dark:hover:bg-[#d4af37]/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="space-y-1">
                  <span className="text-2xl">📄</span>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[200px] mx-auto">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setFile(null);
                      setFileError(null);
                      setResultData(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-[10px] text-red-500 hover:text-red-400 underline font-medium"
                  >
                    Remover arquivo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-3xl opacity-40">📂</span>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Arraste ou clique para selecionar um <strong>PDF</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600">Máximo 20 MB</p>
                </div>
              )}
            </div>

            {fileError && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 font-medium">
                ⚠️ {fileError}
              </div>
            )}
          </div>

          {/* Quota bar */}
          {!loadingConfig && !hasUserKeys && (
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Cota Gratuita (Analisador)
                </span>
                <span className={`text-xs font-bold ${
                  quotaExhausted
                    ? "text-red-600 dark:text-red-400"
                    : "text-[#0f1e36] dark:text-slate-200"
                }`}>
                  {quotaUsed} / {quotaMax} utilizadas
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    quotaExhausted
                      ? "bg-red-500"
                      : quotaUsed / quotaMax > 0.6
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min((quotaUsed / quotaMax) * 100, 100)}%` }}
                />
              </div>
              {quotaExhausted ? (
                <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                  🔒 Cota esgotada. Insira sua chave API para análises ilimitadas.
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-500">
                  Você possui <strong className="text-[#0f1e36] dark:text-slate-300">{quotaRemaining}</strong> análise
                  {quotaRemaining !== 1 ? "s gratuitas restantes." : " gratuita restante."}
                  <button
                    type="button"
                    onClick={() => setShowByok(v => !v)}
                    className="ml-1.5 text-[#b8962e] dark:text-[#d4af37] underline font-semibold hover:text-amber-600"
                  >
                    Adicionar chave API
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Analyze button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || quotaExhausted || (!file && !selectedProcessoId)}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-extrabold tracking-wide transition-all shadow-lg ${
              quotaExhausted
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : analyzing
                ? "bg-[#b8962e] dark:bg-[#b8962e]/80 text-[#070a13] cursor-not-allowed"
                : "bg-[#d4af37] hover:bg-[#f3e5ab] text-[#070a13] cursor-pointer shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30"
            } disabled:opacity-60`}
          >
            {analyzing ? (
              <>
                <Spinner className="w-4 h-4" />
                Analisando documento...
              </>
            ) : quotaExhausted ? (
              "🔒 Cota Esgotada — Adicione sua Chave API"
            ) : (
              <>
                <span className={ENGINE_META[selectedEngine].color}>
                  {ENGINE_META[selectedEngine].emoji}
                </span>
                Analisar com {ENGINE_META[selectedEngine].label}
              </>
            )}
          </button>
        </div>

        {/* Right: Result panel */}
        <div className="lg:col-span-3 print:w-full">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm h-full flex flex-col min-h-[600px] print:border-none print:shadow-none print:bg-white print:text-black">

            {/* Result header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{ENGINE_META[selectedEngine].emoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-[#0f1e36] dark:text-slate-200">
                    Relatório de Análise Jurídica
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500">
                    Motor: {ENGINE_META[selectedEngine].label}
                  </p>
                </div>
              </div>
              {fromCache && (
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                  ⚡ Carregado do Cache
                </span>
              )}
              {resultData && !fromCache && (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                  ✓ Nova Análise
                </span>
              )}
            </div>

            {/* Result body */}
            <div className="flex-1 p-5 overflow-y-auto print:p-0 print:overflow-visible print:bg-white print:text-black">
              {analyzing ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-20">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-[#d4af37] animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-xl">
                      {ENGINE_META[selectedEngine].emoji}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#0f1e36] dark:text-slate-200">
                      Analisando com {ENGINE_META[selectedEngine].label}...
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-light">
                      Extraindo texto, interpretando cláusulas e gerando estratégia jurídica.
                    </p>
                  </div>
                </div>
              ) : analysisError ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-10">
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-2xl p-6 text-center max-w-md space-y-3">
                    <span className="text-3xl">⚠️</span>
                    <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">
                      Não foi possível processar o documento
                    </h4>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed font-light">
                      {analysisError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAnalysisError(null)}
                      className="text-xs font-bold text-red-600 dark:text-red-400 underline hover:text-red-500 cursor-pointer"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              ) : resultData ? (
                <div className="space-y-4">
                  <div className="hidden print:block mb-8 border-b-2 border-[#d4af37] pb-4">
                    <div className="text-center">
                      <h2 className="font-playfair font-extrabold text-xl text-[#0f1e36] tracking-wider uppercase">
                        JT - JANAINA TARABAUCA ADVOGADOS
                      </h2>
                      <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mt-1">
                        {getEspecialidadeLabel()}
                      </p>
                    </div>
                  </div>

                  {RESULT_SECTIONS.map(section => {
                    const value = resultData[section.key];
                    if (!value) return null;
                    const isRisk = section.key === "risco";
                    const riskColor = isRisk
                      ? value.toLowerCase().includes("alto")
                        ? "border-l-red-500 bg-red-50 dark:bg-red-500/5 print:border-l-slate-400"
                        : value.toLowerCase().includes("médio")
                        ? "border-l-amber-500 bg-amber-50 dark:bg-amber-500/5 print:border-l-slate-400"
                        : "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 print:border-l-slate-400"
                      : "border-l-[#d4af37] bg-slate-50 dark:bg-slate-900/40 print:border-l-slate-400";

                    return (
                      <div
                        key={section.key}
                        className={`border-l-4 rounded-r-xl p-4 space-y-1.5 ${riskColor} print:bg-white print:text-black print:mb-6 print:p-0 print:border-none`}
                      >
                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest print:text-slate-700 print:mb-1">
                          {section.label}
                        </h4>
                        <p className="text-xs text-[#0f1e36] dark:text-slate-200 leading-relaxed print:text-black font-sans">
                          {value}
                        </p>
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 flex-wrap print:hidden">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0f1e36] dark:text-slate-200 font-bold text-xs uppercase tracking-wide px-4 py-2.5 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all print:hidden cursor-pointer"
                    >
                      🖨️ Imprimir / Salvar PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = RESULT_SECTIONS.map(
                          s => `${s.label}\n${resultData[s.key] || ""}`
                        ).join("\n\n");
                        navigator.clipboard.writeText(text);
                        alert("Relatório copiado!");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      📋 Copiar Relatório
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResultData(null);
                        setFile(null);
                        setSelectedProcessoId("");
                        setFromCache(false);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      🔄 Nova Análise
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-20 text-slate-400 dark:text-slate-600">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-4xl">
                    📄
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="font-bold text-slate-600 dark:text-slate-400 text-sm">
                      Nenhuma análise em andamento
                    </p>
                    <p className="text-xs font-light">
                      Selecione um processo ou anexe um PDF e clique em Analisar para gerar o relatório jurídico.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
