import React from "react";

export const QuemSomos: React.FC = () => {
  return (
    <section className="w-full bg-white dark:bg-[#0c1424] py-16 px-6 md:px-16 border-t border-slate-200 dark:border-[#d4af37]/15 z-10 transition-colors duration-350">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* COLUNA ESQUERDA: NARRATIVA INSTITUCIONAL E ACADÊMICA */}
        <div className="space-y-6 flex flex-col justify-center">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block">
              Fundação &amp; Propósito
            </span>
            <h2 className="font-playfair text-[#0f1e36] dark:text-white text-2xl md:text-3xl font-extrabold uppercase tracking-wider">
              Trajetória Estratégica
            </h2>
          </div>
          
          <p className="font-serif text-[#334155] dark:text-slate-350 text-sm md:text-base leading-relaxed text-justify">
            Fundada pela Dra. Janaina Tarabauca do Prado (OAB/SP 501.070), bacharel em Direito e Administração pela 
            Universidade São Judas Tadeu, com especialização em Direito do Trabalho. A banca consolida uma vivência 
            executiva de mais de duas décadas na gestão de operações de alta complexidade, governança de contratos 
            e mitigação de passivos. Essa sólida bagagem operacional confere à Janaina Tarabauca Advocacia uma visão 
            estritamente preventiva e focada na viabilidade de negócios, unindo a precisão técnica do ecossistema 
            jurídico à realidade prática corporativa de seus clientes. Sua produção intelectual e acadêmica destaca-se 
            pela pesquisa voltada à tutela do direito à saúde e à vida, com ênfase na tese sobre o direito do nascituro 
            e na responsabilidade do Estado e de operadoras no fornecimento de tratamentos médicos essenciais.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              <span className="text-[10px] font-bold text-[#0f1e36] dark:text-slate-400 uppercase tracking-widest">
                Gestão de Riscos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              <span className="text-[10px] font-bold text-[#0f1e36] dark:text-slate-400 uppercase tracking-widest">
                Compliance Trabalhista
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              <span className="text-[10px] font-bold text-[#0f1e36] dark:text-slate-400 uppercase tracking-widest">
                Direito da Saúde &amp; SUS
              </span>
            </div>
          </div>

          {/* MINI-BOX DE PRODUÇÃO INTELECTUAL DISCRETA */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block mb-2">
              PRODUÇÃO ACADÊMICA &amp; PESQUISA
            </span>
            <div className="flex gap-2.5 items-start">
              <span className="text-[#d4af37] text-sm leading-none mt-0.5">•</span>
              <p className="font-serif text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>O Direito do Nascituro à Chance de Nascer com Vida</strong> – Monografia de Graduação com foco em 
                Direito Constitucional à Saúde, Planejamento Familiar e Teoria da Perda de uma Chance (USJT, 2021).
              </p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: FOTO PROFISSIONAL DA DRA. JANAINA */}
        <div className="flex justify-center items-center">
          <div className="w-full max-w-sm aspect-square rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-md relative group transition-all hover:shadow-xl duration-350 bg-slate-50 dark:bg-[#070a13]">
            <img 
              src="/dra-janaina.png" 
              alt="Dra. Janaina Tarabauca" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default QuemSomos;
