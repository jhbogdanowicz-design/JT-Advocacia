import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

interface ClienteInfo {
  id: string;
  nome: string;
}

interface ProcessoInfo {
  id: string;
  numero_processo: string;
  titulo: string;
  status: string;
}

interface ModalLancamentoFinanceiroProps {
  clienteId?: string; // Pre-selecionar prontuário se fornecido
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalLancamentoFinanceiro: React.FC<ModalLancamentoFinanceiroProps> = ({
  clienteId,
  onClose,
  onSuccess,
}) => {
  const [clientes, setClientes] = useState<ClienteInfo[]>([]);
  const [processosMap, setProcessosMap] = useState<Record<string, ProcessoInfo[]>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Estados do formulário
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>("");
  const [processoSelecionadoId, setProcessoSelecionadoId] = useState<string>("");
  const [categoriaVerba, setCategoriaVerba] = useState<"honorario" | "indenizacao" | "custas">("honorario");
  
  const [tipoHonorario, setTipoHonorario] = useState<string>("fixo");
  const [valorTotalInput, setValorTotalInput] = useState<string>("");
  
  // Condenação / Verba Indenizatória
  const [valorBrutoInput, setValorBrutoInput] = useState<string>("");
  const [porcentagemBanca, setPorcentagemBanca] = useState<number>(20); // 20% padrão
  
  const [dataVencimento, setDataVencimento] = useState<string>("");
  const [statusInicial, setStatusInicial] = useState<string>("pendente");

  // Formatar Moeda para Mask BRL (R$)
  const formatarValorMoeda = (valorRaw: string): string => {
    const apenasNumeros = valorRaw.replace(/\D/g, "");
    if (!apenasNumeros) return "";
    const valorFloat = parseFloat(apenasNumeros) / 100;
    return valorFloat.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const handleValorTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorTotalInput(formatarValorMoeda(e.target.value));
  };

  const handleValorBrutoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorBrutoInput(formatarValorMoeda(e.target.value));
  };

  // Obter valor flutuante da string de moeda R$
  const obterValorFloat = (valorString: string): number => {
    const apenasNumeros = valorString.replace(/\D/g, "");
    return parseFloat(apenasNumeros) / 100 || 0;
  };

  // Cálculo dinâmico de retenção estimada do escritório
  const calculoRetencao = useMemo(() => {
    const bruto = obterValorFloat(valorBrutoInput);
    const taxa = porcentagemBanca / 100;
    const retencao = bruto * taxa;
    const repasseCliente = bruto * (1 - taxa);
    return { retencao, repasseCliente };
  }, [valorBrutoInput, porcentagemBanca]);

  // Carregar dados de Clientes e Processos do Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Buscar todos os clientes
        const { data: clientsData, error: clientErr } = await supabase
          .from("clientes")
          .select("id, nome")
          .order("nome", { ascending: true });

        if (clientErr) throw clientErr;
        setClientes(clientsData || []);

        // 2. Buscar todos os processos para popular o mapeamento de processos por cliente
        const { data: procsData, error: procErr } = await supabase
          .from("processos")
          .select("id, cliente_id, numero_processo, titulo, status");

        if (procErr) throw procErr;

        const pMap: Record<string, ProcessoInfo[]> = {};
        (procsData || []).forEach((p) => {
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

        // Se clienteId foi passado por prop, trava e pré-seleciona ele
        if (clienteId) {
          setClienteSelecionadoId(clienteId);
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados do modal financeiro:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clienteId]);

  // Processos do cliente ativo
  const processosAtivos = useMemo(() => {
    if (!clienteSelecionadoId) return [];
    return processosMap[clienteSelecionadoId] || [];
  }, [clienteSelecionadoId, processosMap]);

  // Submeter o Lançamento
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteSelecionadoId) {
      alert("Por favor, vincule um Prontuário de Cliente.");
      return;
    }

    if (!dataVencimento) {
      alert("Por favor, preencha a data de vencimento.");
      return;
    }

    // Calcula valor a ser gravado (para condenação, grava a taxa de êxito real do escritório)
    let valorFinal = 0;
    if (categoriaVerba === "indenizacao") {
      valorFinal = calculoRetencao.retencao;
    } else {
      valorFinal = obterValorFloat(valorTotalInput);
    }

    if (valorFinal <= 0) {
      alert("O valor total da transação patrimonial deve ser maior que zero.");
      return;
    }

    // Determina o tipo correspondente à restrição física no banco
    let tipoHonorarioBanco = "fixo";
    if (categoriaVerba === "indenizacao") {
      tipoHonorarioBanco = "êxito";
    } else if (categoriaVerba === "honorario") {
      tipoHonorarioBanco = tipoHonorario;
    } // Custas -> tipo 'fixo'

    try {
      setSaving(true);

      const novoLancamento = {
        cliente_id: clienteSelecionadoId,
        processo_id: processoSelecionadoId || null,
        valor_total: valorFinal,
        tipo_honorario: tipoHonorarioBanco.toLowerCase(),
        status_pagamento: statusInicial,
        data_vencimento: dataVencimento
      };

      const { error: insertErr } = await supabase
        .from("financeiro")
        .insert([novoLancamento]);

      if (insertErr) throw insertErr;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar lançamento financeiro:", err.message);
      alert("Erro ao salvar lançamento financeiro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 relative">
        
        {/* Header */}
        <div className="bg-[#0b0f19] px-6 py-4 border-b border-[#d4af37]/35 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[#d4af37] text-lg">💰</span>
            <h3 className="font-playfair font-semibold text-slate-100 text-lg tracking-wide">
              Lançamento de Honorários Contratuais
            </h3>
          </div>
          <button 
            onClick={onClose} 
            type="button" 
            className="text-slate-400 hover:text-white font-bold text-lg p-1 transition-colors focus:outline-none"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col justify-center items-center space-y-3">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-[#d4af37] rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Consultando cadastros do prontuário...</p>
          </div>
        ) : (
          <form onSubmit={handleSalvar} className="p-6 space-y-4">
            
            {/* Categoria da Verba (Botões Horizontais) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Categoria da Movimentação
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategoriaVerba("honorario")}
                  className={`py-2 px-1 rounded-lg text-center text-xs font-semibold border transition-all ${
                    categoriaVerba === "honorario"
                      ? "bg-[#d4af37] text-[#070a13] border-[#d4af37] font-bold shadow"
                      : "bg-[#070a13] text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  Honorário
                </button>
                <button
                  type="button"
                  onClick={() => setCategoriaVerba("indenizacao")}
                  className={`py-2 px-1 rounded-lg text-center text-xs font-semibold border transition-all ${
                    categoriaVerba === "indenizacao"
                      ? "bg-[#d4af37] text-[#070a13] border-[#d4af37] font-bold shadow"
                      : "bg-[#070a13] text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  Condenação
                </button>
                <button
                  type="button"
                  onClick={() => setCategoriaVerba("custas")}
                  className={`py-2 px-1 rounded-lg text-center text-xs font-semibold border transition-all ${
                    categoriaVerba === "custas"
                      ? "bg-[#d4af37] text-[#070a13] border-[#d4af37] font-bold shadow"
                      : "bg-[#070a13] text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  Reembolso Custas
                </button>
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Prontuário do Cliente *
              </label>
              <select
                value={clienteSelecionadoId}
                onChange={(e) => {
                  setClienteSelecionadoId(e.target.value);
                  setProcessoSelecionadoId(""); // Reseta processo
                }}
                disabled={!!clienteId} // Trava se aberto na ficha de cliente
                required
                className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37] disabled:opacity-50 cursor-pointer"
              >
                <option value="">Selecione o prontuário do cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Processo (Filtrado) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Processo Vinculado
              </label>
              <select
                value={processoSelecionadoId}
                onChange={(e) => setProcessoSelecionadoId(e.target.value)}
                disabled={!clienteSelecionadoId}
                className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37] disabled:opacity-40 cursor-pointer"
              >
                <option value="">
                  {clienteSelecionadoId 
                    ? "Geral (Sem vínculo a processo específico)" 
                    : "Escolha um cliente acima para carregar processos..."}
                </option>
                {processosAtivos.map((p) => (
                  <option key={p.id} value={p.id}>
                    📂 {p.titulo} ({p.numero_processo}) [{p.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-campos: Honorário Contratual */}
            {categoriaVerba === "honorario" && (
              <div className="grid grid-cols-2 gap-4 animate-slideDown">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tipo Honorário
                  </label>
                  <select
                    value={tipoHonorario}
                    onChange={(e) => setTipoHonorario(e.target.value)}
                    className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="fixo">📜 Fixo / Contratual</option>
                    <option value="mensal">💼 Mensal / Assessoria</option>
                    <option value="êxito">🏆 Taxa de Êxito</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Valor Cobrado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={valorTotalInput}
                    onChange={handleValorTotalChange}
                    className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#d4af37] font-mono"
                  />
                </div>
              </div>
            )}

            {/* Sub-campos: Verba Indenizatória */}
            {categoriaVerba === "indenizacao" && (
              <div className="space-y-4 animate-slideDown">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Condenação / Valor Bruto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="R$ 0,00"
                      value={valorBrutoInput}
                      onChange={handleValorBrutoChange}
                      className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#d4af37] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Taxa Êxito Banca (%)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={porcentagemBanca}
                        onChange={(e) => setPorcentagemBanca(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37] font-mono pr-8"
                      />
                      <span className="absolute right-4 text-xs font-bold text-slate-500 font-mono">%</span>
                    </div>
                  </div>
                </div>

                {/* Box de Retenção */}
                <div className="bg-[#070a13] border border-[#d4af37]/30 rounded-xl p-4 space-y-2">
                  <span className="text-[9.5px] font-bold text-[#d4af37] tracking-widest uppercase">
                    📐 Retenção Patrimonial da Banca
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 font-light">Cota do Escritório ({porcentagemBanca}%):</span>
                      <p className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                        {formatarValorMoeda((calculoRetencao.retencao * 100).toFixed(0))}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-light">Repasse ao Cliente ({100 - porcentagemBanca}%):</span>
                      <p className="font-mono font-bold text-blue-400 text-sm mt-0.5">
                        {formatarValorMoeda((calculoRetencao.repasseCliente * 100).toFixed(0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-campos: Reembolso de Custas */}
            {categoriaVerba === "custas" && (
              <div className="grid grid-cols-2 gap-4 animate-slideDown">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Valor das Custas *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={valorTotalInput}
                    onChange={handleValorTotalChange}
                    className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#d4af37] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tipo de Custa
                  </label>
                  <select
                    className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                  >
                    <option>Custas de Distribuição</option>
                    <option>Perícia Técnica Judicial</option>
                    <option>Custas de Diligência / Viagem</option>
                    <option>Cópia de Autos / Emolumentos</option>
                  </select>
                </div>
              </div>
            )}

            {/* Vencimento e Status Inicial */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Vencimento *
                </label>
                <input
                  type="date"
                  required
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Status Inicial
                </label>
                <select
                  value={statusInicial}
                  onChange={(e) => setStatusInicial(e.target.value)}
                  className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="pendente">🟡 Pendente</option>
                  <option value="pago">🟢 Pago (Liquidado)</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#d4af37] text-[#070a13] hover:bg-[#f3e5ab] px-5 py-2.5 rounded-lg text-xs font-extrabold transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-40"
              >
                {saving ? "Salvando..." : "Confirmar Lançamento"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
