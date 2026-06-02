import React from "react";

export const ManualUsuario: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-[#0f1e36] dark:text-slate-100 font-sans selection:bg-[#d4af37]/35 transition-colors duration-300 pb-20 print:bg-white print:text-black">
      
      {/* ── CABEÇALHO DO MANUAL (Estilo Papel Timbrado - print:relative) ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm print:relative print:border-none print:shadow-none print:bg-white">
        <div className="flex items-center gap-3">
          <img src="/logo-jt.png" alt="JT Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="font-playfair font-extrabold text-sm md:text-base tracking-wide text-[#0f1e36] dark:text-slate-100 uppercase">
              Manual de Operação e Procedimentos Internos
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold mt-0.5">
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
        <img src="/logo-jt.png" alt="JT Logo" className="h-12 w-12 object-contain" />
        <div>
          <h2 className="font-playfair font-extrabold text-xl text-[#0f1e36] tracking-wider uppercase m-0">
            Janaina Tarabauca Advocacia
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mt-0.5">
            Direito Médico e da Saúde - Documento de Diretrizes Internas
          </p>
        </div>
      </div>

      {/* ── CORPO DO MANUAL ── */}
      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-12">
        
        {/* Introdução Sóbria */}
        <section className="space-y-3 print:text-left text-center md:text-left">
          <h2 className="font-playfair font-extrabold text-2xl md:text-3xl text-[#0f1e36] dark:text-slate-100 leading-tight">
            Normas de Governança Jurídica Digital
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-light max-w-3xl leading-relaxed">
            Este instrumento consolida as instruções fundamentais e os procedimentos operacionais para utilização das ferramentas de apoio cognitivo e segurança de informações. A observância destas regras assegura a excelência no patrocínio de causas médico-hospitalares e a proteção estrita do sigilo profissional.
          </p>
        </section>

        {/* ── TABELA DE REFERÊNCIA RÁPIDA ── */}
        <section className="space-y-4">
          <h3 className="font-playfair font-bold text-xs uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
            📋 Tabela de Referência Rápida de Módulos
          </h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs font-light">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-[#0f1e36] dark:text-slate-200 font-bold uppercase tracking-wider text-[9px]">
                <tr>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">Módulo Operativo</th>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">Objetivo Principal</th>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">Garantia / Proteção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-600 dark:text-slate-400">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#0f1e36] dark:text-slate-200">1. Prontuário &amp; Casos</td>
                  <td className="px-6 py-4">Cruzamento clínico de processos com IA médico-legal.</td>
                  <td className="px-6 py-4">Tese na estrutura de Fatos, Fundamento e Pedidos.</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#0f1e36] dark:text-slate-200">2. Minutas e Cobrança</td>
                  <td className="px-6 py-4">Contratos de honorários e emissão de cobranças reativas.</td>
                  <td className="px-6 py-4">Blindagem automática de dados de pacientes (Limpeza de tela).</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#0f1e36] dark:text-slate-200">3. Perfil &amp; OAB</td>
                  <td className="px-6 py-4">Assinatura digital e credenciamento nos atos processuais.</td>
                  <td className="px-6 py-4">Desenho manual instantâneo ou carregamento em Base64.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── MÓDULO 1: GESTÃO DE PROCESSOS E AUXÍLIO COGNITIVO JUS IA ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xl">⚖️</span>
            <h3 className="font-playfair font-extrabold text-sm md:text-base text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
              Módulo 1: Gestão de Processos e Inteligência Auxiliar
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
            O fluxo contencioso de Direito Médico exige precisão cirúrgica no cruzamento de dados técnicos de saúde com a matéria legal de defesa. Siga rigorosamente o passo a passo abaixo para estruturação de novos pareceres ou iniciais:
          </p>

          {/* Guia de Passo a Passo Numerado */}
          <div className="space-y-4">
            <div className="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-xs font-bold text-[#d4af37]">
                01
              </span>
              <div className="space-y-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25">
                  Seleção do Caso
                </span>
                <h4 className="text-xs font-bold text-[#0f1e36] dark:text-slate-200">Cruzamento de Histórico Processual</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  Na tela de listagem de processos judiciais, clique diretamente sobre o <strong>Número do Processo</strong> ou sobre o nome do cliente. O painel reativo capturará de forma imediata o histórico clínico consolidado do prontuário do paciente correspondente, vinculando-o ao caso aberto.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-xs font-bold text-[#d4af37]">
                02
              </span>
              <div className="space-y-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350">
                  Documentação Técnica
                </span>
                <h4 className="text-xs font-bold text-[#0f1e36] dark:text-slate-200">Anexar Prontuários e Laudos Periciais</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  Utilize o painel de anexos nos detalhes do processo selecionado para carregar prontuários complementares, receitas, laudos médicos emitidos ou perícias do assistente técnico. Formatos autorizados: documentos textuais limpos ou relatórios em folha padrão (PDF e TXT).
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-xs font-bold text-[#d4af37]">
                03
              </span>
              <div className="space-y-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  Elaboração da Peça
                </span>
                <h4 className="text-xs font-bold text-[#0f1e36] dark:text-slate-200">Geração de Estrutura Tripartite de Tese</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  Acione o motor auxiliar pré-selecionado para iniciar a redação. A tecnologia processará os fatos em conjunto com a doutrina médico-legal para consolidar em tempo real um rascunho de defesa ou petição inicial dividida estritamente em: **Dos Fatos** (histórico médico da conduta), **Dos Fundamentos Jurídicos Técnicos** (responsabilidade civil subjetiva/objetiva e resoluções do Conselho Federal de Medicina) e **Dos Pedidos** (pleitos específicos de condenação ou tutela de urgência).
                </p>
              </div>
            </div>
          </div>

          {/* Bloco de Alerta Especial (Blockquote) */}
          <blockquote className="border-l-4 border-amber-500 bg-amber-50/60 dark:bg-amber-950/10 p-4 rounded-r-xl my-4 text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-light">
            <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">⚠️ NOTA DE SEGURANÇA JURÍDICA:</span>
            A tecnologia embarcada funciona exclusivamente como assistente cognitivo para otimizar a redação preliminar de rascunhos. A revisão técnica-legal do conteúdo gerado, a formatação das teses, a juntada final de provas e a assinatura digital da petição constituem prerrogativa intelectual exclusiva do advogado responsável pelo caso.
          </blockquote>
        </section>

        {/* ── MÓDULO 2: MINUTAS, CONTRATOS E FATURAMENTO INTEGRADO ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xl">📜</span>
            <h3 className="font-playfair font-extrabold text-sm md:text-base text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
              Módulo 2: Minutas, Contratos e Compliance de Dados
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloco 1: Blindagem de Dados */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 bg-slate-50/20">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25">
                Segurança LGPD
              </span>
              <h4 className="font-playfair font-bold text-xs text-[#0f1e36] dark:text-slate-200 uppercase">
                Limpeza de Tela e Proteção de Sigilo Médico
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                Com o objetivo de evitar o cruzamento de informações sigilosas ou o vazamento acidental de dados sensíveis entre pacientes corporativos de consultórios distintos, o sistema incorpora um **módulo de blindagem automática**: ao selecionar um novo cliente na área de elaboração contratual, a tela limpa imediatamente todo e qualquer rascunho, assinaturas, anotações de honorários e valores residuais do cliente anterior.
              </p>
            </div>

            {/* Bloco 2: Faturamento e Cobrança */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 bg-slate-50/20">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Guia Financeiro
              </span>
              <h4 className="font-playfair font-bold text-xs text-[#0f1e36] dark:text-slate-200 uppercase">
                Gestão de Faturamento, PIX e Mensalidades
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                Todas as parcelas geradas de honorários advocatícios ou prestações de consultoria contam com códigos PIX reativos e boletos prontos. Ao gerar a ordem de pagamento, o cliente recebe um link dinâmico "Copia e Cola" e a respectiva liquidação da fatura fiscal é confirmada de forma automatizada por badges flutuantes em tom verde-esmeralda na tela.
              </p>
            </div>

          </div>
        </section>

        {/* ── MÓDULO 3: CREDENCIAMENTO E ASSINATURA DIGITAL DO ADVOGADO ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xl">✍️</span>
            <h3 className="font-playfair font-extrabold text-sm md:text-base text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
              Módulo 3: Credenciamento e Assinatura Eletrônica OAB
            </h3>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h4 className="font-playfair font-bold text-xs text-[#0f1e36] dark:text-slate-200 uppercase">
              Calibração de Assinatura e Dados Profissionais
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Para conferir autenticidade e validade formal às minutas e peças geradas pelo escritório, a credencial profissional da OAB e a assinatura eletrônica devem estar perfeitamente calibradas:
            </p>
            
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-3 font-light list-inside list-disc">
              <li><strong>Assinatura Manuscrita:</strong> Utilize a lousa tátil de captura integrada no seu perfil de advogado para desenhar sua assinatura manuscrita diretamente na tela. O sistema foi calibrado para responder em tempo real, fornecendo traço fluído sem travamentos.</li>
              <li><strong>Importação de ImagemPNG:</strong> Se preferir utilizar sua rubrica digitalizada oficial, clique em "Importar Imagem" para subir arquivos em formato PNG (com fundo transparente). A imagem será convertida eletronicamente e integrada ao banco de forma segura.</li>
            </ul>
          </div>
        </section>

        {/* ── SEÇÃO: DIRETRIZES DE IMPRESSÃO DE PEÇAS ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xl">🖨️</span>
            <h3 className="font-playfair font-extrabold text-sm md:text-base text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
              Diretrizes de Impressão de Peças e Exportação (PDF)
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
            O ecossistema conta com uma folha de estilo de impressão ultra-calibrada para atender às exigências estéticas e formais do Poder Judiciário. Ao acionar o botão de impressão ou exportação presente no topo das telas:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light text-slate-500 dark:text-slate-400">
            <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl space-y-1 border border-slate-150 dark:border-slate-800">
              <span className="font-bold text-[#0f1e36] dark:text-slate-200 block">✓ Ajuste Automático ao Papel A4</span>
              <p className="text-[11px] leading-relaxed">
                Todas as caixas textuais extensas, minutas contratuais e petições adaptam-se de forma inteligente ao papel, expandindo-se sem cortes, margens desalinhadas ou scrollbars visíveis.
              </p>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl space-y-1 border border-slate-150 dark:border-slate-800">
              <span className="font-bold text-[#0f1e36] dark:text-slate-200 block">✓ Eliminação de Ruídos de Tela</span>
              <p className="text-[11px] leading-relaxed">
                A barra de navegação lateral (Sidebar), os botões de ação e os seletores interativos são ocultados de forma automática, mantendo no PDF apenas o teor do texto timbrado institucional.
              </p>
            </div>
          </div>
        </section>

        {/* Rodapé Interno */}
        <footer className="border-t border-slate-200 dark:border-slate-850 pt-6 text-center text-[10px] text-slate-400 font-light print:block hidden">
          Este manual operativo é de uso restrito e confidencial do escritório Janaina Tarabauca Advocacia.
        </footer>

      </main>
    </div>
  );
};

export default ManualUsuario;
