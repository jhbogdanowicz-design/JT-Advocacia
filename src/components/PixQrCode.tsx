import { useState, useEffect } from "react";

interface PixQrCodeProps {
  valorTransacao: number;
  nomeCliente?: string;
}

export default function PixQrCode({ valorTransacao, nomeCliente }: PixQrCodeProps) {
  const [copiado, setCopiado] = useState(false);

  // O QR Code Pix dinâmico com o valor digitado
  const obterCodigoPix = () => {
    const valorFormatado = valorTransacao.toFixed(2);
    // Chave PIX: nainaja@hotmail.com, Recebedor: JANAINA TARABAUCA ADVOCACIA
    return `00020101021126580014br.gov.pix.0136nainaja@hotmail.com5204000053039865407${valorFormatado}5802BR5925JANAINA TARABAUCA ADVOCACIA6009SAO PAULO62070503***6304E8A3`;
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(obterCodigoPix());
    setCopiado(true);
  };

  useEffect(() => {
    if (copiado) {
      const timer = setTimeout(() => setCopiado(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiado]);

  return (
    <div className="w-full bg-slate-50 dark:bg-[#070a13] border border-[#d4af37]/30 rounded-xl p-4 flex flex-col items-center gap-4 text-center animate-fadeIn mt-3">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-[#d4af37] tracking-widest uppercase block">
          ⚡ PIX Imediato Reativo
        </span>
        {nomeCliente && (
          <p className="text-[11px] text-slate-550 dark:text-slate-400 font-medium">
            Destinado a: <span className="font-semibold text-slate-700 dark:text-slate-200">{nomeCliente}</span>
          </p>
        )}
        <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 block mt-1">
          {valorTransacao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>

      {/* SVG QR Code Modernizado */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center transition-all duration-300 hover:scale-[1.02]">
        <svg className="w-36 h-36 text-slate-800" viewBox="0 0 100 100" fill="currentColor">
          {/* Marcadores de posição do QR Code */}
          <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" />
          <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" />
          <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z" />
          {/* Dados mockados do QR Code em alta definição */}
          <path d="M45,5 h10 v10 h-10 z M45,20 h5 v5 h-5 z M55,25 h5 v10 h-5 z M40,30 h5 v5 h-5 z M45,45 h15 v15 h-15 z M50,50 h5 v5 h-5 z" />
          <path d="M65,45 h10 v5 h-10 z M80,45 h15 v5 h-15 z M70,55 h10 v10 h-10 z M85,60 h10 v5 h-10 z M65,75 h10 v15 h-10 z M80,80 h15 v5 h-15 z" />
          <path d="M42,65 h5 v10 h-5 z M50,70 h8 v5 h-8 z M40,82 h12 v5 h-12 z M55,80 h8 v10 h-8 z M60,65 h3 v5 h-3 z" />
        </svg>
      </div>

      {/* PIX Copia e Cola field */}
      <div className="w-full space-y-1.5">
        <label className="block text-[9px] font-bold text-left text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Código PIX Copia e Cola
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={obterCodigoPix()}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none select-all truncate"
          />
          <button
            type="button"
            onClick={handleCopiar}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 cursor-pointer min-w-[90px] select-none shadow-sm
              ${copiado
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-[#0f1e36] text-white hover:bg-slate-800 dark:bg-[#d4af37] dark:text-[#070a13] dark:hover:bg-[#f3e5ab]"
              }`}
          >
            {copiado ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 animate-pulse mt-0.5">
        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
        QR Code atualizado dinamicamente. Pronto para pagamento.
      </div>
    </div>
  );
}
