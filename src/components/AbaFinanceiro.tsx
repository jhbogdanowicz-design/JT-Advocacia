import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface AbaFinanceiroProps {
  clienteId: string;
}

interface ProcessoOption {
  id: string;
  titulo: string;
  numero_processo?: string;
}

interface LancamentoFinanceiro {
  id: string;
  cliente_id: string;
  processo_id?: string | null;
  valor_total: number;
  tipo_honorario: string; // 'fixo' | 'mensal' | 'êxito' | 'Fixo' | 'Mensal' | 'Êxito'
  status_pagamento: string; // 'pago' | 'pendente' | 'atrasado' | 'Pago' | 'Pendente' | 'Atrasado'
  data_vencimento: string;
  created_at: string;
  processos?: {
    titulo: string;
  } | null;
}

export const AbaFinanceiro: React.FC<AbaFinanceiroProps> = ({ clienteId }) => {
  // Estados para formulário
  const [tipoHonorario, setTipoHonorario] = useState<string>("Fixo");
  const [valorTotalInput, setValorTotalInput] = useState<string>("");
  const [dataVencimento, setDataVencimento] = useState<string>("");
  const [processoId, setProcessoId] = useState<string>("");
  
  // Lista de processos do cliente
  const [processos, setProcessos] = useState<ProcessoOption[]>([]);
  
  // Lista de lançamentos
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Formatar Moeda para Mask em tempo real (BRL R$)
  const formatarValorMoeda = (valorRaw: string): string => {
    const apenasNumeros = valorRaw.replace(/\D/g, "");
    if (!apenasNumeros) return "";
    const valorFloat = parseFloat(apenasNumeros) / 100;
    return valorFloat.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatado = formatarValorMoeda(raw);
    setValorTotalInput(formatado);
  };

  // Obter valor flutuante a partir da string monetária R$
  const obterValorFloat = (valorString: string): number => {
    const apenasNumeros = valorString.replace(/\D/g, "");
    return parseFloat(apenasNumeros) / 100 || 0;
  };

  // Buscar processos do cliente para popular o select
  const fetchProcessos = async () => {
    try {
      const { data, error: procErr } = await supabase
        .from("processos")
        .select("id, titulo, numero_processo")
        .eq("cliente_id", clienteId);

      if (procErr) throw procErr;
      setProcessos(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar processos do cliente:", err.message);
    }
  };

  // Buscar lançamentos financeiros
  const fetchLancamentos = async () => {
    try {
      setLoading(true);
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
        .order("data_vencimento", { ascending: false });

      if (finErr) throw finErr;

      // Sanitizar dados do Supabase
      const list: LancamentoFinanceiro[] = (data || []).map((item: any) => {
        const processosObj = Array.isArray(item.processos) ? item.processos[0] : item.processos;
        return {
          ...item,
          processos: processosObj || null
        };
      });

      setLancamentos(list);
    } catch (err: any) {
      console.error("Erro ao carregar extrato de lançamentos:", err.message);
      setError("Falha ao carregar o extrato de lançamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clienteId) {
      fetchProcessos();
      fetchLancamentos();
    }
  }, [clienteId]);

  // Enviar lançamento
  const handleSalvarHonorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorTotalInput) {
      alert("Por favor, preencha o valor do honorário.");
      return;
    }
    if (!dataVencimento) {
      alert("Por favor, informe a data de vencimento.");
      return;
    }

    const valorFloat = obterValorFloat(valorTotalInput);
    if (valorFloat <= 0) {
      alert("O valor total deve ser maior que zero.");
      return;
    }

    try {
      setSaving(true);
      
      // Criar payload de inserção
      // Nota: o Supabase JT-Advocacia armazena valores em minúsculo ('fixo', 'mensal', etc)
      const novoLancamento = {
        cliente_id: clienteId,
        processo_id: processoId || null,
        valor_total: valorFloat,
        tipo_honorario: tipoHonorario.toLowerCase(), // Salvar no padrão minúsculo do banco
        status_pagamento: "pendente", // Default pendente
        data_vencimento: dataVencimento
      };

      const { error: insertErr } = await supabase
        .from("financeiro")
        .insert([novoLancamento]);

      if (insertErr) throw insertErr;

      alert("Honorário lançado com sucesso!");
      // Resetar formulário
      setValorTotalInput("");
      setDataVencimento("");
      setProcessoId("");
      
      // Recarregar extrato
      fetchLancamentos();
    } catch (err: any) {
      alert("Erro ao salvar lançamento financeiro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Marcar como pago
  const handleMarcarPago = async (id: string) => {
    try {
      const { error: updateErr } = await supabase
        .from("financeiro")
        .update({ status_pagamento: "pago" })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // Feedback ágil no estado local
      setLancamentos(prev =>
        prev.map(item => item.id === id ? { ...item, status_pagamento: "pago" } : item)
      );
    } catch (err: any) {
      alert("Erro ao atualizar o status do honorário: " + err.message);
    }
  };

  // Excluir lançamento
  const handleExcluirLancamento = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este lançamento permanentemente?")) return;
    try {
      const { error: deleteErr } = await supabase
        .from("financeiro")
        .delete()
        .eq("id", id);

      if (deleteErr) throw deleteErr;

      setLancamentos(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Erro ao deletar lançamento financeiro: " + err.message);
    }
  };

  // Retorna badges elegantes de acordo com o status
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

  // Utilitário para formatar datas DATE (YYYY-MM-DD) para brasileiro (DD/MM/YYYY)
  const formatarDataBr = (dataStr: string): string => {
    if (!dataStr) return "";
    const partes = dataStr.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return new Date(dataStr).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* SEÇÃO DUAL: FORMULÁRIO DE CADASTRO & EXTRATO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULÁRIO DE NOVO LANÇAMENTO */}
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg h-fit">
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-800">
            <span className="text-lg">💰</span>
            <h3 className="font-playfair font-bold text-slate-200 text-sm tracking-wide">
              Lançar Novo Honorário
            </h3>
          </div>

          <form onSubmit={handleSalvarHonorario} className="space-y-4.5">
            {/* Tipo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Honorário</label>
              <select
                value={tipoHonorario}
                onChange={(e) => setTipoHonorario(e.target.value)}
                className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <option value="Fixo">Fixo</option>
                <option value="Mensal">Mensal</option>
                <option value="Êxito">Êxito</option>
              </select>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Valor Total</label>
              <input
                type="text"
                required
                placeholder="R$ 0,00"
                value={valorTotalInput}
                onChange={handleValorChange}
                className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#d4af37] font-mono"
              />
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Data de Vencimento</label>
              <input
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Processo Opcional */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Processo Vinculado (Opcional)</label>
              <select
                value={processoId}
                onChange={(e) => setProcessoId(e.target.value)}
                className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <option value="">Nenhum processo</option>
                {processos.map((proc) => (
                  <option key={proc.id} value={proc.id}>
                    {proc.titulo} {proc.numero_processo ? `(${proc.numero_processo})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#d4af37] text-[#070a13] hover:bg-[#f3e5ab] py-2.5 rounded-lg text-xs font-semibold transition-all shadow-md disabled:opacity-40"
            >
              {saving ? "Salvando..." : "💾 Lançar Honorário"}
            </button>
          </form>
        </div>

        {/* TABELA DE EXTRATO FINANCEIRO */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg flex flex-col">
          <div className="flex justify-between items-center pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="font-playfair font-bold text-slate-200 text-sm tracking-wide">
                Extrato Financeiro do Cliente
              </h3>
            </div>
            <span className="text-[11px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
              {lancamentos.length} lançamentos
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center py-20 space-y-3">
              <div className="w-8 h-8 border-4 border-slate-800 border-t-[#d4af37] rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500">Buscando histórico...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-400 text-xs font-medium">
              ⚠️ {error}
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="flex-grow flex items-center justify-center py-20 text-center text-slate-500 text-xs font-light italic">
              Nenhum lançamento financeiro registrado para este cliente.
            </div>
          ) : (
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800/80 bg-[#070a13]/30">
                    <th className="py-3 px-4 font-semibold">Vencimento</th>
                    <th className="py-3 px-4 font-semibold">Tipo</th>
                    <th className="py-3 px-4 font-semibold">Processo</th>
                    <th className="py-3 px-4 font-semibold">Valor Total</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {lancamentos.map((item) => {
                    const styleClass = getAgendaStyle(item.tipo_honorario);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-950/20 transition-colors group"
                      >
                        {/* Vencimento */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                          {formatarDataBr(item.data_vencimento)}
                        </td>

                        {/* Tipo */}
                        <td className="py-3.5 px-4">
                          <span className={`font-semibold capitalize ${styleClass.textClass}`}>
                            {item.tipo_honorario}
                          </span>
                        </td>

                        {/* Processo */}
                        <td className="py-3.5 px-4 max-w-[150px] truncate text-slate-400">
                          {item.processos ? item.processos.titulo : <span className="text-slate-600 font-light italic">Sem vínculo</span>}
                        </td>

                        {/* Valor Total */}
                        <td className="py-3.5 px-4 font-bold font-mono text-slate-200">
                          {item.valor_total.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
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
                              className="text-xs text-red-500 hover:text-red-400 font-bold ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Excluir lançamento"
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

    </div>
  );
};

// Helper rápido para fins tipográficos de estilos
function getAgendaStyle(tipo: string) {
  const t = tipo.toLowerCase();
  if (t === "êxito" || t === "exito") {
    return { textClass: "text-amber-400" };
  } else if (t === "mensal") {
    return { textClass: "text-blue-400" };
  } else {
    return { textClass: "text-emerald-400" }; // Fixo
  }
}
