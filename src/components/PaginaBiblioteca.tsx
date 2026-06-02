import React, { useState } from "react";

export const PaginaBiblioteca: React.FC = () => {
  const [busca, setBusca] = useState("");

  const linksUteis = [
    {
      categoria: "📜 Legislação e Resoluções (Direito Médico)",
      itens: [
        { nome: "Código de Ética Médica (Resolução CFM nº 2.217/18)", url: "https://portal.cfm.org.br/" },
        { nome: "Lei do Ato Médico (Lei nº 12.842/13)", url: "https://www.planalto.gov.br/" },
        { nome: "Nova Resolução de Publicidade Médica (CFM nº 2.336/23)", url: "https://portal.cfm.org.br/" }
      ]
    },
    {
      categoria: "💼 Modelos e Templates de Suporte",
      itens: [
        { nome: "Modelo Base: Termo de Consentimento (TCLE) Blindado", acao: "Visualizar Termo" },
        { nome: "Modelo Base: Contrato de Honorários Quota-Litis", acao: "Visualizar Contrato" },
        { nome: "Modelo Base: Procuração Ad Judicia Médica", acao: "Visualizar Procuração" }
      ]
    },
    {
      categoria: "🔒 POPs, Governança e Compliance OAB",
      itens: [
        { nome: "Provimento de Publicidade da OAB (Nº 205/21)", url: "https://www.oab.org.br/" },
        { nome: "Manual de Sigilo de Prontuários e LGPD na Saúde", acao: "Abrir Diretrizes" }
      ]
    }
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-6 font-sans">
      {/* Top Bar de Impressão */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 mb-6 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm print:hidden gap-4">
        <div>
          <h1 className="text-sm font-extrabold text-[#0f1e36] dark:text-white uppercase tracking-wider">
            📜 Central de Conhecimento
          </h1>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Repositório oficial de consultas, legislação médica e procedimentos operacionais.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-[#0f1e36] text-white hover:bg-slate-800 text-xs font-bold uppercase px-4 py-2.5 rounded border-b-2 border-[#d4af37] transition-all cursor-pointer active:scale-95 shadow-md shrink-0"
        >
          🖨️ Imprimir Acervo
        </button>
      </div>

      {/* Barra de Busca Dinâmica */}
      <div className="mb-6 print:hidden">
        <input 
          type="text" 
          placeholder="🔍 Digite para buscar leis, resoluções ou modelos..." 
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none text-[#0f1e36] dark:text-white focus:border-[#d4af37] transition-all"
        />
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {linksUteis.map((secao, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-extrabold text-[#0f1e36] dark:text-[#d4af37] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              {secao.categoria}
            </h3>
            <ul className="flex flex-col gap-3">
              {secao.itens
                .filter(item => item.nome.toLowerCase().includes(busca.toLowerCase()))
                .map((item, i) => (
                  <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300 font-medium hover:text-[#d4af37] transition-all">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 border-b border-transparent hover:border-[#d4af37]/35 pb-1">
                        <span>• {item.nome}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold shrink-0">Acessar ↗</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alert(`Acessando: ${item.nome}`)}
                        className="w-full text-left flex items-center justify-between gap-2 border-b border-transparent hover:border-[#d4af37]/35 pb-1 cursor-pointer"
                      >
                        <span>• {item.nome}</span>
                        <span className="text-[9px] text-[#d4af37] uppercase tracking-widest font-bold shrink-0">Abrir 👁️</span>
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaginaBiblioteca;
