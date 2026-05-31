import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { ModalLancamentoFinanceiro } from "./ModalLancamentoFinanceiro";

interface ClienteInfo {
  id: string;
  nome: string;
  whatsapp?: string;
  email?: string;
}

interface ProcessoInfo {
  id: string;
  numero_processo: string;
  titulo: string;
  status: string; // Ex: 'Ativo', 'Arquivado', 'Suspenso', 'Em Acordo'
}

interface LancamentoGeral {
  id: string;
  cliente_id: string;
  processo_id?: string | null;
  valor_total: number;
  valor_bruto_condenacao?: number; // Valor bruto da condenação (opcional)
  cota_cliente?: number; // Cota do cliente da condenação (opcional)
  tipo_honorario: string; // 'fixo' | 'mensal' | 'êxito'
  categoria_transacao?: "honorario" | "indenizacao" | "custas"; // Categoria sofisticada
  status_pagamento: string; // 'pago' | 'pendente' | 'atrasado'
  data_vencimento: string;
  created_at: string;
  clientes?: ClienteInfo | null;
  processos?: ProcessoInfo | null;
}

interface PaginaFinanceiroProps {
  onNavigateToCliente?: (clienteId: string, activeTab: string) => void;
}

export const PaginaFinanceiro: React.FC<PaginaFinanceiroProps> = ({ onNavigateToCliente }) => {
  const [lancamentos, setLancamentos] = useState<LancamentoGeral[]>([]);
  const [clientes, setClientes] = useState<ClienteInfo[]>([]);
  const [processosMap, setProcessosMap] = useState<Record<string, ProcessoInfo[]>>({});
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Paginação e Ações
  const [offset, setOffset] = useState<number>(0);
  const limit = 50;
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Estados dos filtros
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [monthFilter, setMonthFilter] = useState<string>("todos");

  // Controle do Modal de Novo Lançamento
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preselectedClienteId, setPreselectedClienteId] = useState<string | undefined>(undefined);

  // Estado interativo do gráfico (Mês selecionado/hovered no SVG)
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // --- MOCK DATA PARA OPERAÇÃO DE FLUXO DE CAIXA EM 2026 ---
  const chartMockData = useMemo(() => {
    return [
      { mes: "Jan", entradas: 12000, repasses: 4000 },
      { mes: "Fev", entradas: 15000, repasses: 5000 },
      { mes: "Mar", entradas: 32000, repasses: 65000 }, // Vitória processual, repasse alto
      { mes: "Abr", entradas: 18000, repasses: 6000 },
      { mes: "Mai", entradas: 22000, repasses: 8000 },
      { mes: "Jun", entradas: 48000, repasses: 98000 }, // Grande vitória
      { mes: "Jul", entradas: 20000, repasses: 5000 },
      { mes: "Ago", entradas: 26000, repasses: 7000 },
      { mes: "Set", entradas: 31000, repasses: 12000 },
      { mes: "Out", entradas: 27000, repasses: 9000 },
      { mes: "Nov", entradas: 30000, repasses: 8000 },
      { mes: "Dez", entradas: 58000, repasses: 35000 }
    ];
  }, []);



  // Carregar Clientes e Lançamentos
  // Carregar metadados (Clientes e Processos)
  const fetchMetadata = async () => {
    try {
      // 1. Carregar Clientes do Supabase
      const { data: clientsData, error: clientErr } = await supabase
        .from("clientes")
        .select("id, nome, whatsapp, email")
        .order("nome", { ascending: true });

      if (clientErr) throw clientErr;
      setClientes(clientsData || []);

      // 2. Carregar todos os Processos vinculados para o filtro reativo
      const { data: procData, error: procErr } = await supabase
        .from("processos")
        .select("id, cliente_id, numero_processo, titulo, status");

      if (procErr) throw procErr;

      const pMap: Record<string, ProcessoInfo[]> = {};
      (procData || []).forEach((p) => {
        if (!pMap[p.cliente_id]) {
          pMap[p.cliente_id] = [];
        }
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

      // 3. Carregar lançamentos financeiros unificados com limite de 50
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
          processos: processosObj || null,
          categoria_transacao: item.tipo_honorario === "êxito" ? "indenizacao" : "honorario"
        };
      });

      if (append) {
        setLancamentos(prev => [...prev, ...mapped]);
      } else {
        setLancamentos(mapped);
      }

      if (mapped.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err: any) {
      console.error("Erro ao sincronizar ecossistema financeiro:", err.message);
      setError("Falha ao sincronizar dados com o banco de dados. Exibindo demonstrativos em modo seguro.");
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
  }, []);



  // Lógica de Inteligência Financeira e Agregação Reativa (2026)
  const metricas = useMemo(() => {
    const hojeStr = new Date().toISOString().split("T")[0];
    
    let totalRecebido = 0;
    let totalProjecao = 0;
    let totalInadimplencia = 0;

    lancamentos.forEach((item) => {
      const valor = parseFloat(item.valor_total as any) || 0;
      const status = item.status_pagamento.toLowerCase();

      if (status === "pago") {
        totalRecebido += valor;
      } else {
        if (item.data_vencimento < hojeStr) {
          totalInadimplencia += valor;
        } else {
          totalProjecao += valor;
        }
      }
    });

    return { totalRecebido, totalProjecao, totalInadimplencia };
  }, [lancamentos]);

  // Alertas Inteligentes de Pendências
  const alertas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const listaVencidos: LancamentoGeral[] = [];
    const listaVazamentoExito: { processo: ProcessoInfo; cliente: ClienteInfo }[] = [];

    // 1. Alerta de parcelas vencidas há mais de 5 dias
    lancamentos.forEach((item) => {
      if (item.status_pagamento.toLowerCase() !== "pago") {
        const dataVenc = new Date(item.data_vencimento);
        const diffTempo = hoje.getTime() - dataVenc.getTime();
        const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
        
        if (diffDias > 5) {
          listaVencidos.push(item);
        }
      }
    });

    // 2. Alerta de "Vazamento de Êxito" (Processos Ganhos/Sentenciados sem honorário de êxito)
    Object.keys(processosMap).forEach((clienteId) => {
      const procs = processosMap[clienteId] || [];
      const client = clientes.find((c) => c.id === clienteId);
      
      procs.forEach((proc) => {
        const statusLower = proc.status.toLowerCase();
        // Identifica processos terminados com êxito (ganhos/acordos)
        if (statusLower === "arquivado" || statusLower === "em acordo" || statusLower === "concluído" || statusLower === "sentenciado") {
          // Verifica se há alguma cobrança vinculada de êxito para esse processo
          const temCobrançaExito = lancamentos.some(
            (l) => l.processo_id === proc.id && l.tipo_honorario.toLowerCase() === "êxito"
          );

          if (!temCobrançaExito && client) {
            listaVazamentoExito.push({ processo: proc, cliente: client });
          }
        }
      });
    });

    return { vencidos: listaVencidos, vazamentos: listaVazamentoExito };
  }, [lancamentos, processosMap, clientes]);

  // Filtros aplicados à tabela
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        (item.clientes?.nome || "").toLowerCase().includes(searchLower) ||
        (item.processos?.titulo || "").toLowerCase().includes(searchLower) ||
        (item.processos?.numero_processo || "").toLowerCase().includes(searchLower);

      const matchStatus = 
        statusFilter === "todos" || 
        item.status_pagamento.toLowerCase() === statusFilter.toLowerCase();

      let matchMonth = true;
      if (monthFilter !== "todos") {
        const d = new Date(item.data_vencimento);
        const mesIndex = d.getUTCMonth() + 1;
        matchMonth = mesIndex.toString() === monthFilter;
      }

      return matchSearch && matchStatus && matchMonth;
    });
  }, [lancamentos, searchQuery, statusFilter, monthFilter]);

  // Acoplar novos faturamentos ao gráfico em tempo real para o ano de 2026
  const dynamicChartData = useMemo(() => {
    const base = [...chartMockData];
    
    lancamentos.forEach((item) => {
      if (item.status_pagamento.toLowerCase() === "pago") {
        const date = new Date(item.data_vencimento);
        // Filtra pelo ano vigente 2026
        if (date.getUTCFullYear() === 2026) {
          const mesIndex = date.getUTCMonth(); // 0 a 11
          if (mesIndex >= 0 && mesIndex < 12) {
            base[mesIndex] = {
              ...base[mesIndex],
              entradas: base[mesIndex].entradas + item.valor_total
            };
          }
        }
      }
    });

    return base;
  }, [lancamentos, chartMockData]);

  // Ação rápida para preencher o formulário baseado em alerta
  const handleQuickLaunchFromAlert = (clienteId: string, processoId: string) => {
    setPreselectedClienteId(clienteId);
    setIsModalOpen(true);
  };

  // Dar Baixa / Liquidar Fatura
  const handleLiquidado = async (id: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      const { error: updateErr } = await supabase
        .from("financeiro")
        .update({ status_pagamento: "pago" })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // Reatividade instantânea local
      setLancamentos(prev =>
        prev.map(item => item.id === id ? { ...item, status_pagamento: "pago" } : item)
      );
    } catch (err: any) {
      alert("Erro ao liquidar lançamento: " + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Excluir Lançamento
  const handleExcluir = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este lançamento financeiro permanentemente?")) return;
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

  // Auxiliares de Formatação e Estilos
  const formatarBrl = (num: number): string => {
    return num.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const renderStatusBadge = (status: string, vencimento: string) => {
    const s = status.toLowerCase();
    const hojeStr = new Date().toISOString().split("T")[0];
    
    if (s === "pago") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ● Pago
        </span>
      );
    } else if (vencimento < hojeStr) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
          ● Inadimplente
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          ● Pendente
        </span>
      );
    }
  };

  // Matemática para gerar visualização gráfica em SVG
  const maxGraficoVal = useMemo(() => {
    let max = 10000;
    dynamicChartData.forEach((d) => {
      if (d.entradas > max) max = d.entradas;
      if (d.repasses > max) max = d.repasses;
    });
    return max * 1.15; // Adiciona margem de 15% no topo
  }, [dynamicChartData]);

  const svgPointsEntradas = useMemo(() => {
    const paddingLeft = 55;
    const paddingRight = 25;
    const chartWidth = 800 - paddingLeft - paddingRight;
    const chartHeight = 170;
    const paddingTop = 20;

    return dynamicChartData.map((d, i) => {
      const x = paddingLeft + (i * (chartWidth / 11));
      const y = paddingTop + chartHeight - (d.entradas / maxGraficoVal) * chartHeight;
      return { x, y, val: d.entradas, label: d.mes };
    });
  }, [dynamicChartData, maxGraficoVal]);

  const pathLineEntradas = useMemo(() => {
    if (svgPointsEntradas.length === 0) return "";
    return svgPointsEntradas.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  }, [svgPointsEntradas]);

  const pathAreaEntradas = useMemo(() => {
    if (svgPointsEntradas.length === 0) return "";
    const first = svgPointsEntradas[0];
    const last = svgPointsEntradas[svgPointsEntradas.length - 1];
    return `${pathLineEntradas} L ${last.x} 190 L ${first.x} 190 Z`;
  }, [svgPointsEntradas, pathLineEntradas]);

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[var(--bg-color)] text-[var(--text-primary)]">
      
      {/* 1. CABEÇALHO GLOBAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-6 shadow-lg backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💼</span>
            <h1 className="font-playfair font-bold text-2xl tracking-wide text-[var(--text-primary)]">
              Gestão Financeira & Fluxo de Caixa
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Painel consolidado de lançamentos contratuais, verbas indenizatórias e custos processuais.
          </p>
        </div>

        <button
          onClick={() => {
            setPreselectedClienteId(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#0a192f] hover:bg-[#0f2444] text-[#d4af37] border border-[#d4af37]/60 hover:border-[#d4af37] px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-lg hover:shadow-[#d4af37]/5 cursor-pointer focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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

      {/* 2. CONTEÚDO PRINCIPAL COM NAVEGAÇÃO INTERNA */}
      {true ? (
        <>
          {/* SEÇÃO A: METRICAS RAPIDAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FATURAMENTO REALIZADO */}
            <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg pointer-events-none"></div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Receita Realizada (Mapeada)</span>
                <h2 className="text-2xl font-extrabold font-mono text-emerald-400">{formatarBrl(metricas.totalRecebido)}</h2>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] font-light mt-3.5">🟢 Caixa consolidado recebido de honorários e custas processuais.</p>
            </div>

            {/* PREVISÃO DE ENTRADA */}
            <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-[#d4af37]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4af37]/5 rounded-full blur-lg pointer-events-none"></div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Previsão de Entrada</span>
                <h2 className="text-2xl font-extrabold font-mono text-[var(--gold)]">{formatarBrl(metricas.totalProjecao)}</h2>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] font-light mt-3.5">🔮 Faturas a vencer agendadas e sob conformidade contratual.</p>
            </div>

            {/* INADIMPLÊNCIA CRÍTICA */}
            <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-lg pointer-events-none"></div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Inadimplência Crítica</span>
                <h2 className="text-2xl font-extrabold font-mono text-red-400">{formatarBrl(metricas.totalInadimplencia)}</h2>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] font-light mt-3.5">⚠️ Honorários vencidos que requerem cobrança extrajudicial imediata.</p>
            </div>
          </div>

          {/* SEÇÃO B: CHART FLOW & ALERTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRÁFICO INTERATIVO SVG (ESQUERDA E CENTRO) */}
            <div className="lg:col-span-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5.5 shadow-md flex flex-col relative">
              <div className="flex justify-between items-center pb-3 border-b border-[var(--panel-border)] mb-4">
                <div className="space-y-0.5">
                  <h3 className="font-playfair font-bold text-slate-200 text-sm tracking-wide">
                    Fluxo de Caixa Consolidado (2026)
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)]">Faturamento do Escritório vs. Repasses de Condenações & Custas</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]"></span> Faturamento</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Repasse Clientes</span>
                </div>
              </div>

              {/* MOCK/REAL SVG GRAPHICS CHART */}
              <div className="relative flex-grow min-h-[220px]">
                <svg width="100%" height="220" viewBox="0 0 800 220" preserveAspectRatio="none" className="overflow-visible">
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, k) => {
                    const yVal = 20 + 170 * ratio;
                    return (
                      <line
                        key={k}
                        x1="55"
                        y1={yVal}
                        x2="775"
                        y2={yVal}
                        stroke="var(--panel-border)"
                        strokeDasharray="4,4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Y Axis Labels */}
                  {[1, 0.75, 0.5, 0.25, 0].map((ratio, k) => {
                    const yVal = 20 + 170 * (1 - ratio);
                    const reprVal = Math.round(maxGraficoVal * ratio);
                    return (
                      <text
                        key={k}
                        x="48"
                        y={yVal + 4}
                        fill="var(--text-secondary)"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {reprVal >= 1000 ? `${(reprVal / 1000).toFixed(0)}k` : reprVal}
                      </text>
                    );
                  })}

                  {/* BARS: Repasses / Saídas */}
                  {svgPointsEntradas.map((p, idx) => {
                    const d = dynamicChartData[idx];
                    const yRepasse = 20 + 170 - (d.repasses / maxGraficoVal) * 170;
                    const height = 190 - yRepasse;
                    const barWidth = 14;
                    const isHovered = hoveredMonth === idx;

                    return (
                      <rect
                        key={`bar-${idx}`}
                        x={p.x - barWidth - 2}
                        y={yRepasse}
                        width={barWidth}
                        height={height > 0 ? height : 2}
                        rx="4"
                        fill="url(#blueGradient)"
                        style={{ transition: "all 0.2s" }}
                        opacity={hoveredMonth === null ? 0.75 : isHovered ? 1 : 0.3}
                      />
                    );
                  })}

                  {/* AREA: Entradas (Gradient) */}
                  <path
                    d={pathAreaEntradas}
                    fill="url(#goldGradient)"
                    style={{ transition: "all 0.3s" }}
                  />

                  {/* LINE: Entradas */}
                  <path
                    d={pathLineEntradas}
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="3"
                    style={{ transition: "all 0.3s" }}
                    opacity={hoveredMonth === null ? 0.95 : 0.5}
                  />

                  {/* Dynamic Pointer dots & Interaction overlay */}
                  {svgPointsEntradas.map((p, idx) => {
                    const isHovered = hoveredMonth === idx;
                    return (
                      <g key={idx}>
                        {isHovered && (
                          <>
                            {/* Vertical focus line */}
                            <line
                              x1={p.x}
                              y1="20"
                              x2={p.x}
                              y2="190"
                              stroke="var(--gold)"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                            />
                            {/* Glowing anchor dot */}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="7"
                              fill="var(--gold)"
                              stroke="#070a13"
                              strokeWidth="2.5"
                            />
                          </>
                        )}
                        {!isHovered && hoveredMonth === null && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4.5"
                            fill="var(--gold)"
                            stroke="var(--panel-bg)"
                            strokeWidth="1.5"
                          />
                        )}
                        
                        {/* Month names on X Axis */}
                        <text
                          x={p.x}
                          y="208"
                          fill={isHovered ? "var(--gold)" : "var(--text-secondary)"}
                          fontSize="9.5"
                          fontWeight={isHovered ? "bold" : "medium"}
                          textAnchor="middle"
                        >
                          {p.label}
                        </text>

                        {/* HOVER INTERACTION OVERLAY STRIPS */}
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

                {/* GRAPHIC TOOLTIP WINDOW (Glassmorphic absolute overlay) */}
                {hoveredMonth !== null && (
                  <div 
                    className="absolute z-10 bg-[#0f172a]/95 border border-[var(--gold)] text-slate-100 p-3.5 rounded-xl shadow-2xl backdrop-blur-lg flex flex-col gap-1 text-[11px]"
                    style={{
                      left: `${Math.min(
                        Math.max(svgPointsEntradas[hoveredMonth].x - 100, 10),
                        580
                      )}px`,
                      top: "20px",
                      width: "190px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                    }}
                  >
                    <span className="font-bold text-xs border-b border-slate-800 pb-1 text-[var(--gold)]">
                      Demonstrativo — {dynamicChartData[hoveredMonth].mes} / 2026
                    </span>
                    <div className="flex justify-between items-center mt-1.5 font-mono">
                      <span>Faturamento Real:</span>
                      <strong className="text-emerald-400">
                        {formatarBrl(dynamicChartData[hoveredMonth].entradas)}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center font-mono">
                      <span>Repasse Clientes:</span>
                      <strong className="text-blue-400">
                        {formatarBrl(dynamicChartData[hoveredMonth].repasses)}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-1 mt-1 font-bold font-mono text-[9.5px] text-slate-400">
                      <span>Sobra de Caixa:</span>
                      <span>
                        {formatarBrl(
                          dynamicChartData[hoveredMonth].entradas -
                            dynamicChartData[hoveredMonth].repasses
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CENTRAL DE ALERTAS INTELIGENTES (DIREITA) */}
            <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="space-y-0.5 pb-3 border-b border-[var(--panel-border)] mb-3.5">
                <h3 className="font-playfair font-bold text-slate-200 text-sm tracking-wide flex items-center gap-1.5">
                  <span>🔔</span> Central de Alertas e Vazamentos
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)]">Avisos automáticos gerados por auditoria digital.</p>
              </div>

              {/* LIST OF NOTIFICATIONS */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[170px] pr-1 scrollbar-thin">
                {alertas.vencidos.length === 0 && alertas.vazamentos.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center py-10 text-center text-slate-500 text-xs italic font-light">
                    ⚖️ Sem pendências. Conformidade financeira total!
                  </div>
                ) : (
                  <>
                    {/* Alertas Vazamento de Exito */}
                    {alertas.vazamentos.map((item, idx) => (
                      <div 
                        key={`vaz-${idx}`}
                        className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2.5 text-[11px]"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[#d4af37] tracking-wider uppercase text-[9px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                            ⚡ Vazamento de Êxito!
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-bold">Ação ganha</span>
                        </div>
                        <p className="text-slate-300 leading-normal">
                          O processo <strong>"{item.processo.titulo}"</strong> ({item.processo.numero_processo}) foi concluído, mas não há registro de <strong>Taxa de Êxito</strong>.
                        </p>
                        <button
                          onClick={() => handleQuickLaunchFromAlert(item.cliente.id, item.processo.id)}
                          className="w-full bg-[#d4af37] text-[#070a13] font-bold hover:bg-[#f3e5ab] py-1.5 rounded text-[10px] uppercase tracking-wider transition-all"
                        >
                          ➕ Lançar Taxa de Êxito
                        </button>
                      </div>
                    ))}

                    {/* Alertas de Vencimento de Fatura */}
                    {alertas.vencidos.map((item, idx) => (
                      <div 
                        key={`venc-${idx}`}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-2.5 text-[11px]"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-red-400 tracking-wider uppercase text-[9px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/25 animate-pulse">
                            ⚠️ Inadimplência Extrema
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-bold">Vencido</span>
                        </div>
                        <p className="text-slate-300 leading-normal">
                          Fatura contratual no valor de <strong>{formatarBrl(item.valor_total)}</strong> ({item.tipo_honorario.toUpperCase()}) vinculada ao cliente <strong>{item.clientes?.nome}</strong> está em atraso crônico.
                        </p>
                        
                        {item.clientes?.whatsapp && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=55${item.clientes.whatsapp.replace(/\D/g, "")}&text=Prezado(a)%20${encodeURIComponent(item.clientes.nome)}%2C%20entramos%20em%20contato%20da%20assessoria%20de%20Dra.%20Janaina%20Tarabauca%20para%20atualiza%C3%A7%C3%A3o%20de%20honor%C3%A1rios%20contratuais.%20Poderia%20nos%20retornar%3F`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold py-1.5 rounded text-[10px] uppercase tracking-wider transition-all text-center"
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

          {/* SEÇÃO C: TABELA E EXTRATOS */}
          <div className="bg-[var(--panel-bg)] rounded-2xl border border-[var(--panel-border)] p-5.5 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3.5 border-b border-[var(--panel-border)]">
              <div className="space-y-0.5">
                <h3 className="font-playfair font-bold text-slate-200 text-sm tracking-wide">
                  Histórico de Extratos e Lançamentos
                </h3>
                <p className="text-[10.5px] text-[var(--text-secondary)]">Exibindo auditoria de honorários e reembolsos registrados.</p>
              </div>

              {/* Barra de Filtros e Busca Local */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Pesquisar prontuário ou processo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-[var(--gold)] w-[200px]"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)] cursor-pointer"
                >
                  <option value="todos">🔍 Todos Status</option>
                  <option value="pago">🟢 Pago</option>
                  <option value="pendente">🟡 Pendente</option>
                  <option value="atrasado">🔴 Inadimplente</option>
                </select>

                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)] cursor-pointer"
                >
                  <option value="todos">📅 Todos Meses</option>
                  <option value="1">Janeiro</option>
                  <option value="2">Fevereiro</option>
                  <option value="3">Março</option>
                  <option value="4">Abril</option>
                  <option value="5">Maio</option>
                  <option value="6">Junho</option>
                  <option value="7">Julho</option>
                  <option value="8">Agosto</option>
                  <option value="9">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col justify-center items-center space-y-3">
                <div className="w-8 h-8 border-4 border-slate-800 border-t-[var(--gold)] rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Compilando livros contábeis do escritório...</p>
              </div>
            ) : lancamentosFiltrados.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs font-light italic">
                Nenhum lançamento financeiro registrado ou localizado sob os filtros informados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-[var(--panel-border)] bg-[var(--input-bg)]/20">
                      <th className="py-3.5 px-4 font-semibold">Cliente / Prontuário</th>
                      <th className="py-3.5 px-4 font-semibold">Processo Relacionado</th>
                      <th className="py-3.5 px-4 font-semibold">Categoria / Tipo</th>
                      <th className="py-3.5 px-4 font-semibold">Cota Escritório</th>
                      <th className="py-3.5 px-4 font-semibold">Vencimento</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Situação</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--panel-border)]/30">
                    {lancamentosFiltrados.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-900/10 transition-colors group"
                      >
                        {/* Cliente Link */}
                        <td className="py-4 px-4 font-bold text-[var(--gold)] hover:underline cursor-pointer">
                          <button
                            onClick={() => onNavigateToCliente && onNavigateToCliente(item.cliente_id, "financeiro")}
                            className="bg-none border-none p-0 text-left cursor-pointer hover:text-[#f3e5ab] text-xs font-extrabold focus:outline-none"
                          >
                            {item.clientes?.nome || "Cliente Geral"}
                          </button>
                        </td>

                        {/* Processo */}
                        <td className="py-4 px-4 text-[var(--text-secondary)] font-medium">
                          {item.processos ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[var(--text-primary)] font-bold truncate max-w-[200px]">{item.processos.titulo}</span>
                              <span className="font-mono text-[9px] text-[var(--text-secondary)]">{item.processos.numero_processo}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-light italic">Sem vínculo processual</span>
                          )}
                        </td>

                        {/* Categoria / Tipo */}
                        <td className="py-4 px-4 font-semibold">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[var(--text-primary)] capitalize text-xs">
                              {item.tipo_honorario === "êxito" 
                                ? "⚖️ Verba Indenizatória" 
                                : item.tipo_honorario === "mensal" 
                                ? "💼 Assessoria Mensal"
                                : "📜 Honorários Contratuais"}
                            </span>
                            <span className="text-[9.5px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">
                              {item.tipo_honorario}
                            </span>
                          </div>
                        </td>

                        {/* Valor Total */}
                        <td className="py-4 px-4 font-mono font-bold text-[var(--text-primary)]">
                          {formatarBrl(item.valor_total)}
                        </td>

                        {/* Vencimento */}
                        <td className="py-4 px-4 font-mono font-bold text-[var(--text-secondary)]">
                          {new Date(item.data_vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        </td>

                        {/* Situação */}
                        <td className="py-4 px-4 text-center">
                          {renderStatusBadge(item.status_pagamento, item.data_vencimento)}
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-3">
                            {item.status_pagamento.toLowerCase() !== "pago" && (
                              <button
                                onClick={() => handleLiquidado(item.id)}
                                disabled={actionLoading[item.id]}
                                type="button"
                                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                                  actionLoading[item.id]
                                    ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                                    : "text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 cursor-pointer"
                                }`}
                                title="Liquidar Fatura"
                              >
                                {actionLoading[item.id] ? "Processando..." : "✓ Recebido"}
                              </button>
                            )}
                            <button
                              onClick={() => handleExcluir(item.id)}
                              disabled={actionLoading[item.id]}
                              type="button"
                              className={`text-xs font-bold ml-1 transition-opacity ${
                                actionLoading[item.id]
                                  ? "text-slate-600 cursor-not-allowed opacity-50"
                                  : "text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                              }`}
                              title="Remover Transação"
                            >
                              {actionLoading[item.id] ? "..." : "✕"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Botão Carregar Mais */}
            {hasMore && !loading && (
              <div className="text-center mt-6 pb-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 bg-[#0a192f] hover:bg-[#0f2444] text-[#d4af37] border border-[#d4af37]/60 hover:border-[#d4af37] px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-lg hover:shadow-[#d4af37]/5 cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-800 border-t-[#d4af37] rounded-full animate-spin"></div>
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄 Carregar mais lançamentos...</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}

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
