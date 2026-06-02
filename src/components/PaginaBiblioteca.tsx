import React, { useState } from "react";

interface LibraryItem {
  id: string;
  title: string;
  desc: string;
  category: "legislacao" | "modelos" | "governança";
  link?: string;
  downloadable?: boolean;
}

export const PaginaBiblioteca: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"todos" | "legislacao" | "modelos" | "governança">("todos");
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  // Massa de dados estruturada para garantir a busca e a consistência
  const items: LibraryItem[] = [
    // CARD 1: Legislação e Resoluções Críticas (Direito Médico)
    {
      id: "cfm-etica",
      title: "Código de Ética Médica (CFM)",
      desc: "Resolução CFM nº 2.217/2018 - O pilar fundamental que rege os deveres e direitos da prática médica no Brasil. Essencial para fundamentação de defesas em processos ético-profissionais.",
      category: "legislacao",
      link: "https://portal.cfm.org.br/images/PDF/cem2019.pdf"
    },
    {
      id: "ato-medico",
      title: "Lei do Ato Médico",
      desc: "Lei nº 12.842/2013 - Dispõe sobre a regulamentação do exercício da Medicina. Crucial para teses sobre invasão de competências exclusivas e imperícia de outros profissionais.",
      category: "legislacao",
      link: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12842.htm"
    },
    {
      id: "telemedicina",
      title: "Resolução de Telemedicina",
      desc: "Resolução CFM nº 2.314/2022 - Regulamenta e normatiza a telemedicina no Brasil. Indispensável para auditorias de conformidade de plataformas de saúde digital.",
      category: "legislacao",
      link: "https://sistemas.cfm.org.br/normas/visualizar/resolucao/CFM/2022/2314"
    },

    // CARD 2: Modelos e Templates de Suporte
    {
      id: "tcle-procedimento",
      title: "Modelo de TCLE Blindado",
      desc: "Termo de Consentimento Livre e Esclarecido rigorosamente desenhado com foco em cirurgias de alta complexidade e procedimentos estéticos, com cláusulas de mitigação de responsabilidade.",
      category: "modelos",
      downloadable: true
    },
    {
      id: "procuracao-crm",
      title: "Procuração Ad Judicia & Extrajudicia",
      desc: "Template de procuração específico com poderes especiais para representação e patrocínio perante Conselhos Regionais de Medicina (CRM) e esferas judiciais cíveis.",
      category: "modelos",
      downloadable: true
    },
    {
      id: "contrato-base",
      title: "Contrato Base de Prestação de Serviços",
      desc: "Contrato padrão de assessoria jurídica preventiva corporativa para clínicas médicas e consultórios com cláusulas robustas de sigilo, LGPD e compliance financeiro.",
      category: "modelos",
      downloadable: true
    },

    // CARD 3: POPs, Governança e Compliance
    {
      id: "oab-publicidade",
      title: "Novo Provimento de Publicidade da OAB",
      desc: "Provimento nº 205/2021 - Dispõe sobre a publicidade e a informação da advocacia. Fundamental para estruturar o marketing jurídico das nossas parcerias corporativas de saúde sem infrações éticas.",
      category: "governança",
      link: "https://www.oab.org.br/visualizador/16281/provimento-n-205-2021"
    },
    {
      id: "manual-prontuario",
      title: "Manual de Sigilo de Prontuários (LGPD)",
      desc: "Diretrizes técnicas operacionais de conformidade (POPs) para recepção, custódia e descarte seguro de prontuários e dados sensíveis de pacientes, alinhadas à LGPD e CFM.",
      category: "governança",
      link: "#"
    }
  ];

  // Filtra itens com base no termo de busca e na categoria ativa
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "todos" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (id: string, title: string) => {
    setDownloadSuccessId(id);
    setTimeout(() => setDownloadSuccessId(null), 2500);
    
    // Simulação do download de documento jurídico
    const docText = `DOCUMENTO JURÍDICO - JT ADVOGADOS ASSOCIADOS\n\nTEMPLATE: ${title.toUpperCase()}\n\nEste modelo foi gerado em ambiente restrito para uso do escritório Janaina Tarabauca Advogados.`;
    const blob = new Blob([docText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-[#0f1e36] dark:text-slate-100 font-sans selection:bg-[#d4af37]/35 transition-colors duration-300 pb-20 print:bg-white print:text-black">
      
      {/* ── CABEÇALHO FIXO NO TOPO (OCULTO NA IMPRESSÃO) ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm print:relative print:border-none print:shadow-none print:bg-white">
        <div className="flex items-center gap-3">
          <img src="/logo-jt.png" alt="Janaina Tarabauca Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="font-playfair font-extrabold text-base tracking-wide text-[#0f1e36] dark:text-slate-100 uppercase">
              Janaina Tarabauca
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold">
              Central de Conhecimento &amp; Biblioteca Jurídica
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="bg-[#0f1e36] text-white hover:bg-slate-800 text-xs font-bold uppercase px-4 py-2 rounded border-b border-[#d4af37] print:hidden transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
        >
          🖨️ Imprimir Biblioteca (PDF)
        </button>
      </header>

      {/* Timbrado Exclusivo de Impressão */}
      <div className="hidden print:flex print:items-center print:gap-4 pb-4 border-b-2 border-[#d4af37] mb-8 max-w-5xl mx-auto px-6">
        <img src="/logo-jt.png" alt="JT" className="h-12 w-12 object-contain" />
        <div>
          <h2 className="font-playfair font-extrabold text-xl text-[#0f1e36] tracking-wider uppercase m-0">
            Janaina Tarabauca Advogados
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mt-0.5">
            Direito Médico e da Saúde - Biblioteca Jurídica
          </p>
        </div>
      </div>

      {/* ── CORPO PRINCIPAL ── */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Introdução e Instruções */}
        <section className="text-center space-y-4 print:text-left">
          <h2 className="font-playfair font-extrabold text-3xl md:text-4xl text-[#0f1e36] dark:text-slate-100 leading-tight">
            Central de Acervo Técnico
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto print:mx-0 leading-relaxed">
            Consulte os marcos regulatórios de Direito Médico, baixe minutas de suporte blindadas prontas para uso operativo e certifique as diretrizes de compliance de publicidade do conselho profissional.
          </p>
        </section>

        {/* ── BARRA DE FERRAMENTAS E FILTRAGEM (OCULTA NA IMPRESSÃO) ── */}
        <section className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Campo de Busca Reativo */}
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Pesquisar por resoluções, modelos ou diretrizes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 text-xs text-[#0f1e36] dark:text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] transition-all font-light placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0f1e36] dark:hover:text-slate-200 text-xs font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Categorias Rápidas */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {([
                { id: "todos", label: "👁️ Ver Tudo" },
                { id: "legislacao", label: "📜 Legislação" },
                { id: "modelos", label: "💼 Modelos" },
                { id: "governança", label: "🔒 POPs & Compliance" }
              ] as const).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    activeCategory === cat.id
                      ? "bg-[#0f1e36] dark:bg-[#d4af37] text-white dark:text-slate-950 border-transparent shadow-sm"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#0f1e36] dark:hover:text-slate-200"
                  } cursor-pointer`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          </div>
        </section>

        {/* ── CONTEÚDO EDITORIAL (GRID DE CARDS) ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* COLUNA 1: LEGISLAÇÃO E RESOLUÇÕES CRÍTICAS */}
          <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/40 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xl">📜</span>
              <div>
                <h3 className="font-playfair font-extrabold text-sm text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
                  Legislação &amp; Resoluções
                </h3>
                <p className="text-[9px] uppercase tracking-wider text-[#d4af37] font-bold mt-0.5">Direito Médico Fundamental</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {filteredItems
                .filter((item) => item.category === "legislacao")
                .map((item) => (
                  <div key={item.id} className="group p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-transparent hover:border-[#d4af37]/30 rounded-xl transition-all duration-200">
                    <h4 className="text-xs font-bold text-[#0f1e36] dark:text-slate-200 flex items-center justify-between">
                      {item.title}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#d4af37] hover:text-[#0f1e36] dark:hover:text-slate-100 text-[10px] font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                          title="Acessar documento oficial"
                        >
                          Ir ↗
                        </a>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              {filteredItems.filter((item) => item.category === "legislacao").length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light text-center py-4">Nenhuma legislação correspondente.</p>
              )}
            </div>
          </div>

          {/* COLUNA 2: MODELOS E TEMPLATES DE SUPORTE */}
          <div className="border border-[#d4af37]/35 dark:border-[#d4af37]/20 rounded-2xl bg-white dark:bg-slate-900/40 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xl">💼</span>
              <div>
                <h3 className="font-playfair font-extrabold text-sm text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
                  Modelos &amp; Templates
                </h3>
                <p className="text-[9px] uppercase tracking-wider text-[#d4af37] font-bold mt-0.5 font-sans">Material Blindado</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {filteredItems
                .filter((item) => item.category === "modelos")
                .map((item) => (
                  <div key={item.id} className="group p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-transparent hover:border-[#d4af37]/30 rounded-xl transition-all duration-200 relative overflow-hidden">
                    <h4 className="text-xs font-bold text-[#0f1e36] dark:text-slate-200">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light mt-2 leading-relaxed pb-8">
                      {item.desc}
                    </p>
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Formato: TXT/DOCX</span>
                      <button
                        onClick={() => handleDownload(item.id, item.title)}
                        className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded transition-all cursor-pointer ${
                          downloadSuccessId === item.id
                            ? "bg-emerald-500 text-white border border-transparent"
                            : "bg-[#0f1e36] text-white hover:bg-[#d4af37] hover:text-[#0f1e36] dark:bg-slate-900 border border-[#d4af37]/20"
                        }`}
                      >
                        {downloadSuccessId === item.id ? "✓ Baixado" : "⬇️ Download"}
                      </button>
                    </div>
                  </div>
                ))}
              {filteredItems.filter((item) => item.category === "modelos").length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light text-center py-4">Nenhum modelo correspondente.</p>
              )}
            </div>
          </div>

          {/* COLUNA 3: POPS, GOVERNANÇA E COMPLIANCE */}
          <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/40 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xl">🔒</span>
              <div>
                <h3 className="font-playfair font-extrabold text-sm text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
                  Governança &amp; POPs
                </h3>
                <p className="text-[9px] uppercase tracking-wider text-[#d4af37] font-bold mt-0.5">Compliance e Publicidade</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {filteredItems
                .filter((item) => item.category === "governança")
                .map((item) => (
                  <div key={item.id} className="group p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-transparent hover:border-[#d4af37]/30 rounded-xl transition-all duration-200">
                    <h4 className="text-xs font-bold text-[#0f1e36] dark:text-slate-200 flex items-center justify-between">
                      {item.title}
                      {item.link && item.link !== "#" && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#d4af37] hover:text-[#0f1e36] dark:hover:text-slate-100 text-[10px] font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          Ver ↗
                        </a>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              {filteredItems.filter((item) => item.category === "governança").length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light text-center py-4">Nenhuma governança correspondente.</p>
              )}
            </div>
          </div>

        </section>

        {/* Informações Finais Adicionais de Rodapé para a Impressão */}
        <footer className="hidden print:block text-[9px] text-center text-slate-400 border-t border-slate-200 pt-8 mt-12">
          Este manual de consulta foi exportado a partir da Central de Conhecimento do portal Janaina Tarabauca Advogados. Uso restrito e institucional.
        </footer>

      </main>
    </div>
  );
};

export default PaginaBiblioteca;
