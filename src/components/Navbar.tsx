import { useState } from 'react';

export default function Navbar() {
  // Estado para controlar a abertura do menu hamburger no mobile
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <nav className="w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          
          {/* BRAND / LOGOTIPO RESPONSIVO */}
          <div className="flex items-center gap-3">
            {/* Aqui entra a imagem do seu logo JT (PHOTO-2026-01-31-09-20-42.jpg) */}
            <img 
              src="/og-logo-jt.jpg" 
              alt="Logo JT" 
              className="h-10 w-auto object-contain dark:invert-0" 
            />
            <span className="font-serif font-bold text-base md:text-lg tracking-wider text-[#0f1e36] dark:text-white hidden sm:block">
              JANAINA TARABAUCA
            </span>
          </div>

          {/* NAVEGAÇÃO DESKTOP: Invisível no mobile, perfeitamente espaçada no monitor */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0f1e36] dark:hover:text-[#d4af37] transition-colors">Início</a>
            <a href="#prontuario" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0f1e36] dark:hover:text-[#d4af37] transition-colors">Prontuário</a>
            <a href="#financeiro" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0f1e36] dark:hover:text-[#d4af37] transition-colors">Financeiro</a>
            
            {/* Botão de Ação Destacado */}
            <button className="bg-[#0f1e36] dark:bg-slate-800 border dark:border-[#d4af37]/30 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1c3254] dark:hover:bg-slate-700 transition-all shadow-sm">
              Área Restrita
            </button>
          </div>

          {/* BOTÃO DO MENU HAMBURGER: Visível APENAS no mobile */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="text-slate-600 dark:text-slate-300 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-all"
              aria-label="Abrir menu"
            >
              {menuAberto ? (
                /* Ícone de Fechar (X) */
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                /* Ícone de Menu (Três Linhas) */
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* PAINEL MOBILE: Desce suavemente quando o hamburger é clicado */}
      <div 
        className={`md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out overflow-hidden ${
          menuAberto ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-2">
          <a 
            href="#inicio" 
            onClick={() => setMenuAberto(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            Início
          </a>
          <a 
            href="#prontuario" 
            onClick={() => setMenuAberto(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            Prontuário
          </a>
          <a 
            href="#financeiro" 
            onClick={() => setMenuAberto(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            Financeiro
          </a>
          
          <div className="pt-2 px-3">
            <button className="w-full bg-[#0f1e36] text-white py-2.5 rounded-lg text-sm font-semibold active:scale-98 shadow-sm">
              Área Restrita
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
