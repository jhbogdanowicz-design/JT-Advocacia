import React from "react";

interface ModalManualProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalManual: React.FC<ModalManualProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* ── MODAL COMPACTO DE TELA (print:hidden) ── */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 print:hidden animate-fadeIn">
        <div className="bg-white dark:bg-slate-950 border border-[#d4af37]/35 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center transition-colors duration-300">
          
          {/* Ícone e Título */}
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full flex items-center justify-center text-xl text-[#d4af37]">
              📖
            </div>
            <h3 className="font-playfair font-extrabold text-[#0f1e36] dark:text-slate-100 text-base md:text-lg lg:text-xl uppercase tracking-wide">
              Manual do Usuário
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Escritório JT Advogados
            </p>
          </div>

          <p className="text-sm md:text-base lg:text-base text-slate-500 dark:text-slate-400 font-light leading-relaxed">
            Acesse as diretrizes de governança, o fluxo de assinatura digital e a operação da Jus IA em um arquivo PDF timbrado de alta resolução.
          </p>

          {/* Botões de Ação */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full bg-[#0f1e36] text-white hover:bg-slate-800 text-xs font-bold uppercase py-3 rounded-xl border-b-2 border-[#d4af37] shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              📥 Baixar Manual em PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO IMPRESSO (print:block hidden) ── */}
      <div className="hidden print:block bg-white text-black p-8 max-w-5xl mx-auto font-sans leading-relaxed text-xs">
        
        {/* Cabeçalho Timbrado */}
        <div className="flex items-center gap-4 pb-4 border-b-2 border-[#d4af37] mb-8">
          <img src="/logo-jt.png" alt="Logo JT" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="font-playfair font-extrabold text-xl text-[#0f1e36] tracking-wider uppercase m-0">
              Janaina Tarabauca Advogados
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mt-0.5">
              Direito Médico e da Saúde - Manual do Ecossistema
            </p>
          </div>
        </div>

        {/* Corpo do Manual */}
        <div className="space-y-6">
          <h2 className="font-playfair font-extrabold text-lg text-[#0f1e36] border-b border-slate-200 pb-1.5 uppercase tracking-wide">
            Diretrizes Operacionais e Procedimentos Padrão (POPs)
          </h2>

          {/* Jus IA */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-[#0f1e36] uppercase tracking-wider flex items-center gap-1.5">
              🤖 1. Motor Jus IA — Geração de Teses Tripartite
            </h3>
            <p className="text-[11px] text-slate-700 font-light">
              O ecossistema jurídico incorpora a **Jus IA** como inteligência médico-legal padrão. A formulação de peças consome dados clínicos do prontuário e de petições anexadas para redigir peças processuais prontas sob a estrutura tripartite:
            </p>
            <ul className="list-disc pl-5 text-[11px] text-slate-700 font-light space-y-1">
              <li><strong>Dos Fatos:</strong> Narrativa cronológica e detalhada baseada no prontuário médico e na conduta do profissional de saúde.</li>
              <li><strong>Dos Fundamentos Jurídicos:</strong> Embasamento técnico e jurisprudência pacificada sobre erro médico, glosa ou regulamentação do CFM.</li>
              <li><strong>Dos Pedidos:</strong> Pedido lógico contendo liminares de urgência e tutela específica para fornecimento de medicamentos ou procedimentos.</li>
            </ul>
          </div>

          {/* Reset de Contratos */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-[#0f1e36] uppercase tracking-wider">
              📜 2. Gestão de Contratos — Proteção contra Vazamento de Dados
            </h3>
            <p className="text-[11px] text-slate-700 font-light">
              Para assegurar a máxima conformidade com a LGPD e evitar a exibição acidental de dados de prontuários sensíveis:
            </p>
            <ul className="list-disc pl-5 text-[11px] text-slate-700 font-light space-y-1">
              <li>Ao alternar a seleção de cliente no dropdown do prontuário, a interface reativa **limpa automaticamente todos os dados residuais**, rascunhos de minutas e valores anteriores da tela.</li>
              <li>Essa blindagem impede que minutas pré-visualizadas de clientes anteriores permaneçam na memória de renderização ou no clipboard de novos contratos.</li>
            </ul>
          </div>

          {/* Assinatura Digital */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-[#0f1e36] uppercase tracking-wider">
              ✍️ 3. Fluxo de Assinatura Profissional (OAB)
            </h3>
            <p className="text-[11px] text-slate-700 font-light">
              A identificação jurídica do advogado nas peças e minutas geradas conta com um módulo de assinatura reativa integrado:
            </p>
            <ul className="list-disc pl-5 text-[11px] text-slate-700 font-light space-y-1">
              <li><strong>Assinatura Manuscrita:</strong> Desenho direto sobre o painel táctil (canvas) com captura de coordenadas geográficas de traço a lag zero.</li>
              <li><strong>Importação de Imagem:</strong> Possibilidade de subir arquivos de assinatura local em formato PNG. O sistema faz a conversão direta para Base64 segura e persiste a credencial vinculada à OAB do profissional logado.</li>
            </ul>
          </div>

        </div>

        {/* Rodapé de Impressão */}
        <footer className="text-[8px] text-center text-slate-400 border-t border-slate-200 pt-8 mt-12">
          Este manual de consulta foi exportado a partir da Central de Conhecimento do portal Janaina Tarabauca Advogados. Uso restrito e institucional.
        </footer>
      </div>
    </>
  );
};
