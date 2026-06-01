import React, { useState } from "react";

export const PaginaDocumento: React.FC = () => {
  const [activeSection, setActiveSection] = useState<"todos" | "escopo" | "arquitetura" | "manual">("todos");
  const [activeModule, setActiveModule] = useState<"processos" | "contratos" | "perfil">("processos");

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-[#0f1e36] dark:text-slate-100 font-sans selection:bg-[#d4af37]/35 transition-colors duration-300 pb-20 print:bg-white print:text-black">
      
      {/* ── CABEÇALHO FIXO (TOPO) ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm print:relative print:border-none print:shadow-none print:bg-white">
        <div className="flex items-center gap-3">
          <img src="/logo-jt.png" alt="Janaina Tarabauca Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="font-playfair font-extrabold text-base tracking-wide text-[#0f1e36] dark:text-slate-100 uppercase">
              Janaina Tarabauca
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold">
              Direito Médico & Saúde - Memorial do Ecossistema
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="bg-[#0f1e36] text-white hover:bg-slate-800 text-xs font-bold uppercase px-4 py-2 rounded border-b border-[#d4af37] print:hidden transition-all duration-200 active:scale-95 shadow-sm"
        >
          🖨️ Exportar Manual (PDF)
        </button>
      </header>

      {/* ── CORPO PRINCIPAL ── */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-12">
        
        {/* Banner Timbrado Exclusivo de Impressão */}
        <div className="hidden print:flex print:items-center print:gap-4 pb-4 border-b-2 border-[#d4af37] mb-8">
          <img src="/logo-jt.png" alt="JT" className="h-12 w-12 object-contain" />
          <div>
            <h2 className="font-playfair font-extrabold text-xl text-[#0f1e36] tracking-wider uppercase m-0">
              Janaina Tarabauca Advogados
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mt-0.5">
              Direito Médico e da Saúde
            </p>
          </div>
        </div>

        {/* ── INTRODUÇÃO EDITORIAL ── */}
        <section className="text-center space-y-4 print:text-left">
          <h2 className="font-playfair font-extrabold text-3xl md:text-4xl text-[#0f1e36] dark:text-slate-100 leading-tight">
            Manual Técnico &amp; Documentação Operacional
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto print:mx-0 leading-relaxed">
            Consolidação das diretrizes de engenharia, especificações do banco de dados relacional e guia interativo das ferramentas de inteligência artificial de nível Triple-A para o escritório Janaina Tarabauca Advogados.
          </p>
          
          {/* Navegação Rápida (Filtros Interativos) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 print:hidden">
            {(["todos", "escopo", "arquitetura", "manual"] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeSection === sec
                    ? "bg-[#0f1e36] dark:bg-[#d4af37] text-white dark:text-slate-950 border-transparent shadow-sm font-extrabold"
                    : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#0f1e36] dark:hover:text-slate-200"
                }`}
              >
                {sec === "todos" ? "👁️ Ver Tudo" : sec === "escopo" ? "🎯 Escopo" : sec === "arquitetura" ? "🛠️ Arquitetura" : "📖 Manual"}
              </button>
            ))}
          </div>
        </section>

        {/* ── SEÇÃO: ESCOPO DO PROJETO ── */}
        {(activeSection === "todos" || activeSection === "escopo") && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xl">🎯</span>
              <h3 className="font-playfair font-extrabold text-lg text-[#0f1e36] dark:text-slate-100 uppercase tracking-wider">
                1. Escopo do Projeto &amp; Visão do Negócio
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#d4af37]/35 dark:border-[#d4af37]/20 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest font-mono">Objetivo Estratégico</span>
                <h4 className="font-playfair font-bold text-sm text-[#0f1e36] dark:text-slate-100">
                  Gestão Digital de Alta Complexidade em Direito Médico e da Saúde
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  O ecossistema institucional foi estruturado sob medida para automatizar e centralizar as demandas consultivas e contenciosas. O sistema integra inteligência artificial avançada para geração de peças e teses, eliminando tempos mortos e otimizando a conformidade jurídica com máxima segurança.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Público-Alvo e Usuários</span>
                <h4 className="font-playfair font-bold text-sm text-[#0f1e36] dark:text-slate-100">
                  Corpo Jurídico e Clientes Corporativos de Saúde
                </h4>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 font-light list-inside list-disc">
                  <li><strong>Sócios e Advogados:</strong> Gestão de processos judiciais, redação de defesas éticas perante o CRM, e modelagem de contratos preventivos.</li>
                  <li><strong>Clientes Corporativos:</strong> Acesso seguro a relatórios processuais, validação de minutas contratuais e gerenciamento de mensalidades recorrentes de assessoria.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ── SEÇÃO: ARQUITETURA TECNOLÓGICA ── */}
        {(activeSection === "todos" || activeSection === "arquitetura") && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xl">🛠️</span>
              <h3 className="font-playfair font-extrabold text-lg text-[#0f1e36] dark:text-slate-100 uppercase tracking-wider">
                2. Arquitetura Tecnológica &amp; Segurança
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Stack Frontend */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Camada de Client</span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">SPA</span>
                </div>
                <h4 className="font-bold text-[#0f1e36] dark:text-slate-200 text-sm">React.js &amp; TypeScript</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  Desenvolvido sobre uma arquitetura reativa utilizando componentes modulares com TypeScript. A tipagem estrita de interfaces (ex. `Cliente`, `ProcessoCompleto`, `AIEngine`) previne quebras em produção e acelera a manutenção. O Tailwind CSS é empregado para garantir total responsividade e design system unificado.
                </p>
              </div>

              {/* Stack Backend/Database */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Banco de Dados</span>
                  <span className="text-[10px] bg-[#d4af37]/10 text-[#d4af37] px-2 py-0.5 rounded font-mono font-bold">Supabase</span>
                </div>
                <h4 className="font-bold text-[#0f1e36] dark:text-slate-200 text-sm">PostgreSQL Relacional</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  Infraestrutura baseada no Supabase. O banco de dados PostgreSQL lida com relações de prontuários (`public.clientes`), processos jurídicos (`public.processos`), transações patrimoniais (`public.financeiro`) e chaves criptografadas de faturamento e chaves de API, sob estrita conformidade com a LGPD.
                </p>
              </div>

              {/* Inteligência Artificial */}
              <div className="border border-[#d4af37]/35 dark:border-[#d4af37]/20 rounded-xl p-5 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">Motor Cognitivo</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">Jus IA</span>
                </div>
                <h4 className="font-bold text-[#0f1e36] dark:text-slate-200 text-sm">Integração "Jus IA" Nativa</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  O sistema incorpora a **Jus IA** como motor padrão pré-selecionado. A geração textual médico-legal consome prompts estruturados que integram o histórico clínico (prontuário do cliente) com as movimentações dos autos, estruturando peças prontas com fundamentos baseados em erro médico ou auditorias de glosa.
                </p>
              </div>

            </div>
          </section>
        )}

        {/* ── SEÇÃO: MANUAL INTERATIVO ── */}
        {(activeSection === "todos" || activeSection === "manual") && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xl">📖</span>
              <h3 className="font-playfair font-extrabold text-lg text-[#0f1e36] dark:text-slate-100 uppercase tracking-wider">
                3. Manual de Operação do Usuário (Interativo)
              </h3>
            </div>

            {/* Sub-abas de Navegação de Módulos (Manual) */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
              <button
                type="button"
                onClick={() => setActiveModule("processos")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeModule === "processos"
                    ? "border-[#d4af37] text-[#d4af37]"
                    : "border-transparent text-slate-400 hover:text-[#0f1e36] dark:hover:text-slate-200"
                }`}
              >
                📂 Módulo Processos
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("contratos")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeModule === "contratos"
                    ? "border-[#d4af37] text-[#d4af37]"
                    : "border-transparent text-slate-400 hover:text-[#0f1e36] dark:hover:text-slate-200"
                }`}
              >
                📜 Módulo Contratos
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("perfil")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeModule === "perfil"
                    ? "border-[#d4af37] text-[#d4af37]"
                    : "border-transparent text-slate-400 hover:text-[#0f1e36] dark:hover:text-slate-200"
                }`}
              >
                👤 Perfil e Assinatura
              </button>
            </div>

            {/* Módulo: Processos */}
            {(activeModule === "processos" || activeSection === "todos") && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start animate-slideDown">
                <div className="lg:col-span-3 space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Fluxo Operacional</span>
                  <h4 className="font-playfair font-bold text-base text-[#0f1e36] dark:text-slate-200">
                    Módulo de Processos, Glosas e Teses Médicas
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                    O sistema de processos conta com uma navegação otimizada para Direito Médico. Ao clicar em qualquer Número de Processo na listagem geral, a interface carrega automaticamente todos os fatos médicos estruturados na segunda camada, alimentando reativamente a central da **Jus IA**.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-900 border-l-2 border-[#d4af37] p-3 rounded-r-lg space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[#d4af37] uppercase tracking-wide">💡 Dica de Utilização</span>
                    <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed">
                      Ao acionar a Jus IA na segunda camada, você pode anexar documentos médicos (arquivos `.txt` e `.pdf`). A inteligência lerá e consolidará o conteúdo, sugerindo uma peça processual robusta com estrutura tripartite: **Fatos**, **Fundamentos Jurídicos** e **Pedidos**.
                    </p>
                  </div>
                </div>

                {/* Screenshot Placeholder */}
                <div className="lg:col-span-2 border border-[#d4af37] rounded-xl p-4 bg-slate-50 dark:bg-[#070a13] font-mono text-[9px] text-slate-600 dark:text-slate-400 space-y-3 relative shadow-md">
                  <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/30 px-1.5 py-0.5 rounded bg-[#d4af37]/5 font-bold">Screenshot: Processos</span>
                  <div className="border border-slate-300 dark:border-slate-800 p-2.5 rounded-lg bg-white dark:bg-slate-900 flex justify-between items-center text-[#0f1e36] dark:text-slate-100 font-sans shadow-sm">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-xs">Processo nº 1004523-89.2026.8.26.0100</span>
                      <p className="text-[10px] text-slate-400">Dr. Eduardo Santos vs. Unimed Grande São Paulo</p>
                    </div>
                    <span className="text-[9px] font-bold text-[#d4af37] bg-[#d4af37]/10 px-2 py-1 rounded border border-[#d4af37]/20 uppercase">CRM Defesa</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="border border-dashed border-slate-300 dark:border-slate-850 p-3 rounded-lg text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all">
                      📎 Arraste prontuários adicionais ou defesas do CRM (.pdf, .txt)
                    </div>
                  </div>

                  <div className="bg-[#0f1e36] text-white p-2.5 rounded-lg flex items-center justify-between border-b border-[#d4af37] font-sans">
                    <span className="text-[10px] font-bold">🤖 Motor: JUS IA (Padrão)</span>
                    <span className="text-[9px] text-emerald-400 animate-pulse font-bold">● Pronto para Redigir</span>
                  </div>
                </div>
              </div>
            )}

            {/* Módulo: Contratos */}
            {(activeModule === "contratos" || activeSection === "todos") && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start pt-6 border-t border-slate-100 dark:border-slate-900/60 animate-slideDown">
                <div className="lg:col-span-3 space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Fluxo Operacional</span>
                  <h4 className="font-playfair font-bold text-base text-[#0f1e36] dark:text-slate-200">
                    Módulo de Contratos de Honorários e Faturamento
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                    O módulo de contratos garante governança total sobre a assessoria médica mensal de clínicas e médicos individuais. O dropdown de prontuários possui **segurança contra vazamentos**, limpando automaticamente esboços ou assinaturas residuais ao alternar o cliente selecionado.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-900 border-l-2 border-[#d4af37] p-3 rounded-r-lg space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[#d4af37] uppercase tracking-wide">💡 Faturamento e PIX Integrado</span>
                    <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed">
                      Todas as parcelas geradas contam com códigos PIX reativos e copia-e-cola com verificação instantânea. Ao salvar edições contratuais ou liquidar transações, o sistema dispensa alertas invasivos do navegador e exibe badges modernos e flutuantes em verde-esmeralda.
                    </p>
                  </div>
                </div>

                {/* Screenshot Placeholder */}
                <div className="lg:col-span-2 border border-[#d4af37] rounded-xl p-4 bg-slate-50 dark:bg-[#070a13] font-mono text-[9px] text-slate-600 dark:text-slate-400 space-y-3 relative shadow-md">
                  <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/30 px-1.5 py-0.5 rounded bg-[#d4af37]/5 font-bold">Screenshot: Contratos</span>
                  
                  <div className="space-y-1.5 font-sans">
                    <label className="text-[8px] font-bold text-slate-450 uppercase block">Selecionar Prontuário</label>
                    <div className="border border-slate-300 dark:border-slate-800 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-[#0f1e36] dark:text-slate-100 flex items-center justify-between text-[10px]">
                      <span>👤 Dra. Laura Azevedo (Médica Dermatologista)</span>
                      <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Ativo</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-3 space-y-2 text-[#0f1e36] dark:text-slate-150 font-sans">
                    <div className="flex justify-between items-center text-[9px] font-bold border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span>VALOR DO CONTRATO</span>
                      <span className="text-emerald-600 font-mono">R$ 12.500,00</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-light leading-normal">
                      Pelos serviços contenciosos prestados, o CONTRATANTE pagará à CONTRATADA o valor mensal fixado...
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-850 py-2 rounded text-center text-slate-700 dark:text-slate-300 font-sans font-bold text-[9px]">Previa do PDF</div>
                    <div className="flex-1 bg-[#d4af37] text-[#070a13] py-2 rounded text-center font-sans font-bold text-[9px]">Ativar e Cobrar</div>
                  </div>
                </div>
              </div>
            )}

            {/* Módulo: Perfil */}
            {(activeModule === "perfil" || activeSection === "todos") && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start pt-6 border-t border-slate-100 dark:border-slate-900/60 animate-slideDown">
                <div className="lg:col-span-3 space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Fluxo Operacional</span>
                  <h4 className="font-playfair font-bold text-base text-[#0f1e36] dark:text-slate-200">
                    Perfil Profissional e Assinatura Eletrônica OAB
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                    O controle de perfil assegura a identificação civil e a credencial da OAB/UF do advogado logado. As petições geradas e enviadas por e-mail ou geradas em PDF contam com a assinatura digital do advogado. A captura das coordenadas de desenho emprega manipulação direta via `useRef` no canvas, garantindo **lag zero** e resposta táctil premium.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-900 border-l-2 border-[#d4af37] p-3 rounded-r-lg space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[#d4af37] uppercase tracking-wide">💡 Importação Facilitada</span>
                    <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed">
                      Caso prefira, você pode pular a assinatura manuscrita direta no canvas e importar um arquivo de imagem local contendo sua assinatura digital oficial. O sistema converterá automaticamente o arquivo para Base64 e o incorporará ao banco de dados com segurança.
                    </p>
                  </div>
                </div>

                {/* Screenshot Placeholder */}
                <div className="lg:col-span-2 border border-[#d4af37] rounded-xl p-4 bg-slate-50 dark:bg-[#070a13] font-mono text-[9px] text-slate-600 dark:text-slate-400 space-y-3 relative shadow-md">
                  <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/30 px-1.5 py-0.5 rounded bg-[#d4af37]/5 font-bold">Screenshot: Assinatura</span>
                  
                  <div className="space-y-1 font-sans">
                    <span className="text-[8px] font-bold uppercase text-slate-400">Quadro de Captura OAB</span>
                    <div className="w-full h-24 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-[#d4af37]/45 flex flex-col items-center justify-center cursor-crosshair text-slate-400 relative">
                      <span className="text-xs">✍️</span>
                      <span className="text-[8px]">Assine aqui dentro</span>
                      {/* Simulated signature stroke */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <path d="M 30,50 Q 80,10 110,60 T 210,40" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" className="flex-1 bg-slate-200 dark:bg-slate-800 py-1.5 rounded font-sans font-bold text-slate-700 dark:text-slate-300 text-[8.5px]">Limpar Canvas</button>
                    <button type="button" className="flex-1 bg-[#d4af37] hover:bg-[#ebd074] text-[#070a13] py-1.5 rounded font-sans font-bold text-[8.5px] transition-colors">Importar Imagem (PNG)</button>
                  </div>
                </div>
              </div>
            )}

          </section>
        )}

      </main>
    </div>
  );
};

export default PaginaDocumento;
