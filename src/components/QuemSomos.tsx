import React, { useState } from "react";

export const QuemSomos: React.FC = () => {
  const [quemSomosAberto, setQuemSomosAberto] = useState(false);

  return (
    <section className="w-full bg-white dark:bg-[#0c1424] py-8 px-6 md:px-16 border-t border-slate-200 dark:border-[#d4af37]/15 z-10 transition-colors duration-350">
      
      {/* GATILHO MINIMALISTA E DISCRETO */}
      <div className="w-full max-w-6xl mx-auto flex justify-center">
        <button
          onClick={() => setQuemSomosAberto(!quemSomosAberto)}
          className="flex items-center gap-3 py-3.5 px-8 text-xs font-bold text-[#0f1e36] dark:text-[#d4af37] border border-[#0f1e36]/10 dark:border-[#d4af37]/20 hover:border-[#d4af37] dark:hover:border-white rounded-full bg-slate-50/50 dark:bg-[#070a13]/30 transition-all duration-300 uppercase tracking-widest outline-none shadow-sm cursor-pointer hover:shadow"
          aria-expanded={quemSomosAberto}
        >
          <span>Quem Somos / Trajetória</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className={`w-3.5 h-3.5 text-[#d4af37] transition-transform duration-500 ease-in-out ${
              quemSomosAberto ? "rotate-180" : ""
            }`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* CONTAINER DE EXPANSÃO SUAVE */}
      <div
        className={`w-full max-w-6xl mx-auto transition-all duration-500 ease-in-out overflow-hidden ${
          quemSomosAberto ? "max-h-[2200px] opacity-100 mt-10" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start pb-8">
          
          {/* COLUNA ESQUERDA: NARRATIVA INSTITUCIONAL E ACADÊMICA (65% ou 8/12 cols) */}
          <div className="md:col-span-7 space-y-6 flex flex-col justify-center">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block">
                Rigor Técnico &amp; Experiência
              </span>
              <h2 className="font-playfair text-[#0f1e36] dark:text-white text-2xl md:text-3xl font-extrabold uppercase tracking-wider">
                Trajetória Estratégica
              </h2>
            </div>
            
            <p className="font-serif text-[#334155] dark:text-slate-300 text-sm md:text-base leading-relaxed text-justify">
              A advocacia de alta performance exige mais do que o conhecimento das leis; demanda a compreensão profunda do cenário prático em que os direitos são defendidos. Fundado pela <strong>Dra. Janaina Tarabauca do Prado (OAB/SP 501.070)</strong>, o escritório une rigor científico e acolhimento humano para oferecer soluções eficientes de governança de riscos e proteção de patrimônio.
            </p>

            {/* Timeline de Carreira */}
            <div className="relative border-l border-[#d4af37]/25 pl-6 space-y-6 my-4 ml-2.5">
              {/* Item 1 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#d4af37] border-4 border-white dark:border-[#0c1424] shadow-[0_0_8px_rgba(197,168,92,0.4)]" />
                <h3 className="font-playfair text-[#0f1e36] dark:text-white text-sm md:text-base font-bold">
                  20+ Anos de Gestão e Governança
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Vasta bagagem executiva na administração de riscos corporativos, controle de passivos e modelagem estratégica de contratos operacionais.
                </p>
              </div>
              
              {/* Item 2 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#d4af37] border-4 border-white dark:border-[#0c1424] shadow-[0_0_8px_rgba(197,168,92,0.4)]" />
                <h3 className="font-playfair text-[#0f1e36] dark:text-white text-sm md:text-base font-bold">
                  Formação Interdisciplinar
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Bacharel em Direito e Administração de Empresas pela Universidade São Judas Tadeu (USJT), conferindo visão gerencial estratégica ao direito.
                </p>
              </div>

              {/* Item 3 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#d4af37] border-4 border-white dark:border-[#0c1424] shadow-[0_0_8px_rgba(197,168,92,0.4)]" />
                <h3 className="font-playfair text-[#0f1e36] dark:text-white text-sm md:text-base font-bold">
                  Especialização Trabalhista e de Saúde
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Foco analítico na mitigação de passivos trabalhistas corporativos e na garantia de direitos fundamentais à saúde e à vida.
                </p>
              </div>
            </div>

            {/* MINI-BOX DE PRODUÇÃO INTELECTUAL DISCRETA */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-[#d4af37]/5 dark:bg-[#d4af37]/3 border border-[#d4af37]/15 rounded-xl p-4">
              <span className="text-[9px] font-bold text-[#d4af37] uppercase tracking-widest block mb-2">
                PRODUÇÃO ACADÊMICA &amp; PESQUISA
              </span>
              <div className="flex gap-2.5 items-start">
                <span className="text-[#d4af37] text-sm leading-none mt-0.5">•</span>
                <p className="font-serif text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                  <strong>O Direito do Nascituro à Chance de Nascer com Vida</strong> – Pesquisa com foco em 
                  Direito Constitucional à Saúde, Planejamento Familiar e Teoria da Perda de uma Chance (USJT, 2021). 
                  Análise da responsabilidade de operadoras e do Estado no custeio de procedimentos vitais.
                </p>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: FOTO PROFISSIONAL COM OVERLAY (35% ou 5/12 cols) */}
          <div className="md:col-span-5 flex justify-center items-center">
            <div className="w-full max-w-[340px] aspect-[4/5] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-lg relative group transition-all hover:shadow-xl duration-350 bg-slate-50 dark:bg-[#070a13]">
              <img 
                src="/dra-janaina.png" 
                alt="Dra. Janaina Tarabauca" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
              
              {/* Glassmorphism Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#0f1e36]/75 dark:bg-[#0c1424]/75 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-xl p-4 flex flex-col gap-1 box-border">
                <span className="font-playfair text-[#ffffff] dark:text-white text-sm md:text-base font-bold">
                  Dra. Janaina Tarabauca
                </span>
                <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">
                  OAB/SP 501.070
                </span>
                <span className="text-[10px] text-white/70 dark:text-slate-300">
                  ✦ Rigor Científico e Empatia
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Credentials Footer Row */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 w-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-lg py-2 px-3.5 flex items-center gap-2.5 text-xs font-bold text-[#0f1e36] dark:text-slate-300 shadow-sm">
            <svg className="w-4 h-4 text-[#d4af37] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Confidencialidade OAB
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-lg py-2 px-3.5 flex items-center gap-2.5 text-xs font-bold text-[#0f1e36] dark:text-slate-300 shadow-sm">
            <svg className="w-4 h-4 text-[#d4af37] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Mapeamento de Passivos
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-lg py-2 px-3.5 flex items-center gap-2.5 text-xs font-bold text-[#0f1e36] dark:text-slate-300 shadow-sm">
            <svg className="w-4 h-4 text-[#d4af37] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7L2 12h6L5 7zM19 7l-3 5h6l-3-5z"/></svg> Defesa da Saúde e Vida
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-lg py-2 px-3.5 flex items-center gap-2.5 text-xs font-bold text-[#0f1e36] dark:text-slate-300 shadow-sm">
            <svg className="w-4 h-4 text-[#d4af37] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M17.66 6.34l-1.41 1.41"/><circle cx="12" cy="12" r="4"/></svg> Jus IA Integrada
          </div>
        </div>

      </div>
    </section>
  );
};

export default QuemSomos;
