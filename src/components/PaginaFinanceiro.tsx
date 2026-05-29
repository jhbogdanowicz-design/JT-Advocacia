import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

interface ClienteInfo {
  id: string;
  nome: string;
  whatsapp?: string;
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
  tipo_honorario: string; // 'fixo' | 'mensal' | 'êxito' ...
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos filtros
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [monthFilter, setMonthFilter] = useState<string>("todos");

  // Buscar todos os honorários do banco de dados
  const fetchAllLancamentos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Busca todos os lançamentos agregando relações de clientes e processos
      const { data, error: finErr } = await supabase
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
          clientes ( id, nome, whatsapp ),
          processos ( id, numero_processo, titulo, status )
        `)
        .order("data_vencimento", { ascending: false });

      if (finErr) throw finErr;

      const list: LancamentoGeral[] = (data || []).map((item: any) => {
        const clientesObj = Array.isArray(item.clientes) ? item.clientes[0] : item.clientes;
        const processosObj = Array.isArray(item.processos) ? item.processos[0] : item.processos;
        return {
          ...item,
          clientes: clientesObj || null,
          processos: processosObj || null
        };
      });

      setLancamentos(list);
    } catch (err: any) {
      console.error("Erro ao carregar lançamentos financeiros gerais:", err.message);
      setError(err.message || "Erro de conexão ao carregar lançamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLancamentos();
  }, []);

  // Lógica de Agregação Financeira em Tempo Real
  const metricas = useMemo(() => {
    const agora = new Date();
    const anoCorrente = agora.getFullYear();
    const mesCorrente = agora.getMonth(); // 0-indexed

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split("T")[0];

    const proximo30Dias = new Date();
    proximo30Dias.setDate(proximo30Dias.getDate() + 30);
    proximo30Dias.setHours(23, 59, 59, 999);
    const proximo30DiasStr = proximo30Dias.toISOString().split("T")[0];

    let totalRecebido = 0;
    let totalInadimplencia = 0;
    let totalProjecao = 0;

    lancamentos.forEach((item) => {
      const valor = parseFloat(item.valor_total as any) || 0;
      const status = item.status_pagamento.toLowerCase();
      
      const date = new Date(item.data_vencimento);
      const dataVencAno = date.getUTCFullYear();
      const dataVencMes = date.getUTCMonth();

      // 1. Total Recebido no Mês: Pago e vencendo no mês/ano atual
      if (status === "pago" && dataVencAno === anoCorrente && dataVencMes === mesCorrente) {
        totalRecebido += valor;
      }

      // 2. Inadimplência: Vencido e não pago
      if (status !== "pago" && item.data_vencimento < hojeStr) {
        totalInadimplencia += valor;
      }

      // 3. Projeção de Caixa (Próximos 30 dias): Pendente a vencer no futuro dentro de 30 dias
      if (status !== "pago" && item.data_vencimento >= hojeStr && item.data_vencimento <= proximo30DiasStr) {
        totalProjecao += valor;
      }
    });

    return { totalRecebido, totalInadimplencia, totalProjecao };
  }, [lancamentos]);

  // Filtragem da tabela em tempo real
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((item) => {
      // 1. Busca por nome do cliente ou processo
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        (item.clientes?.nome || "").toLowerCase().includes(searchLower) ||
        (item.processos?.titulo || "").toLowerCase().includes(searchLower) ||
        (item.processos?.numero_processo || "").toLowerCase().includes(searchLower);

      // 2. Filtro de Status
      const matchStatus = 
        statusFilter === "todos" || 
        item.status_pagamento.toLowerCase() === statusFilter.toLowerCase();

      // 3. Filtro de Mês
      let matchMonth = true;
      if (monthFilter !== "todos") {
        const d = new Date(item.data_vencimento);
        const mesIndex = d.getUTCMonth() + 1; // 1-indexed
        matchMonth = mesIndex.toString() === monthFilter;
      }

      return matchSearch && matchStatus && matchMonth;
    });
  }, [lancamentos, searchQuery, statusFilter, monthFilter]);

  // Registrar recebimento
  const handleMarcarComoPago = async (id: string) => {
    try {
      const { error: updateErr } = await supabase
        .from("financeiro")
        .update({ status_pagamento: "pago" })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // Atualizar reativamente a listagem
      setLancamentos(prev =>
        prev.map(item => item.id === id ? { ...item, status_pagamento: "pago" } : item)
      );
    } catch (err: any) {
      alert("Erro ao baixar honorário: " + err.message);
    }
  };

  // Excluir lançamento
  const handleExcluirLancamento = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este lançamento financeiro permanentemente?")) return;
    try {
      const { error: deleteErr } = await supabase
        .from("financeiro")
        .delete()
        .eq("id", id);

      if (deleteErr) throw deleteErr;

      setLancamentos(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir lançamento: " + err.message);
    }
  };

  const formatarBrl = (num: number): string => {
    return num.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const formatarDataBr = (dataStr: string): string => {
    if (!dataStr) return "";
    const partes = dataStr.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return new Date(dataStr).toLocaleDateString("pt-BR");
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pago") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ● Pago
        </span>
      );
    } else if (s === "atrasado") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          ● Atrasado
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

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 p-6 space-y-6">
      
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💼</span>
            <h1 className="font-playfair font-bold text-2xl tracking-wide text-slate-100">
              Fluxo de Caixa & Honorários
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-light">
            Painel unificado de controle geral e auditoria de faturamento do escritório.
          </p>
        </div>

        {/* FILTROS RÁPIDOS E BUSCA */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#d4af37] w-[180px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#d4af37] cursor-pointer"
          >
            <option value="todos">🔍 Todos Status</option>
            <option value="pago">🟢 Pago</option>
            <option value="pendente">🟡 Pendente</option>
            <option value="atrasado">🔴 Atrasado</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#d4af37] cursor-pointer"
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

      {/* METRICAS FINANCEIRAS DO DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FATURAMENTO REALIZADO */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg pointer-events-none"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Recebido (Mês)</span>
            <h2 className="text-2xl font-extrabold font-mono text-emerald-400">{formatarBrl(metricas.totalRecebido)}</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-light mt-3.5">📅 Faturamento quitado no mês de referência corrente.</p>
        </div>

        {/* INADIMPLÊNCIA / ATRASADOS */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-lg pointer-events-none"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Inadimplência</span>
            <h2 className="text-2xl font-extrabold font-mono text-red-400">{formatarBrl(metricas.totalInadimplencia)}</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-light mt-3.5">⚠️ Honorários com vencimento vencido e não recebidos.</p>
        </div>

        {/* PREVISÃO DE ENTRADA (30 dias) */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#d4af37]/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4af37]/5 rounded-full blur-lg pointer-events-none"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Previsão de Entrada</span>
            <h2 className="text-2xl font-extrabold font-mono text-[#d4af37]">{formatarBrl(metricas.totalProjecao)}</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-light mt-3.5">🔮 Fluxo de recebimento previsto para os próximos 30 dias.</p>
        </div>
      </div>

      {/* TABELA DE LANÇAMENTOS UNIFICADOS */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5.5 space-y-4 shadow-xl">
        <div className="flex justify-between items-center pb-3.5 border-b border-slate-800/80">
          <h3 className="font-playfair font-bold text-slate-200 text-sm tracking-wide">
            Lançamentos de Honorários
          </h3>
          <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 font-bold px-3 py-1 rounded-full">
            {lancamentosFiltrados.length} lançamentos encontrados
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center space-y-3">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-[#d4af37] rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Compilando extrato de faturamento geral...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 text-xs font-semibold">
            ⚠️ {error}
          </div>
        ) : lancamentosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs font-light italic">
            Nenhum honorário encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80 bg-[#070a13]/30">
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Processo Vinculado</th>
                  <th className="py-3 px-4 font-semibold">Tipo</th>
                  <th className="py-3 px-4 font-semibold">Valor</th>
                  <th className="py-3 px-4 font-semibold">Vencimento</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {lancamentosFiltrados.map((item) => {
                  // Mapeia se o processo está concluído/ganho para alertar o êxito
                  const isExito = item.tipo_honorario.toLowerCase() === "êxito" || item.tipo_honorario.toLowerCase() === "exito";
                  const procStatus = item.processos?.status?.toLowerCase();
                  const isCobravel = isExito && (procStatus === "arquivado" || procStatus === "em acordo" || procStatus === "suspenso");

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-950/25 transition-colors group"
                    >
                      {/* Cliente (Clicável redirecionando para ficha com aba financeiro ativa) */}
                      <td className="py-3.5 px-4 font-bold text-[#d4af37] hover:underline cursor-pointer">
                        <button
                          onClick={() => onNavigateToCliente && onNavigateToCliente(item.cliente_id, "financeiro")}
                          className="bg-none border-none p-0 text-left cursor-pointer hover:text-[#f3e5ab] text-xs font-bold focus:outline-none"
                        >
                          {item.clientes?.nome || "Cliente Removido"}
                        </button>
                      </td>

                      {/* Processo Vinculado */}
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {item.processos ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-300 font-bold truncate max-w-[200px]">{item.processos.titulo}</span>
                            <span className="font-mono text-[9.5px] text-slate-500">{item.processos.numero_processo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-light italic">Sem vínculo</span>
                        )}
                      </td>

                      {/* Tipo + Alerta inteligente de Êxito */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="capitalize font-semibold text-slate-200">
                            {item.tipo_honorario}
                          </span>
                          {isCobravel && (
                            <span 
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 border border-amber-500/50 text-[#d4af37] animate-pulse" 
                              title="Processo ganho/concluído! O valor de êxito já está liberado para cobrança."
                            >
                              💰 Êxito Cobrável!
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {formatarBrl(item.valor_total)}
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        {formatarDataBr(item.data_vencimento)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {renderStatusBadge(item.status_pagamento)}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {item.status_pagamento.toLowerCase() !== "pago" && (
                            <button
                              onClick={() => handleMarcarComoPago(item.id)}
                              type="button"
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                              title="Marcar como Pago"
                            >
                              ✓ Recebido
                            </button>
                          )}
                          <button
                            onClick={() => handleExcluirLancamento(item.id)}
                            type="button"
                            className="text-xs text-red-500 hover:text-red-400 font-bold ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Deletar lançamento permanentemente"
                          >
                            ✕
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
      </div>

    </div>
  );
};
