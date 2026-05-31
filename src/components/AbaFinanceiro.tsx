import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ModalLancamentoFinanceiro } from "./ModalLancamentoFinanceiro";

interface AbaFinanceiroProps {
  clienteId: string;
}

interface LancamentoFinanceiro {
  id: string;
  cliente_id: string;
  processo_id?: string | null;
  valor_total: number;
  tipo_honorario: string;
  status_pagamento: string;
  data_vencimento: string;
  created_at: string;
  processos?: { titulo: string } | null;
}

function getAgendaStyle(tipo: string): { textClass: string } {
  const t = tipo.toLowerCase();
  if (t === "êxito" || t === "exito") return { textClass: "text-amber-500 dark:text-amber-400" };
  if (t === "mensal") return { textClass: "text-blue-600 dark:text-blue-400" };
  return { textClass: "text-emerald-600 dark:text-emerald-400" };
}

function formatarDataBr(dataStr: string): string {
  if (!dataStr) return "";
  const partes = dataStr.split("-");
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return new Date(dataStr).toLocaleDateString("pt-BR");
}

function formatarBrl(num: number): string {
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

export const AbaFinanceiro: React.FC<AbaFinanceiroProps> = ({ clienteId }) => {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const pageSize = 50;

  const fetchLancamentos = async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

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
          processos ( titulo )
        `)
        .eq("cliente_id", clienteId)
        .order("data_vencimento", { ascending: false })
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

      if (finErr) throw finErr;

      const list: LancamentoFinanceiro[] = (data || []).map((item: any) => {
        const processosObj = Array.isArray(item.processos) ? item.processos[0] : item.processos;
        return { ...item, processos: processosObj || null };
      });

      setLancamentos(prev => (append ? [...prev, ...list] : list));
      setHasMore(list.length >= pageSize);
    } catch (err: any) {
      console.error("Erro ao carregar extrato de lançamentos:", err.message);
      setError("Falha ao carregar o extrato de lançamentos.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (clienteId) {
      setPage(0);
      fetchLancamentos(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLancamentos(next, true);
  };

  const handleMarcarPago = async (id: string) => {
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
      alert("Erro ao atualizar o status do honorário: " + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleExcluirLancamento = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este lançamento permanentemente?")) return;
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      const { error: deleteErr } = await supabase
        .from("financeiro")
        .delete()
        .eq("id", id);
      if (deleteErr) throw deleteErr;
      setLancamentos(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Erro ao deletar lançamento financeiro: " + err.message);
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pago") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          ● Pago
        </span>
      );
    } else if (s === "atrasado") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 animate-pulse">
          ● Inadimplente
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
          ● Pendente
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* EXTRATO FINANCEIRO */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-md">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="font-semibold text-[#0f1e36] dark:text-slate-100 text-sm tracking-wide">
                Extrato Financeiro do Cliente
              </h3>
            </div>
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-0.5 rounded-full">
              {lancamentos.length} lançamentos
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#0a192f] hover:bg-[#0f2444] text-[#d4af37] border border-[#d4af37]/60 hover:border-[#d4af37] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer focus:outline-none"
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
            + Lançar Honorário
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-3">
            <Spinner className="w-8 h-8 text-[#d4af37]" />
            <p className="text-xs text-slate-500">Buscando histórico financeiro...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 dark:text-red-400 text-xs font-medium">
            ⚠️ {error}
          </div>
        ) : lancamentos.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-center text-slate-400 text-xs font-light italic">
            Nenhum lançamento financeiro registrado para este cliente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <th className="py-3 px-4 font-semibold">Vencimento</th>
                  <th className="py-3 px-4 font-semibold">Tipo</th>
                  <th className="py-3 px-4 font-semibold">Processo</th>
                  <th className="py-3 px-4 font-semibold">Valor Total</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {lancamentos.map(item => {
                  const styleClass = getAgendaStyle(item.tipo_honorario);
                  const isLoading = !!actionLoading[item.id];
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Vencimento */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatarDataBr(item.data_vencimento)}
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold capitalize ${styleClass.textClass}`}>
                          {item.tipo_honorario}
                        </span>
                      </td>

                      {/* Processo */}
                      <td className="py-3.5 px-4 max-w-[150px] truncate text-slate-500 dark:text-slate-400">
                        {item.processos ? (
                          item.processos.titulo
                        ) : (
                          <span className="italic font-light text-slate-400 dark:text-slate-600">
                            Sem vínculo
                          </span>
                        )}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3.5 px-4 font-bold font-mono text-[#0f1e36] dark:text-slate-200">
                        {formatarBrl(item.valor_total)}
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
                              onClick={() => handleMarcarPago(item.id)}
                              disabled={isLoading}
                              type="button"
                              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                                isLoading
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                  : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 cursor-pointer"
                              }`}
                              title="Marcar como Pago"
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
                            onClick={() => handleExcluirLancamento(item.id)}
                            disabled={isLoading}
                            type="button"
                            className={`text-xs font-bold transition-opacity ${
                              isLoading
                                ? "text-slate-400 cursor-not-allowed opacity-50"
                                : "text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                            }`}
                            title="Excluir lançamento"
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
        {hasMore && !loading && lancamentos.length >= pageSize && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 bg-[#0a192f] hover:bg-[#0f2444] text-[#d4af37] border border-[#d4af37]/60 hover:border-[#d4af37] px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-lg cursor-pointer disabled:opacity-50"
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

      {isModalOpen && (
        <ModalLancamentoFinanceiro
          clienteId={clienteId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => fetchLancamentos(0, false)}
        />
      )}
    </div>
  );
};
