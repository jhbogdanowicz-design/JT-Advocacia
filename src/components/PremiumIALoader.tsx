import React, { useState, useEffect } from "react";

interface PremiumIALoaderProps {
  progressPercent?: number;
}

export const PremiumIALoader: React.FC<PremiumIALoaderProps> = ({ progressPercent }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Analisando histórico clínico...",
    "Cruzando dados do prontuário...",
    "Fundamentando tese jurídica...",
    "Consultando jurisprudência atualizada...",
    "Estruturando argumentos de Direito da Saúde...",
    "Revisando conformidade ética e técnica..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-50/50 dark:bg-[#070a13]/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 flex flex-col items-center justify-center gap-6 shadow-xl backdrop-blur-sm animate-fadeIn relative overflow-hidden print:hidden">
      {/* Background Radial Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Luxury Golden Loading Ring */}
      <div className="relative flex items-center justify-center w-20 h-20">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 border-4 border-[#d4af37]/10 rounded-full"></div>
        {/* Animated spinning gold border */}
        <div className="absolute inset-0 border-4 border-transparent border-t-[#d4af37] border-r-[#d4af37] rounded-full animate-spin"></div>
        {/* Inner static luxury symbol */}
        <span className="text-2xl animate-pulse">⚖️</span>
      </div>

      <div className="space-y-2 text-center max-w-sm">
        <h4 className="font-playfair font-bold text-[#0f1e36] dark:text-slate-100 text-sm tracking-wide">
          Jus IA da Dra. Janaina Tarabauca
        </h4>
        <div className="h-6 flex items-center justify-center">
          <p className="text-xs text-[#d4af37] font-medium tracking-wide animate-pulse">
            {messages[messageIndex]}
          </p>
        </div>
        <p className="text-[10px] text-slate-400 font-light mt-1">
          A inteligência artificial avançada está redigindo seu documento sob medida...
        </p>
      </div>

      {progressPercent !== undefined && (
        <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
          <div className="bg-[#d4af37] h-1 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      )}
    </div>
  );
};
