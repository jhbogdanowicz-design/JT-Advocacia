import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

interface DocumentoRegra {
  id: string;
  nome: string;
  obrigatorio: boolean;
}

const DOCUMENTOS_PADRAO: Record<string, DocumentoRegra[]> = {
  consumidor: [
    { id: "doc_id", nome: "RG / CPF do Titular", obrigatorio: true },
    { id: "doc_residencia", nome: "Comprovante de Residência (atualizado)", obrigatorio: true },
    { id: "doc_prova", nome: "Notas Fiscais, Prints de Conversas ou Protocolos", obrigatorio: true },
  ],
  trabalhista: [
    { id: "doc_id", nome: "RG / CPF do Reclamante", obrigatorio: true },
    { id: "doc_ctps", nome: "CTPS (Páginas de contrato e opção de FGTS)", obrigatorio: true },
    { id: "doc_trct", nome: "Termo de Rescisão (TRCT) ou 3 Últimos Holerites", obrigatorio: false },
    { id: "doc_fgts", nome: "Extrato do FGTS Atualizado", obrigatorio: true },
  ],
  medico: [
    { id: "doc_id", nome: "RG / CPF do Paciente/Titular", obrigatorio: true },
    { id: "doc_laudos", nome: "Laudos Médicos, Exames e Relatórios Clínicos", obrigatorio: true },
    { id: "doc_prontuario", nome: "Cópia Integral do Prontuário Médico", obrigatorio: true },
    { id: "doc_financeiro", nome: "Orçamentos, Notas Fiscais ou Comprovantes de Gastos", obrigatorio: false },
  ],
  general: [
    { id: "doc_id", nome: "RG / CPF do Requerente", obrigatorio: true },
    { id: "doc_residencia", nome: "Comprovante de Residência", obrigatorio: true },
    { id: "doc_procuracao", nome: "Procuração / Declaração de Hipossuficiência", obrigatorio: true },
    { id: "doc_provas_gerais", nome: "Documentos e Provas Gerais do Caso", obrigatorio: false },
  ]
};

interface ChecklistDocumentosProps {
  clienteId: string;
  areaInteresse: string;
}

export default function ChecklistDocumentos({ clienteId, areaInteresse }: ChecklistDocumentosProps) {
  const [statusDocs, setStatusDocs] = useState<Record<string, "pendente" | "recebido">>({});
  const [loading, setLoading] = useState(false);

  // Normaliza e escolhe a lista de documentos com base na área de interesse
  const docsNecessarios = useMemo(() => {
    const area = (areaInteresse || "").toLowerCase();
    if (area.includes("consumidor") || area.includes("consumo")) {
      return DOCUMENTOS_PADRAO.consumidor;
    }
    if (area.includes("trabalhista") || area.includes("trabalho")) {
      return DOCUMENTOS_PADRAO.trabalhista;
    }
    if (area.includes("médico") || area.includes("medico") || area.includes("saúde") || area.includes("saude")) {
      return DOCUMENTOS_PADRAO.medico;
    }
    return DOCUMENTOS_PADRAO.general;
  }, [areaInteresse]);

  // Carrega os dados salvos do checklist no banco
  useEffect(() => {
    if (!clienteId) return;

    const loadStatuses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("checklist_documentos")
          .select("doc_id, status")
          .eq("cliente_id", clienteId);

        if (error) throw error;

        const statusMap: Record<string, "pendente" | "recebido"> = {};
        (data || []).forEach((item: any) => {
          statusMap[item.doc_id] = item.status as "pendente" | "recebido";
        });
        setStatusDocs(statusMap);
      } catch (err: any) {
        console.error("Erro ao carregar checklist:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStatuses();
  }, [clienteId]);

  // Atualiza/salva o estado do checklist no banco
  const handleToggle = async (docId: string, checked: boolean) => {
    const novoStatus = checked ? "recebido" : "pendente";

    // Atualização otimista do estado
    setStatusDocs((prev) => ({ ...prev, [docId]: novoStatus }));

    try {
      const { error } = await supabase
        .from("checklist_documentos")
        .upsert(
          {
            cliente_id: clienteId,
            doc_id: docId,
            status: novoStatus
          },
          {
            onConflict: "cliente_id,doc_id"
          }
        );

      if (error) throw error;
    } catch (err: any) {
      console.error("Erro ao salvar status do checklist:", err.message);
      alert("Falha ao salvar alteração. Tente novamente.");
      // Reverte o estado local em caso de falha
      setStatusDocs((prev) => ({ ...prev, [docId]: checked ? "pendente" : "recebido" }));
    }
  };

  // Estatísticas de progresso
  const { total, concluidos, percentual } = useMemo(() => {
    const total = docsNecessarios.length;
    const concluidos = docsNecessarios.filter((doc) => statusDocs[doc.id] === "recebido").length;
    const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    return { total, concluidos, percentual };
  }, [docsNecessarios, statusDocs]);

  return (
    <div className="w-full bg-slate-55/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mt-3 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <div>
          <h4 className="text-sm font-extrabold text-[#0f1e36] dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
            📂 Auditoria de Documentação
          </h4>
          <p className="text-[11px] text-slate-400">Controle de pendências e arquivos necessários para a ação</p>
        </div>
        <span className="text-[10px] font-bold bg-[#d4af37]/15 text-[#b8962e] px-2.5 py-1 rounded border border-[#d4af37]/25 w-fit uppercase tracking-wider select-none">
          Módulo de Auditoria
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-5 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/80">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-650 dark:text-slate-400">Progresso da documentação:</span>
          <span className="font-mono font-bold text-[#b8962e] dark:text-[#d4af37]">
            {concluidos} de {total} ({percentual}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 shadow-inner overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#b8962e] to-[#d4af37] h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${percentual}%` }}
          ></div>
        </div>
      </div>

      {/* Body Checklist List */}
      {loading ? (
        <div className="flex justify-center items-center py-4 gap-2">
          <div className="w-3.5 h-3.5 border-2 border-slate-200 dark:border-slate-800 border-t-[#d4af37] rounded-full animate-spin"></div>
          <span className="text-xs text-slate-450">Sincronizando auditoria jurídica...</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {docsNecessarios.map((doc) => {
            const estaOk = statusDocs[doc.id] === "recebido";
            return (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 select-none
                  ${estaOk
                    ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                    : "bg-white dark:bg-slate-850/50 border-slate-200 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`chk-${doc.id}`}
                    checked={estaOk}
                    onChange={(e) => handleToggle(doc.id, e.target.checked)}
                    className="h-4 w-4 rounded text-[#0f1e36] dark:text-[#d4af37] focus:ring-[#d4af37] border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                  />
                  <label
                    htmlFor={`chk-${doc.id}`}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {doc.nome}
                    {doc.obrigatorio && <span className="text-rose-500 ml-1 font-bold">*</span>}
                  </label>
                </div>

                <span
                  className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider
                    ${estaOk
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-250 dark:border-amber-900/30"
                    }`}
                >
                  {estaOk ? "✓ OK" : "Pendente"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
