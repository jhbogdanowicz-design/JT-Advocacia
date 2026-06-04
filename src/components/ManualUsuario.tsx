import React from "react";

export const ManualUsuario: React.FC = () => {
    <div className="min-h-screen bg-white dark:bg-slate-900 text-[#0f1e36] dark:text-slate-100 font-sans selection:bg-[#d4af37]/35 transition-colors duration-300 pb-20 print:bg-white print:text-black print:h-auto print:overflow-visible print:p-0 relative overflow-hidden">
      
      {/* ── Pano de Fundo Suavizado — Gradiente Radial Difuso ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.04)_0%,rgba(15,30,54,0.0)_60%)] pointer-events-none print:hidden" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(15,30,54,0.15)_0%,rgba(7,10,19,0)_65%)] pointer-events-none print:hidden" />
      
      {/* ── CABEÇALHO DO MANUAL (Estilo Papel Timbrado - print:relative) ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm print:relative print:border-none print:shadow-none print:bg-white">
        <div className="flex items-center gap-3">
          <img src="/logo-jt.png" alt="Janaina Tarabauca Advocacia" className="h-10 w-10 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          <div>
            <h1 className="font-playfair font-extrabold text-sm sm:text-base tracking-wider text-[#0f1e36] dark:text-slate-100 uppercase">
              Manual de Operação e Procedimentos Internos
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#d4af37] font-bold mt-0.5">
              Diretrizes de uso do Ecossistema Digital - Janaina Tarabauca Advocacia
            </p>
          </div>
        </div>

        <button 
          type="button" 
          onClick={() => window.print()} 
          className="bg-[#0f1e36] text-white hover:bg-slate-800 text-xs font-bold uppercase px-5 py-3 rounded border-b-2 border-[#d4af37] print:hidden transition-all shadow-md cursor-pointer active:scale-[0.98]"
        >
          🖨️ IMPRIMIR / SALVAR MANUAL (PDF)
        </button>
      </header>

      {/* Timbrado Exclusivo para Mídia Física (PDF / Papel) */}
      <div className="hidden print:flex print:items-center print:gap-4 pb-4 border-b-2 border-[#d4af37] mb-8 max-w-4xl mx-auto px-6">
        <img src="/logo-jt.png" alt="Janaina Tarabauca Advocacia" className="h-12 w-12 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
        <div>
          <h2 className="font-playfair font-extrabold text-xl text-[#0f1e36] tracking-wider uppercase m-0">
            Janaina Tarabauca Advocacia
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#d4af37] font-bold mt-0.5">
            Direito Médico e da Saúde - Documento de Diretrizes Internas
          </p>
        </div>
      </div>

      {/* ── CORPO DO MANUAL ── */}
      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-12 print:h-auto print:overflow-visible">
        
        {/* Introdução Sóbria */}
        <section className="space-y-3 print:text-left text-center md:text-left">
          <h2 className="font-playfair font-extrabold text-2xl md:text-3xl text-[#0f1e36] dark:text-slate-100 leading-tight">
            Normas de Governança Digital e Segurança da Informação
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-light max-w-3xl leading-relaxed">
            Este instrumento consolida as diretrizes fundamentais e os procedimentos internos regulamentares para o uso correto das ferramentas operacionais do escritório. A fiel observância destas instruções assegura o padrão de excelência técnica no patrocínio de causas do contencioso médico e garante a total proteção do sigilo profissional de nossos clientes.
          </p>
        </section>

        {/* ── TABELA DE REFERÊNCIA RÁPIDA ── */}
        <section className="space-y-4">
          <h3 className="font-playfair font-bold text-xs sm:text-sm uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
            📋 Tabela de Referência Rápida dos Módulos
          </h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm font-light">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-[#0f1e36] dark:text-slate-200 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">Módulo de Trabalho</th>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">Funcionalidade Principal</th>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">Mecanismo de Proteção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-600 dark:text-slate-400">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#0f1e36] dark:text-slate-200">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-[#0f1e36] text-white border border-[#d4af37]">MÓDULO 1</span>
                    <span className="ml-2 block sm:inline mt-1 sm:mt-0">Gestão de Casos e IA</span>
                  </td>
                  <td className="px-6 py-4">Estruturação de teses jurídicas com base no histórico do cliente.</td>
                  <td className="px-6 py-4">Geração em Fatos, Fundamentos Jurídicos e Pedidos.</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#0f1e36] dark:text-slate-200">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-[#0f1e36] text-white border border-[#d4af37]">MÓDULO 2</span>
                    <span className="ml-2 block sm:inline mt-1 sm:mt-0">Contratos e Compliance</span>
                  </td>
                  <td className="px-6 py-4">Geração de minutas com reset preventivo de dados.</td>
                  <td className="px-6 py-4">Blindagem contra vazamento cruzado de informações.</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#0f1e36] dark:text-slate-200">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-[#0f1e36] text-white border border-[#d4af37]">MÓDULO 3</span>
                    <span className="ml-2 block sm:inline mt-1 sm:mt-0">Assinatura Digital</span>
                  </td>
                  <td className="px-6 py-4">Carregamento e fixação de rubrica nos documentos.</td>
                  <td className="px-6 py-4">Calibração suave de assinatura em PNG transparente.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── MÓDULO 1: GESTÃO DE CASOS E JUS IA ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xl">⚖️</span>
            <h3 className="font-playfair font-extrabold text-base md:text-lg lg:text-xl text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
              Módulo 1: Gestão de Casos e Inteligência Artificial (Jus IA)
            </h3>
          </div>

          <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light">
            O fluxo contencioso que envolve a defense ou responsabilização profissional de médicos, clínicas e hospitais exige precisão absoluta na consolidação de dados fáticos e científicos. Para estruturar teses perfeitas, siga estritamente as etapas descritas abaixo:
          </p>

          {/* Guia de Passo a Passo Numerado */}
          <div className="space-y-4">
            <div className="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-sm font-bold text-[#d4af37]">
                01
              </span>
              <div className="space-y-1 bg-transparent">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25">
                  Preparação e histórico
                </span>
                <h4 className="text-sm md:text-base font-extrabold text-[#0f1e36] dark:text-slate-200">Seleção e Carregamento do Caso</h4>
                <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                  Na tabela principal de processos, clique diretamente sobre o **"Número do Processo/Procedimento"**. O sistema irá capturar e cruzar de forma invisível o histórico clínico completo do cliente com o teor técnico do caso em andamento, reunindo os elementos essenciais para a defesa.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-sm font-bold text-[#d4af37]">
                02
              </span>
              <div className="space-y-1 bg-transparent">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350">
                  Instrução do Feito
                </span>
                <h4 className="text-sm md:text-base font-extrabold text-[#0f1e36] dark:text-slate-200">Upload de Documentos de Suporte</h4>
                <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                  Utilize o botão de carregamento localizado nos detalhes do processo para subir arquivos textuais em formato **PDF ou TXT** (como prontuários hospitalares complementares, pareceres de assistentes técnicos e laudos periciais).
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-sm font-bold text-[#d4af37]">
                03
              </span>
              <div className="space-y-1 bg-transparent">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  Estruturação do Rascunho
                </span>
                <h4 className="text-sm md:text-base font-extrabold text-[#0f1e36] dark:text-slate-200">Geração de Teses por Inteligência Artificial (Jus IA)</h4>
                <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                  O motor da Jus IA já nasce integrado ao fluxo de trabalho. Ao comandar a ferramenta, ela estruturará automaticamente as teses com base na doutrina clássica do direito: **Dos Fatos** (narrativa médica minuciosa), **Dos Fundamentos Jurídicos** (invocando a responsabilidade civil subjetiva/objetiva e as resoluções vigentes do CFM/leis aplicáveis) e **Dos Pedidos** (requerimentos específicos e conclusões lógicas da petição).
                </p>
              </div>
            </div>
          </div>

          {/* Bloco de Alerta Especial (Blockquote com borda dourada grossa) */}
          <blockquote className="border-l-4 border-[#d4af37] bg-slate-50 dark:bg-slate-900/40 p-4 rounded-r-xl my-4 text-sm md:text-base lg:text-base text-slate-750 dark:text-slate-350 leading-relaxed font-normal shadow-sm">
            <span className="font-bold text-[#0f1e36] dark:text-[#d4af37] block mb-1">⚠️ NOTA DE SEGURANÇA JURÍDICA:</span>
            A tecnologia otimiza o rascunho inicial, mas a revisão técnica final e a assinatura da peça são prerrogativas exclusivas do advogado responsável.
          </blockquote>
        </section>

        {/* ── MÓDULO 2: MINUTAS E COMPLIANCE ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xl">🔒</span>
            <h3 className="font-playfair font-extrabold text-base md:text-lg lg:text-xl text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
              Módulo 2: Controle de Contratos e Segurança de Dados (Compliance)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloco 1: Blindagem de Dados */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 bg-slate-50/20">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25">
                  Segurança LGPD
                </span>
                <span className="text-xs text-slate-400">Sigilo Absoluto</span>
              </div>
              <h4 className="font-playfair font-bold text-sm md:text-base text-[#0f1e36] dark:text-slate-200 uppercase">
                Limpeza Automática de Dados na Tela
              </h4>
              <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                Ao alternar ou selecionar um novo cliente no menu de Contratos/Minutas, o sistema realiza um **"reset" preventivo automático** de segurança, limpando rigorosamente qualquer informação, valor ou rascunho do cliente anterior. Isso impede de forma absoluta o cruzamento acidental de dados confidenciais entre demandas distintas, em total conformidade com a LGPD e o sigilo profissional da OAB.
              </p>
            </div>

            {/* Bloco 2: Faturamento e Cobrança */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 bg-slate-50/20">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  Gestão Financeira
                </span>
                <span className="text-xs text-slate-400">Emissão Rápida</span>
              </div>
              <h4 className="font-playfair font-bold text-sm md:text-base text-[#0f1e36] dark:text-slate-200 uppercase">
                Emissão de Cobrança e Faturamento
              </h4>
              <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                Para emitir as ordens de pagamento, PIX e boletos vinculados a honorários contratuais ou notas fiscais emitidas: acione a guia financeira, registre os lançamentos acordados no contrato e emita o documento de cobrança com apenas um clique. O sistema gera a chave de transferência instantânea e atualiza o histórico financeiro do cliente em tempo real.
              </p>
            </div>

          </div>
        </section>

        {/* ── MÓDULO 3: ASSINATURA DIGITAL ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xl">✍️</span>
            <h3 className="font-playfair font-extrabold text-base md:text-lg lg:text-xl text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
              Módulo 3: Assinatura Digital do Advogado
            </h3>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-playfair font-bold text-sm md:text-base text-[#0f1e36] dark:text-slate-200 uppercase">
                Calibração e Upload da Rubrica Eletrônica
              </h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37] text-[#0f1e36]">
                Validade Jurídica
              </span>
            </div>
            
            <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light">
              Para conferir autenticidade e validade formal às peças produzidas pelo escritório, cadastre e calibre sua rubrica. Acesse a área de Perfil do Advogado para configurar a assinatura digital:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-light text-slate-600 dark:text-slate-400">
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-250 dark:border-slate-850">
                <span className="font-bold text-sm md:text-base text-[#0f1e36] dark:text-slate-200 block mb-1">✍️ Captura Manual (Táctil)</span>
                <p className="text-xs sm:text-sm md:text-base leading-relaxed">
                  Desenhe sua rubrica diretamente no painel digital sensível ao toque. O módulo foi otimizado para que a gravação do traço aconteça em tempo real, de forma extremamente fluida e sem travamentos.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-250 dark:border-slate-850">
                <span className="font-bold text-sm md:text-base text-[#0f1e36] dark:text-slate-200 block mb-1">📁 Upload em Formato PNG Transparente</span>
                <p className="text-xs sm:text-sm md:text-base leading-relaxed">
                  Suba uma imagem de sua rubrica oficial digitalizada, prioritariamente em **formato PNG com fundo transparente**. O sistema fará a calibração automática para que o selo seja assentado com perfeição nas folhas de impressão e exportações.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO: DIRETRIZES DE IMPRESSÃO DE PEÇAS ── */}
        <section className="space-y-6 print:h-auto print:overflow-visible">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xl">🖨️</span>
            <h3 className="font-playfair font-extrabold text-base md:text-lg lg:text-xl text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
              Diretrizes de Impressão de Peças e Exportação
            </h3>
          </div>

          <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light">
            O ecossistema conta com folhas de estilo ultra-calibradas para assegurar a perfeita formatação dos documentos de acordo com o padrão do Judiciário:
          </p>

          <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <p className="text-sm md:text-base lg:text-base text-slate-600 dark:text-slate-400 font-light leading-relaxed">
              Utilize o botão **"Imprimir / Gerar PDF"** presente no topo das telas de Processos e Contratos para exportar petições, teses e minutas contratuais sem cortes de página e com diagramação limpa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-light text-slate-600 dark:text-slate-400">
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="font-bold text-sm md:text-base text-[#0f1e36] dark:text-slate-200 block mb-1">✓ Sem Margens ou Cortes</span>
                <p className="text-xs sm:text-sm md:text-base leading-relaxed">
                  Todo o texto gerado expande-se verticalmente de forma inteligente, garantindo que o teor completo seja impresso nas folhas, sem cortes nas quebras de página.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="font-bold text-sm md:text-base text-[#0f1e36] dark:text-slate-200 block mb-1">✓ Ocultação de Botões</span>
                <p className="text-xs sm:text-sm md:text-base leading-relaxed">
                  As barras laterais de navegação, painéis de botões e itens interativos somem automaticamente da versão final impressa, mantendo apenas o texto timbrado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Rodapé Interno */}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-6 text-center text-xs text-slate-400 font-light print:block hidden">
          Este manual de diretrizes corporativas é de uso restrito e confidencial de Janaina Tarabauca Advocacia.
        </footer>

      </main>
    </div>
  );
};

export default ManualUsuario;
