import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface CardsFinanceirosProps {
  // Opcional para forçar atualização se um novo lançamento for realizado externamente
  refreshTrigger?: number;
}

interface LancamentoFinanceiro {
  valor_total: number;
  status_pagamento: string;
  data_vencimento: string;
}

export const CardsFinanceiros: React.FC<CardsFinanceirosProps> = ({ refreshTrigger }) => {
  const [faturamentoMes, setFaturamentoMes] = useState<number>(0);
  const [inadimplencia, setInadimplencia] = useState<number>(0);
  const [projecaoCaixa, setProjecaoCaixa] = useState<number>(0);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinanceiroConsolidado = async () => {
    try {
      setLoading(true);
      setError(null);

      // Consulta Supabase - Graças ao RLS da tabela financeiro,
      // ele filtra automaticamente pelo ID do advogado autenticado
      const { data, error: finErr } = await supabase
        .from("financeiro")
        .select("valor_total, status_pagamento, data_vencimento");

      if (finErr) throw finErr;

      const list: LancamentoFinanceiro[] = data || [];

      // Parâmetros de Data Correntes
      const agora = new Date();
      const anoCorrente = agora.getFullYear();
      const mesCorrente = agora.getMonth(); // 0-indexed (0 = Jan, 4 = Mai, etc.)

      // Formatar data de hoje para comparação simples 'YYYY-MM-DD'
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().split("T")[0];

      // Projeção 30 dias
      const proximo30Dias = new Date();
      proximo30Dias.setDate(proximo30Dias.getDate() + 30);
      proximo30Dias.setHours(23, 59, 59, 999);
      const proximo30DiasStr = proximo30Dias.toISOString().split("T")[0];

      let sumFaturamento = 0;
      let sumInadimplencia = 0;
      let sumProjecao = 0;

      list.forEach((item) => {
        const valor = parseFloat(item.valor_total as any) || 0;
        const status = item.status_pagamento.toLowerCase();
        
        // Data de vencimento corrigida para o fuso UTC do banco para evitar desalinhamentos de fuso local
        const dataVenc = new Date(item.data_vencimento);
        const dataVencAno = dataVenc.getUTCFullYear();
        const dataVencMes = dataVenc.getUTCMonth();

        // 1. Faturamento do Mês: Pago e vencendo no mês/ano atual
        if (status === "pago" && dataVencAno === anoCorrente && dataVencMes === mesCorrente) {
          sumFaturamento += valor;
        }

        // 2. Inadimplência: Vencido no passado e não pago (pendente ou atrasado)
        if (status !== "pago" && item.data_vencimento < hojeStr) {
          sumInadimplencia += valor;
        }

        // 3. Projeção de Caixa: Pendente/Atrasado a vencer nos próximos 30 dias (futuro)
        if (status !== "pago" && item.data_vencimento >= hojeStr && item.data_vencimento <= proximo30DiasStr) {
          sumProjecao += valor;
        }
      });

      setFaturamentoMes(sumFaturamento);
      setInadimplencia(sumInadimplencia);
      setProjecaoCaixa(sumProjecao);
    } catch (err: any) {
      console.error("Erro ao consolidar estatísticas financeiras:", err.message);
      setError(err.message || "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceiroConsolidado();
  }, [refreshTrigger]);

  const formatarBrl = (num: number): string => {
    return num.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 h-[110px] flex flex-col justify-between">
            <div className="h-3 w-1/3 bg-slate-800 rounded"></div>
            <div className="h-6 w-1/2 bg-slate-800 rounded"></div>
            <div className="h-2.5 w-2/3 bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/15 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold text-center">
        ⚠️ Falha ao computar dados de saúde financeira do escritório: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* CARD 1 - FATURAMENTO DO MÊS */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5.5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg pointer-events-none group-hover:bg-emerald-500/10 transition-all"></div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Faturamento Recebido (Mês)
            </span>
            <span className="text-xs p-1 rounded bg-emerald-500/10 text-emerald-400">📈</span>
          </div>
          <h2 className="text-2xl font-extrabold font-mono text-emerald-400 tracking-tight">
            {formatarBrl(faturamentoMes)}
          </h2>
        </div>
        <p className="text-[10px] text-slate-500 font-light mt-4 flex items-center gap-1">
          <span>📅</span> Ref. aos honorários pagos do mês corrente.
        </p>
      </div>

      {/* CARD 2 - INADIMPLÊNCIA / ATRASADOS */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5.5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-lg pointer-events-none group-hover:bg-red-500/10 transition-all"></div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Inadimplência / Atrasados
            </span>
            <span className="text-xs p-1 rounded bg-red-500/10 text-red-400">📉</span>
          </div>
          <h2 className="text-2xl font-extrabold font-mono text-red-400 tracking-tight">
            {formatarBrl(inadimplencia)}
          </h2>
        </div>
        <p className="text-[10px] text-slate-500 font-light mt-4 flex items-center gap-1">
          <span>⚠️</span> Soma das parcelas com vencimento ultrapassado.
        </p>
      </div>

      {/* CARD 3 - PROJEÇÃO DE CAIXA */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5.5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#d4af37]/20 transition-all duration-300">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4af37]/5 rounded-full blur-lg pointer-events-none group-hover:bg-[#d4af37]/10 transition-all"></div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Projeção de Caixa (30 dias)
            </span>
            <span className="text-xs p-1 rounded bg-[#d4af37]/10 text-[#d4af37]">⚜️</span>
          </div>
          <h2 className="text-2xl font-extrabold font-mono text-[#d4af37] tracking-tight">
            {formatarBrl(projecaoCaixa)}
          </h2>
        </div>
        <p className="text-[10px] text-slate-500 font-light mt-4 flex items-center gap-1">
          <span>🔮</span> Receitas pendentes previstas para os próximos 30 dias.
        </p>
      </div>

    </div>
  );
};
