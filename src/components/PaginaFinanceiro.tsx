import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { ModalLancamentoFinanceiro } from "./ModalLancamentoFinanceiro";
import AnexarComprovante from "./AnexarComprovante";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ClienteInfo {
  id: string;
  nome: string;
  whatsapp?: string;
  email?: string;
  cpf_cnpj?: string;
  endereco_completo?: string;
}

interface ProcessoInfo {
  id: string;
  numero_processo: string;
  titulo: string;
  status: string;
}

interface LancamentoGeral {
  id: string;
  cliente_id: string;
  processo_id?: string | null;
  valor_total: number;
  tipo_honorario: string;
  status_pagamento: string;
  data_vencimento: string;
  created_at: string;
  url_comprovante?: string | null;
  clientes?: ClienteInfo | null;
  processos?: ProcessoInfo | null;
}

interface PaginaFinanceiroProps {
  onNavigateToCliente?: (clienteId: string, activeTab: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatarBrl = (num: number): string =>
  num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Spinner: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
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

// ── Component ──────────────────────────────────────────────────────────────────
export const PaginaFinanceiro: React.FC<PaginaFinanceiroProps> = ({ onNavigateToCliente }) => {
  const [lancamentos, setLancamentos] = useState<LancamentoGeral[]>([]);
  const [clientes, setClientes] = useState<ClienteInfo[]>([]);
  const [processosMap, setProcessosMap] = useState<Record<string, ProcessoInfo[]>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Paginação
  const [offset, setOffset] = useState<number>(0);
  const limit = 50;
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Ação por linha
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [monthFilter, setMonthFilter] = useState<string>("todos");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preselectedClienteId, setPreselectedClienteId] = useState<string | undefined>(undefined);

  // Gráfico
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // ── Estados Módulo Fiscal (NFS-e) ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"movimentacoes" | "nfse">("movimentacoes");
  const [nfseClienteId, setNfseClienteId] = useState<string>("");
  const [nfseDescricao, setNfseDescricao] = useState<string>("Assessoria Jurídica Mensal Preventiva - Contrato Ref. Maio/2026");
  const [nfseValor, setNfseValor] = useState<string>("");
  const [nfseAliquota, setNfseAliquota] = useState<number>(5);
  const [emitindoNfse, setEmitindoNfse] = useState<boolean>(false);
  const [nfseGerada, setNfseGerada] = useState<{
    numeroNota: string;
    codigoAutenticacao: string;
    dataEmissao: string;
    clienteNome: string;
    clienteCpfCnpj: string;
    clienteEndereco: string;
    descricao: string;
    valorServicos: number;
    aliquota: number;
    valorIss: number;
  } | null>(null);

  const selectedClienteNfse = useMemo(() => {
    return clientes.find((c) => c.id === nfseClienteId);
  }, [clientes, nfseClienteId]);

  const handleNfseValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorRaw = e.target.value;
    const apenasNumeros = valorRaw.replace(/\D/g, "");
    if (!apenasNumeros) {
      setNfseValor("");
      return;
    }
    const valorFloat = parseFloat(apenasNumeros) / 100;
    setNfseValor(
      valorFloat.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })
    );
  };

  const obterNfseValorFloat = (valStr: string): number => {
    const apenasNumeros = valStr.replace(/\D/g, "");
    return parseFloat(apenasNumeros) / 100 || 0;
  };

  const handleEmitirNfse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nfseClienteId) {
      alert("Por favor, selecione um prontuário de cliente.");
      return;
    }
    const valFloat = obterNfseValorFloat(nfseValor);
    if (valFloat <= 0) {
      alert("O valor da Nota Fiscal deve ser maior que R$ 0,00.");
      return;
    }

    setEmitindoNfse(true);
    setNfseGerada(null);

    // Simulação premium de emissão municipal (2 segundos)
    setTimeout(() => {
      const selectedCli = clientes.find((c) => c.id === nfseClienteId);
      const numeroAleatorio = Math.floor(100000 + Math.random() * 900000);
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      
      const hashAuth = Math.random().toString(16).substring(2, 10).toUpperCase();

      setNfseGerada({
        numeroNota: `2026000000${numeroAleatorio}`,
        codigoAutenticacao: hashAuth,
        dataEmissao: dataFormatada,
        clienteNome: selectedCli?.nome || "Cliente Geral",
        clienteCpfCnpj: selectedCli?.cpf_cnpj || "Não cadastrado",
        clienteEndereco: selectedCli?.endereco_completo || "Cadastrado no prontuário",
        descricao: nfseDescricao,
        valorServicos: valFloat,
        aliquota: nfseAliquota,
        valorIss: (valFloat * nfseAliquota) / 100
      });

      setEmitindoNfse(false);
    }, 2000);
  };

  // ── Mock chart data ──────────────────────────────────────────────────────────
  const chartMockData = useMemo(
    () => [
      { mes: "Jan", entradas: 12000, repasses: 4000 },
      { mes: "Fev", entradas: 15000, repasses: 5000 },
      { mes: "Mar", entradas: 32000, repasses: 65000 },
      { mes: "Abr", entradas: 18000, repasses: 6000 },
      { mes: "Mai", entradas: 22000, repasses: 8000 },
      { mes: "Jun", entradas: 48000, repasses: 98000 },
      { mes: "Jul", entradas: 20000, repasses: 5000 },
      { mes: "Ago", entradas: 26000, repasses: 7000 },
      { mes: "Set", entradas: 31000, repasses: 12000 },
      { mes: "Out", entradas: 27000, repasses: 9000 },
      { mes: "Nov", entradas: 30000, repasses: 8000 },
      { mes: "Dez", entradas: 58000, repasses: 35000 }
    ],
    []
  );

  // ── Fetchers ─────────────────────────────────────────────────────────────────
  const fetchMetadata = async () => {
    try {
      const { data: clientsData, error: clientErr } = await supabase
        .from("clientes")
        .select("id, nome, whatsapp, email, cpf_cnpj, endereco_completo")
        .order("nome", { ascending: true });
      if (clientErr) throw clientErr;
      setClientes(clientsData || []);

      const { data: procData, error: procErr } = await supabase
        .from("processos")
        .select("id, cliente_id, numero_processo, titulo, status");
      if (procErr) throw procErr;

      const pMap: Record<string, ProcessoInfo[]> = {};
      (procData || []).forEach((p: any) => {
        if (!pMap[p.cliente_id]) pMap[p.cliente_id] = [];
        pMap[p.cliente_id].push({
          id: p.id,
          numero_processo: p.numero_processo,
          titulo: p.titulo,
          status: p.status
        });
      });
      setProcessosMap(pMap);
    } catch (err: any) {
      console.error("Erro ao carregar metadados:", err.message);
    }
  };

  const loadFinanceiro = async (currentOffset: number, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const { data: finData, error: finErr } = await supabase
        .from("financeiro")
        .select(`
          id,
          cliente_id,
          processo_id,
          valor_total,
          tipo_honorario,
          status_pagamento,
          data_vencimento,
          created_at,
          url_comprovante,
          clientes ( id, nome, whatsapp, email ),
          processos ( id, numero_processo, titulo, status )
        `)
        .order("data_vencimento", { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      if (finErr) throw finErr;

      const mapped: LancamentoGeral[] = (finData || []).map((item: any) => {
        const clientesObj = Array.isArray(item.clientes) ? item.clientes[0] : item.clientes;
        const processosObj = Array.isArray(item.processos) ? item.processos[0] : item.processos;
        return {
          ...item,
          clientes: clientesObj || null,
          processos: processosObj || null
        };
      });

      if (append) {
        setLancamentos(prev => [...prev, ...mapped]);
      } else {
        setLancamentos(mapped);
      }

      setHasMore(mapped.length >= limit);
    } catch (err: any) {
      console.error("Erro ao sincronizar ecossistema financeiro:", err.message);
      setError("Falha ao sincronizar dados com o banco de dados.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const refreshData = () => {
    setOffset(0);
    loadFinanceiro(0, false);
  };

  const handleLoadMore = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    loadFinanceiro(nextOffset, true);
  };

  useEffect(() => {
    fetchMetadata();
    loadFinanceiro(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Metrics ──────────────────────────────────────────────────────────────────
  const metricas = useMemo(() => {
    const hojeStr = new Date().toISOString().split("T")[0];
    let totalRecebido = 0;
    let totalProjecao = 0;
    let totalInadimplencia = 0;

    lancamentos.forEach(item => {
      const valor = parseFloat(item.valor_total as any) || 0;
      const status = item.status_pagamento.toLowerCase();
      if (status === "pago") {
        totalRecebido += valor;
      } else if (item.data_vencimento < hojeStr) {
        totalInadimplencia += valor;
      } else {
        totalProjecao += valor;
      }
    });

    return { totalRecebido, totalProjecao, totalInadimplencia };
  }, [lancamentos]);

  // ── Alerts ───────────────────────────────────────────────────────────────────
  const alertas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const listaVencidos: LancamentoGeral[] = [];
    const listaVazamentos: { processo: ProcessoInfo; cliente: ClienteInfo }[] = [];

    lancamentos.forEach(item => {
      if (item.status_pagamento.toLowerCase() !== "pago") {
        const dataVenc = new Date(item.data_vencimento);
        const diffDias = Math.ceil((hoje.getTime() - dataVenc.getTime()) / 86400000);
        if (diffDias > 5) listaVencidos.push(item);
      }
    });

    Object.keys(processosMap).forEach(clienteId => {
      const procs = processosMap[clienteId] || [];
      const client = clientes.find(c => c.id === clienteId);
      procs.forEach(proc => {
        const sl = proc.status.toLowerCase();
        if (sl === "arquivado" || sl === "em acordo" || sl === "concluído" || sl === "sentenciado") {
          const temExito = lancamentos.some(
            l => l.processo_id === proc.id && l.tipo_honorario.toLowerCase() === "êxito"
          );
          if (!temExito && client) {
            listaVazamentos.push({ processo: proc, cliente: client });
          }
        }
      });
    });

    return { vencidos: listaVencidos, vazamentos: listaVazamentos };
  }, [lancamentos, processosMap, clientes]);

  // ── Filtered table rows ───────────────────────────────────────────────────────
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter(item => {
      const sl = searchQuery.toLowerCase();
      const matchSearch =
        (item.clientes?.nome || "").toLowerCase().includes(sl) ||
        (item.processos?.titulo || "").toLowerCase().includes(sl) ||
        (item.processos?.numero_processo || "").toLowerCase().includes(sl);

      const matchStatus =
        statusFilter === "todos" ||
        item.status_pagamento.toLowerCase() === statusFilter.toLowerCase();

      let matchMonth = true;
      if (monthFilter !== "todos") {
        const d = new Date(item.data_vencimento);
        matchMonth = (d.getUTCMonth() + 1).toString() === monthFilter;
      }

      return matchSearch && matchStatus && matchMonth;
    });
  }, [lancamentos, searchQuery, statusFilter, monthFilter]);

  // ── Chart ─────────────────────────────────────────────────────────────────────
  const dynamicChartData = useMemo(() => {
    const base = [...chartMockData];
    lancamentos.forEach(item => {
      if (item.status_pagamento.toLowerCase() === "pago") {
        const date = new Date(item.data_vencimento);
        if (date.getUTCFullYear() === 2026) {
          const idx = date.getUTCMonth();
          if (idx >= 0 && idx < 12) {
            base[idx] = { ...base[idx], entradas: base[idx].entradas + item.valor_total };
          }
        }
      }
    });
    return base;
  }, [lancamentos, chartMockData]);

  const maxGraficoVal = useMemo(() => {
    let max = 10000;
    dynamicChartData.forEach(d => {
      if (d.entradas > max) max = d.entradas;
      if (d.repasses > max) max = d.repasses;
    });
    return max * 1.15;
  }, [dynamicChartData]);

  const svgPointsEntradas = useMemo(() => {
    const paddingLeft = 55;
    const chartWidth = 800 - paddingLeft - 25;
    const chartHeight = 170;
    const paddingTop = 20;
    return dynamicChartData.map((d, i) => ({
      x: paddingLeft + i * (chartWidth / 11),
      y: paddingTop + chartHeight - (d.entradas / maxGraficoVal) * chartHeight,
      val: d.entradas,
      label: d.mes
    }));
  }, [dynamicChartData, maxGraficoVal]);

  const pathLineEntradas = useMemo(
    () => svgPointsEntradas.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" "),
    [svgPointsEntradas]
  );

  const pathAreaEntradas = useMemo(() => {
    if (!svgPointsEntradas.length) return "";
    const first = svgPointsEntradas[0];
    const last = svgPointsEntradas[svgPointsEntradas.length - 1];
    return `${pathLineEntradas} L ${last.x} 190 L ${first.x} 190 Z`;
  }, [svgPointsEntradas, pathLineEntradas]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleQuickLaunchFromAlert = (clienteId: string) => {
    setPreselectedClienteId(clienteId);
    setIsModalOpen(true);
  };

  const handleLiquidado = async (id: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      const { error: updateErr } = await supabase
        .from("financeiro")
        .update({ status_pagamento: "pago" })
        .eq("id", id);
      if (updateErr) throw updateErr;
      setLancamentos(prev =>
        prev.map(item => (item.id === id ? { ...item, status_pagamento: "pago" } : item))
      );
    } catch (err: any) {
      alert("Erro ao liquidar lançamento: " + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este lançamento permanentemente?")) return;
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      const { error: deleteErr } = await supabase
        .from("financeiro")
        .delete()
        .eq("id", id);
      if (deleteErr) throw deleteErr;
      setLancamentos(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Erro ao deletar transação: " + err.message);
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const renderStatusBadge = (status: string, vencimento: string) => {
    const s = status.toLowerCase();
    const hojeStr = new Date().toISOString().split("T")[0];
    if (s === "pago") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          ● Pago
        </span>
      );
    } else if (vencimento < hojeStr) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse">
          ● Inadimplente
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          ● Pendente
        </span>
      );
    }
  };

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50 dark:bg-[#070a13] text-[#0f1e36] dark:text-slate-100 print:bg-white print:p-0 print:text-black relative overflow-hidden">

      {/* ── Pano de Fundo Suavizado — Gradiente Radial Difuso ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.04)_0%,rgba(15,30,54,0.0)_60%)] pointer-events-none print:hidden" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(15,30,54,0.15)_0%,rgba(7,10,19,0)_65%)] pointer-events-none print:hidden" />

      {/* 1. CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💼</span>
            <h1 className="font-bold text-2xl tracking-wide text-[#0f1e36] dark:text-slate-100">
              Gestão Financeira & Módulo Fiscal
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            Painel consolidado de lançamentos contábeis, faturamento de honorários e emissão de Notas Fiscais Eletrônicas.
          </p>
        </div>

        <button
          onClick={() => {
            setPreselectedClienteId(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#c5a85c]/5 hover:bg-[#c5a85c]/10 dark:bg-[#d4af37]/5 dark:hover:bg-[#d4af37]/15 text-[#a38545] dark:text-[#d4af37] border border-[#c5a85c] dark:border-[#d4af37] px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-lg cursor-pointer focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          + Lançar Transação
        </button>
      </div>

      {/* TABS DE SELEÇÃO */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("movimentacoes")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus:outline-none ${
            activeTab === "movimentacoes"
              ? "border-[#d4af37] text-[#d4af37]"
              : "border-transparent text-slate-500 hover:text-[#0f1e36] dark:hover:text-slate-200"
          }`}
        >
          📊 Extrato e Livro Contábil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("nfse")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus:outline-none ${
            activeTab === "nfse"
              ? "border-[#d4af37] text-[#d4af37]"
              : "border-transparent text-slate-500 hover:text-[#0f1e36] dark:hover:text-slate-200"
          }`}
        >
          🧾 Emissão de NFS-e (Módulo Fiscal)
        </button>
      </div>

      {activeTab === "movimentacoes" ? (
        <>
          {/* 2. MÉTRICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">

            {/* Receita Realizada */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Receita Realizada
                </span>
                <h2 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatarBrl(metricas.totalRecebido)}
                </h2>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-light mt-3.5">
                🟢 Caixa consolidado recebido de honorários e custas processuais.
              </p>
            </div>

            {/* Previsão de Entrada */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#d4af37]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#d4af37]/5 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Previsão de Entrada
                </span>
                <h2 className="text-2xl font-extrabold font-mono text-[#b8962e] dark:text-[#d4af37]">
                  {formatarBrl(metricas.totalProjecao)}
                </h2>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-light mt-3.5">
                🔮 Faturas a vencer agendadas e sob conformidade contratual.
              </p>
            </div>

            {/* Inadimplência */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Inadimplência Crítica
                </span>
                <h2 className="text-2xl font-extrabold font-mono text-red-600 dark:text-red-400">
                  {formatarBrl(metricas.totalInadimplencia)}
                </h2>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-light mt-3.5">
                ⚠️ Honorários vencidos que requerem cobrança extrajudicial imediata.
              </p>
            </div>
          </div>

          {/* 3. GRÁFICO + ALERTAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">

            {/* Gráfico SVG */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col relative">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-[#0f1e36] dark:text-slate-200 text-sm tracking-wide">
                    Fluxo de Caixa Consolidado (2026)
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500">
                    Faturamento do Escritório vs. Repasses de Condenações & Custas
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-[#0f1e36] dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]" /> Faturamento
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Repasse
                  </span>
                </div>
              </div>

              <div className="relative flex-grow min-h-[220px]">
                <svg width="100%" height="220" viewBox="0 0 800 220" preserveAspectRatio="none" className="overflow-visible">
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, k) => (
                    <line
                      key={k}
                      x1="55"
                      y1={20 + 170 * ratio}
                      x2="775"
                      y2={20 + 170 * ratio}
                      stroke="#e2e8f0"
                      strokeDasharray="4,4"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  ))}

                  {/* Y labels */}
                  {[1, 0.75, 0.5, 0.25, 0].map((ratio, k) => (
                    <text
                      key={k}
                      x="48"
                      y={20 + 170 * (1 - ratio) + 4}
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {Math.round(maxGraficoVal * ratio) >= 1000
                        ? `${(Math.round(maxGraficoVal * ratio) / 1000).toFixed(0)}k`
                        : Math.round(maxGraficoVal * ratio)}
                    </text>
                  ))}

                  {/* Bars: Repasses */}
                  {svgPointsEntradas.map((p, idx) => {
                    const d = dynamicChartData[idx];
                    const yRepasse = 20 + 170 - (d.repasses / maxGraficoVal) * 170;
                    const height = 190 - yRepasse;
                    const isHov = hoveredMonth === idx;
                    return (
                      <rect
                        key={`bar-${idx}`}
                        x={p.x - 16}
                        y={yRepasse}
                        width={14}
                        height={height > 0 ? height : 2}
                        rx="4"
                        fill="url(#blueGradient)"
                        style={{ transition: "all 0.2s" }}
                        opacity={hoveredMonth === null ? 0.75 : isHov ? 1 : 0.3}
                      />
                    );
                  })}

                  {/* Area: Entradas */}
                  <path d={pathAreaEntradas} fill="url(#goldGradient)" style={{ transition: "all 0.3s" }} />

                  {/* Line: Entradas */}
                  <path
                    d={pathLineEntradas}
                    fill="none"
                    stroke="#d4af37"
                    strokeWidth="3"
                    style={{ transition: "all 0.3s" }}
                    opacity={hoveredMonth === null ? 0.95 : 0.5}
                  />

                  {/* Interactive dots */}
                  {svgPointsEntradas.map((p, idx) => {
                    const isHov = hoveredMonth === idx;
                    return (
                      <g key={idx}>
                        {isHov && (
                          <>
                            <line
                              x1={p.x}
                              y1="20"
                              x2={p.x}
                              y2="190"
                              stroke="#d4af37"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                            />
                            <circle cx={p.x} cy={p.y} r="7" fill="#d4af37" stroke="#0f172a" strokeWidth="2.5" />
                          </>
                        )}
                        {!isHov && hoveredMonth === null && (
                          <circle cx={p.x} cy={p.y} r="4.5" fill="#d4af37" stroke="#f8fafc" strokeWidth="1.5" />
                        )}
                        <text
                          x={p.x}
                          y="208"
                          fill={isHov ? "#d4af37" : "#94a3b8"}
                          fontSize="9.5"
                          fontWeight={isHov ? "bold" : "normal"}
                          textAnchor="middle"
                        >
                          {p.label}
                        </text>
                        <rect
                          x={p.x - 28}
                          y="15"
                          width="56"
                          height="190"
                          fill="transparent"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHoveredMonth(idx)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip */}
                {hoveredMonth !== null && (
                  <div
                    className="absolute z-10 bg-[#0f172a] border border-[#d4af37] text-slate-100 p-3.5 rounded-xl shadow-2xl backdrop-blur-lg flex flex-col gap-1 text-[11px]"
                    style={{
                      left: `${Math.min(Math.max(svgPointsEntradas[hoveredMonth].x - 100, 10), 580)}px`,
                      top: "20px",
                      width: "190px"
                    }}
                  >
                    <span className="font-bold text-xs border-b border-slate-700 pb-1 text-[#d4af37]">
                      {dynamicChartData[hoveredMonth].mes} / 2026
                    </span>
                    <div className="flex justify-between items-center mt-1.5 font-mono">
                      <span className="text-slate-400">Faturamento:</span>
                      <strong className="text-emerald-400">
                        {formatarBrl(dynamicChartData[hoveredMonth].entradas)}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-400">Repasse:</span>
                      <strong className="text-blue-400">
                        {formatarBrl(dynamicChartData[hoveredMonth].repasses)}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-700 pt-1 mt-1 font-bold font-mono text-[9.5px] text-slate-400">
                      <span>Sobra de Caixa:</span>
                      <span>
                        {formatarBrl(
                          dynamicChartData[hoveredMonth].entradas - dynamicChartData[hoveredMonth].repasses
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Central de Alertas */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="space-y-0.5 pb-3 border-b border-slate-200 dark:border-slate-800 mb-3.5">
                <h3 className="font-bold text-[#0f1e36] dark:text-slate-200 text-sm tracking-wide flex items-center gap-1.5">
                  <span>🔔</span> Central de Alertas
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-500">
                  Avisos automáticos gerados por auditoria digital.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-[170px] pr-1">
                {alertas.vencidos.length === 0 && alertas.vazamentos.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center py-10 text-center text-slate-400 text-xs italic font-light">
                    ⚖️ Sem pendências. Conformidade financeira total!
                  </div>
                ) : (
                  <>
                    {alertas.vazamentos.map((item, idx) => (
                      <div
                        key={`vaz-${idx}`}
                        className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 space-y-2.5 text-[11px]"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-amber-700 dark:text-[#d4af37] tracking-wider uppercase text-[9px] bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/25">
                            ⚡ Vazamento de Êxito!
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-normal">
                          Processo <strong>"{item.processo.titulo}"</strong> concluído sem Taxa de Êxito.
                        </p>
                        <button
                          onClick={() => handleQuickLaunchFromAlert(item.cliente.id)}
                          className="w-full bg-[#d4af37] text-[#070a13] font-bold hover:bg-[#f3e5ab] py-1.5 rounded text-[10px] uppercase tracking-wider transition-all"
                        >
                          ➕ Lançar Taxa de Êxito
                        </button>
                      </div>
                    ))}
                    {alertas.vencidos.map((item, idx) => (
                      <div
                        key={`venc-${idx}`}
                        className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 space-y-2.5 text-[11px]"
                      >
                        <span className="font-bold text-red-600 dark:text-red-400 tracking-wider uppercase text-[9px] animate-pulse">
                          ⚠️ Inadimplência Extrema
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-normal">
                          Fatura de <strong>{formatarBrl(item.valor_total)}</strong> ({item.tipo_honorario.toUpperCase()}) de{" "}
                          <strong>{item.clientes?.nome}</strong> em atraso crônico.
                        </p>
                        {item.clientes?.whatsapp && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=55${item.clientes.whatsapp.replace(/\D/g, "")}&text=Prezado(a)%20${encodeURIComponent(item.clientes.nome)}%2C%20favor%20atualizar%20honor%C3%A1rios.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold py-1.5 rounded text-[10px] uppercase tracking-wider transition-all text-center"
                          >
                            💬 Notificar via WhatsApp
                          </a>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 4. TABELA DE LANÇAMENTOS */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm print:hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="font-bold text-[#0f1e36] dark:text-slate-200 text-sm tracking-wide">
                  Histórico de Extratos e Lançamentos
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-500">
                  Exibindo os {limit} lançamentos mais recentes. Use os filtros abaixo para refinar.
                </p>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Pesquisar cliente ou processo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#d4af37] w-[200px]"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="todos">🔍 Todos Status</option>
                  <option value="pago">🟢 Pago</option>
                  <option value="pendente">🟡 Pendente</option>
                  <option value="atrasado">🔴 Inadimplente</option>
                </select>
                <select
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="todos">📅 Todos Meses</option>
                  {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map(
                    (m, i) => <option key={i} value={String(i + 1)}>{m}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="py-20 flex flex-col justify-center items-center space-y-3">
                <Spinner className="w-8 h-8 text-[#d4af37]" />
                <p className="text-xs text-slate-400">Compilando livros contábeis do escritório...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500 dark:text-red-400 text-sm font-medium">
                ⚠️ {error}
              </div>
            ) : lancamentosFiltrados.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs font-light italic">
                Nenhum lançamento financeiro registrado ou localizado sob os filtros informados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                      <th className="py-3.5 px-4 font-semibold">Cliente / Prontuário</th>
                      <th className="py-3.5 px-4 font-semibold">Processo Relacionado</th>
                      <th className="py-3.5 px-4 font-semibold">Categoria / Tipo</th>
                      <th className="py-3.5 px-4 font-semibold">Valor</th>
                      <th className="py-3.5 px-4 font-semibold">Vencimento</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Situação</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {lancamentosFiltrados.map(item => {
                      const isLoading = !!actionLoading[item.id];
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group"
                        >
                          {/* Cliente */}
                          <td className="py-4 px-4">
                            <button
                              onClick={() =>
                                onNavigateToCliente && onNavigateToCliente(item.cliente_id, "financeiro")
                              }
                              className="text-left text-xs font-extrabold text-[#b8962e] dark:text-[#d4af37] hover:underline focus:outline-none"
                            >
                              {item.clientes?.nome || "Cliente Geral"}
                            </button>
                          </td>

                          {/* Processo */}
                          <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                            {item.processos ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[#0f1e36] dark:text-slate-200 font-bold truncate max-w-[200px]">
                                  {item.processos.titulo}
                                </span>
                                <span className="font-mono text-[9px] text-slate-400">
                                  {item.processos.numero_processo}
                                </span>
                              </div>
                            ) : (
                              <span className="italic font-light text-slate-400">
                                Sem vínculo processual
                              </span>
                            )}
                          </td>

                          {/* Categoria */}
                          <td className="py-4 px-4 font-semibold">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[#0f1e36] dark:text-slate-200 capitalize text-xs">
                                {item.tipo_honorario === "êxito"
                                  ? "⚖️ Verba Indenizatória"
                                  : item.tipo_honorario === "mensal"
                                  ? "💼 Assessoria Mensal"
                                  : "📜 Honorários Contratuais"}
                              </span>
                              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider font-bold">
                                {item.tipo_honorario}
                              </span>
                            </div>
                          </td>

                          {/* Valor */}
                          <td className="py-4 px-4 font-mono font-bold text-[#0f1e36] dark:text-slate-200">
                            {formatarBrl(item.valor_total)}
                          </td>

                          {/* Vencimento */}
                          <td className="py-4 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                            {new Date(item.data_vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                          </td>

                          {/* Status badge */}
                          <td className="py-4 px-4 text-center">
                            {renderStatusBadge(item.status_pagamento, item.data_vencimento)}
                          </td>

                          {/* Ações */}
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-3 justify-end">
                              {item.url_comprovante ? (
                                <a
                                  href={item.url_comprovante}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border text-[#a38545] dark:text-[#d4af37] bg-[#c5a85c]/5 hover:bg-[#c5a85c]/10 border-[#c5a85c]/25 hover:border-[#c5a85c]/45 cursor-pointer"
                                  title="Visualizar Comprovante"
                                >
                                  📎 Comprovante
                                </a>
                              ) : (
                                <AnexarComprovante
                                  transacaoId={item.id}
                                  onSucesso={(url) => {
                                    setLancamentos(prev =>
                                      prev.map(l => (l.id === item.id ? { ...l, url_comprovante: url } : l))
                                    );
                                  }}
                                />
                              )}
                              {item.status_pagamento.toLowerCase() !== "pago" && (
                                <button
                                  onClick={() => handleLiquidado(item.id)}
                                  disabled={isLoading}
                                  type="button"
                                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                                    isLoading
                                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                      : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 cursor-pointer"
                                  }`}
                                  title="Liquidar Fatura"
                                >
                                  {isLoading ? (
                                    <>
                                      <Spinner className="w-3 h-3" />
                                      Processando...
                                    </>
                                  ) : (
                                    "✓ Recebido"
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleExcluir(item.id)}
                                disabled={isLoading}
                                type="button"
                                className={`text-xs font-bold ml-1 transition-opacity ${
                                  isLoading
                                    ? "text-slate-400 cursor-not-allowed opacity-50"
                                    : "text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                                }`}
                                title="Remover Transação"
                              >
                                {isLoading ? "..." : "✕"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Carregar mais */}
            {hasMore && !loading && (
              <div className="text-center mt-6 pb-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 bg-[#c5a85c]/5 hover:bg-[#c5a85c]/10 dark:bg-[#d4af37]/5 dark:hover:bg-[#d4af37]/15 text-[#a38545] dark:text-[#d4af37] border border-[#c5a85c] dark:border-[#d4af37] px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Spinner className="w-3.5 h-3.5 text-[#d4af37]" />
                      Carregando...
                    </>
                  ) : (
                    "🔄 Carregar mais lançamentos..."
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* 5. MÓDULO FISCAL (NFS-e) */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Formulário: 2 colunas */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 print:hidden h-fit">
            <div className="space-y-1 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-[#0f1e36] dark:text-slate-200 text-sm tracking-wide">
                Dados de Faturamento & Serviços
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Preencha os campos abaixo para emitir a Nota Fiscal de Serviços eletrônica.
              </p>
            </div>

            <form onSubmit={handleEmitirNfse} className="space-y-4">
              
              {/* Dropdown Cliente */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Selecione o Cliente (Prontuário) *
                </label>
                <select
                  value={nfseClienteId}
                  onChange={(e) => {
                    setNfseClienteId(e.target.value);
                    setNfseGerada(null); // Limpa nota anterior
                  }}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="">Selecione o prontuário do cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informações Auxiliares do Cliente (Somente Leitura Visual) */}
              {selectedClienteNfse && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-[11px] animate-fadeIn">
                  <span className="text-[9.5px] font-bold text-[#d4af37] tracking-widest uppercase">
                    📋 Dados do Prontuário
                  </span>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-350">
                    <div>
                      <span className="font-semibold">CPF/CNPJ: </span>
                      <span className="font-mono">{selectedClienteNfse.cpf_cnpj || "Não cadastrado"}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Endereço Completo: </span>
                      <span>{selectedClienteNfse.endereco_completo || "Não cadastrado no prontuário"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Descrição dos Serviços Prestados */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Descrição dos Serviços Prestados *
                </label>
                <textarea
                  required
                  rows={3}
                  value={nfseDescricao}
                  onChange={(e) => setNfseDescricao(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37]"
                  placeholder="Descreva detalhadamente os honorários de assessoria..."
                />
              </div>

              {/* Valor e Alíquota */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Valor da Nota (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={nfseValor}
                    onChange={handleNfseValorChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Alíquota ISS (%) *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      value={nfseAliquota}
                      onChange={(e) => setNfseAliquota(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] font-mono pr-8"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 font-mono">%</span>
                  </div>
                </div>
              </div>

              {/* Botão Emissão */}
              <button
                type="submit"
                disabled={emitindoNfse}
                className="w-full flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#f3e5ab] text-[#070a13] font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-50 cursor-pointer focus:outline-none"
              >
                {emitindoNfse ? (
                  <>
                    <Spinner className="w-4 h-4 text-[#070a13]" />
                    Emitindo...
                  </>
                ) : (
                  <>🧾 Emitir Nota Fiscal Eletrônica</>
                )}
              </button>
            </form>
          </div>

          {/* Espelho / Preview: 3 colunas */}
          <div className="lg:col-span-3 space-y-4 print:w-full">
            {emitindoNfse ? (
              <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-16 flex flex-col justify-center items-center space-y-4 shadow-sm h-[500px]">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-200 border-t-[#d4af37] rounded-full animate-spin"></div>
                  <span className="absolute inset-0 flex items-center justify-center text-lg">🏛️</span>
                </div>
                <h3 className="font-playfair font-bold text-lg text-[#0f1e36] dark:text-slate-200 animate-pulse text-center">
                  Comunicando com a Prefeitura...
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light text-center max-w-[280px]">
                  Realizando autenticação de chaves fiscais e calculando retenção municipal. Por favor, aguarde.
                </p>
              </div>
            ) : nfseGerada ? (
              <div className="space-y-4 print:space-y-0">
                {/* Print button toolbar */}
                <div className="flex justify-end gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-[#c5a85c]/5 hover:bg-[#c5a85c]/10 dark:bg-[#d4af37]/5 dark:hover:bg-[#d4af37]/15 text-[#a38545] dark:text-[#d4af37] border border-[#c5a85c] dark:border-[#d4af37] px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-lg cursor-pointer focus:outline-none"
                  >
                    🖨️ Imprimir / Salvar PDF da Nota
                  </button>
                </div>

                {/* NFS-e Document Sheet */}
                <div className="bg-white text-black p-6 sm:p-8 rounded-2xl border border-slate-350 font-sans shadow-xl text-[10px] leading-normal mx-auto w-full print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:text-black print:bg-white select-text">
                  
                  {/* NFS-e Border Box */}
                  <div className="border border-black p-4 space-y-4">
                    
                    {/* Header Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 border-b border-black pb-4 gap-4">
                      
                      {/* Logo / Prestador name */}
                      <div className="md:col-span-1 flex flex-col justify-center items-center text-center border-r-0 md:border-r border-black md:pr-4">
                        <span className="text-xl font-serif font-extrabold tracking-wider text-[#0a192f] select-none">JT</span>
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#d4af37] select-none">Advogados</span>
                        <span className="text-[7px] text-slate-500 mt-1 select-none">JANAINA TARABAUCA ADVOCACIA</span>
                      </div>

                      {/* Title block */}
                      <div className="md:col-span-2 flex flex-col justify-center items-center text-center border-r-0 md:border-r border-black md:px-4 space-y-1">
                        <h4 className="font-extrabold text-[9px] uppercase tracking-wide">
                          Prefeitura do Município de São Paulo
                        </h4>
                        <span className="text-[8px] text-slate-600 block">Secretaria Municipal de Finanças</span>
                        <h3 className="font-black text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-350 uppercase select-none">
                          Nota Fiscal de Serviços Eletrônica - NFS-e
                        </h3>
                      </div>

                      {/* Number and Authentication block */}
                      <div className="md:col-span-1 flex flex-col justify-center space-y-1.5 pl-2 font-mono text-[8px] select-all">
                        <div>
                          <strong className="block text-[7px] uppercase text-slate-500 font-sans">Número da NFS-e</strong>
                          <span className="font-bold text-xs">{nfseGerada.numeroNota}</span>
                        </div>
                        <div>
                          <strong className="block text-[7px] uppercase text-slate-500 font-sans">Data/Hora Emissão</strong>
                          <span className="font-bold">{nfseGerada.dataEmissao}</span>
                        </div>
                        <div>
                          <strong className="block text-[7px] uppercase text-slate-500 font-sans">Cód. Autenticação</strong>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1 border border-emerald-200 rounded">{nfseGerada.codigoAutenticacao}</span>
                        </div>
                      </div>

                    </div>

                    {/* Prestador Block */}
                    <div className="border-b border-black pb-3.5 space-y-1">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 block">Prestador de Serviços</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                        <div>
                          <span className="font-bold">Razão Social / Nome: </span>
                          <span>Janaina Tarabauca Advocacia & Associados (JT Advogados)</span>
                        </div>
                        <div>
                          <span className="font-bold">CNPJ: </span>
                          <span className="font-mono">12.345.678/0001-99</span>
                        </div>
                        <div>
                          <span className="font-bold">Endereço: </span>
                          <span>Av. Paulista, 1000, 14º andar, Bela Vista, São Paulo - SP, CEP: 01311-100</span>
                        </div>
                        <div>
                          <span className="font-bold">Inscrição Municipal: </span>
                          <span className="font-mono">987.654-3</span>
                        </div>
                      </div>
                    </div>

                    {/* Tomador Block */}
                    <div className="border-b border-black pb-3.5 space-y-1">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 block">Tomador de Serviços</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 select-all">
                        <div>
                          <span className="font-bold">Razão Social / Nome: </span>
                          <span>{nfseGerada.clienteNome}</span>
                        </div>
                        <div>
                          <span className="font-bold">CPF/CNPJ: </span>
                          <span className="font-mono">{nfseGerada.clienteCpfCnpj}</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-bold">Endereço: </span>
                          <span>{nfseGerada.clienteEndereco}</span>
                        </div>
                      </div>
                    </div>

                    {/* Discriminação dos Serviços */}
                    <div className="border-b border-black pb-6 space-y-2 min-h-[120px]">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 block">Discriminação dos Serviços Prestados</span>
                      <p className="whitespace-pre-wrap font-mono text-[9px] leading-relaxed text-slate-800 select-all">
                        {nfseGerada.descricao}
                      </p>
                    </div>

                    {/* Tributos Federais & Estaduais (Espelho de Impostos) */}
                    <div className="border-b border-black pb-3 space-y-2">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 block">Detalhamento Fiscais e Retenções</span>
                      <div className="grid grid-cols-5 gap-2 text-center text-[8px] font-mono">
                        <div className="border border-slate-300 p-1.5 rounded bg-slate-50">
                          <span className="block text-[6.5px] uppercase font-sans text-slate-500">PIS (R$)</span>
                          <strong>0,00</strong>
                        </div>
                        <div className="border border-slate-300 p-1.5 rounded bg-slate-50">
                          <span className="block text-[6.5px] uppercase font-sans text-slate-500">COFINS (R$)</span>
                          <strong>0,00</strong>
                        </div>
                        <div className="border border-slate-300 p-1.5 rounded bg-slate-50">
                          <span className="block text-[6.5px] uppercase font-sans text-slate-500">CSLL (R$)</span>
                          <strong>0,00</strong>
                        </div>
                        <div className="border border-slate-300 p-1.5 rounded bg-slate-50">
                          <span className="block text-[6.5px] uppercase font-sans text-slate-500">IRRF (R$)</span>
                          <strong>0,00</strong>
                        </div>
                        <div className="border border-slate-300 p-1.5 rounded bg-slate-50">
                          <span className="block text-[6.5px] uppercase font-sans text-slate-500">INSS (R$)</span>
                          <strong>0,00</strong>
                        </div>
                      </div>
                    </div>

                    {/* ISSQN & Valor da Nota */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 font-mono text-right md:text-left select-all">
                      <div>
                        <span className="block text-[7px] uppercase font-sans text-slate-500">Valor Total do Serviço</span>
                        <strong className="text-[11px] text-slate-900">{formatarBrl(nfseGerada.valorServicos)}</strong>
                      </div>
                      <div>
                        <span className="block text-[7px] uppercase font-sans text-slate-500">Alíquota Aplicável</span>
                        <strong className="text-[11px] text-slate-900">{nfseGerada.aliquota.toFixed(1)}%</strong>
                      </div>
                      <div>
                        <span className="block text-[7px] uppercase font-sans text-slate-500">Valor do ISS Retido</span>
                        <strong className="text-[11px] text-emerald-700">{formatarBrl(nfseGerada.valorIss)}</strong>
                      </div>
                      <div className="bg-slate-100 p-2 border border-slate-300 rounded text-right">
                        <span className="block text-[7px] uppercase font-sans text-slate-500">Valor Líquido da Nota</span>
                        <strong className="text-sm font-black text-[#0f1e36]">{formatarBrl(nfseGerada.valorServicos)}</strong>
                      </div>
                    </div>

                    {/* Rodapé Informativo */}
                    <div className="pt-2 border-t border-dashed border-slate-400 text-[7px] text-slate-500 leading-normal space-y-0.5 select-none">
                      <p>● NFS-e emitida nos termos da Lei nº 14.097/2005 e Regulamento de ISSQN municipal.</p>
                      <p>● Atividade Prestada: 17.01 - Advocacia (Assessoria, Consultoria e Representação jurídica).</p>
                      <p>● Regime Especial de Tributação: Sociedade de Profissionais do Município de São Paulo.</p>
                      <p>● Documento emitido para fins de simulação e controle contábil institucional. Autenticação puramente digital.</p>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100/50 dark:bg-[#0f172a]/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-16 flex flex-col justify-center items-center space-y-3 h-[500px] text-center print:hidden">
                <span className="text-4xl">🧾</span>
                <h3 className="font-playfair font-bold text-slate-500 dark:text-slate-400 text-sm">
                  Espelho da NFS-e
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-light max-w-[280px]">
                  Após selecionar o cliente e preencher os dados de faturamento, clique em "Emitir Nota Fiscal Eletrônica" para visualizar o espelho oficial e tributário.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Lançamento */}
      {isModalOpen && (
        <ModalLancamentoFinanceiro
          clienteId={preselectedClienteId}
          onClose={() => {
            setIsModalOpen(false);
            setPreselectedClienteId(undefined);
          }}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
};
