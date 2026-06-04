import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase'; // Ajuste o caminho do seu cliente Supabase

interface AnexarComprovanteProps {
  transacaoId: string; // ID da transação financeira para vincular o anexo
  onSucesso: (url: string) => void; // Callback para atualizar a tela principal
}

export default function AnexarComprovante({ transacaoId, onSucesso }: AnexarComprovanteProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  // Gatilho para clicar no input oculto através do botão estilizado
  const dispararSeletorArquivo = () => {
    fileInputRef.current?.click();
  };

  // Função principal de captura e Upload
  const handleUploadComprovante = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = event.target.files;
    if (!arquivos || arquivos.length === 0) return;

    const arquivoAlvo = arquivos[0];
    
    // VALIDAÇÃO DE SEGURANÇA: Restringe a PDF, PNG e JPEG
    const formatosAceitos = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!formatosAceitos.includes(arquivoAlvo.type)) {
      alert("Formato inválido! Por favor, anexe apenas arquivos PDF, PNG ou JPEG.");
      return;
    }

    // Limite de tamanho: 5MB
    if (arquivoAlvo.size > 5 * 1024 * 1024) {
      alert("Arquivo muito pesado! O limite máximo permitido é de 5MB.");
      return;
    }

    try {
      setEnviando(true);
      setNomeArquivo(arquivoAlvo.name);

      // Gera um nome único para o arquivo dentro do Bucket para evitar sobreposição
      const extensao = arquivoAlvo.name.split('.').pop();
      const caminhoArquivo = `${transacaoId}/${Date.now()}.${extensao}`;

      // 1. Upload do arquivo binário para o Supabase Storage Bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(caminhoArquivo, arquivoAlvo, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Captura a URL pública definitiva do arquivo armazenado
      const { data: publicUrlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(caminhoArquivo);

      const urlPublicaComprovante = publicUrlData.publicUrl;

      // 3. Atualiza a tabela financeira no banco vinculando a URL à transação
      const { error: dbError } = await supabase
        .from('financeiro') // Ajustado para o nome real da tabela
        .update({ url_comprovante: urlPublicaComprovante })
        .eq('id', transacaoId);

      if (dbError) throw dbError;

      alert("Comprovante anexado e salvo com sucesso!");
      onSucesso(urlPublicaComprovante);

    } catch (error) {
      console.error("Erro crítico no upload do comprovante:", error);
      alert("Falha ao salvar arquivo no servidor. Tente novamente.");
      setNomeArquivo(null);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      {/* INPUT NATIVO OCULTO: Abre os arquivos do sistema de forma nativa */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadComprovante}
        accept=".pdf, .png, .jpg, .jpeg"
        className="hidden"
      />

      {/* BOTÃO CUSTOMIZADO E RESPONSIVO (Padrão de Luxo da Banca) */}
      <button
        type="button"
        disabled={enviando}
        onClick={dispararSeletorArquivo}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer w-full sm:w-auto select-none border
          ${enviando 
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700" 
            : "bg-white text-[#0f1e36] border-slate-300 hover:bg-slate-50 hover:border-[#d4af37]/60 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
          }`}
        title="Anexar Comprovante de Pagamento"
      >
        {enviando ? (
          <>
            {/* Ícone de Loading Giratório */}
            <svg className="animate-spin h-3.5 w-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Anexando...</span>
          </>
        ) : (
          <>
            {/* Ícone de Clip/Anexo */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>Anexar</span>
          </>
        )}
      </button>

      {/* FEEDBACK DE ARQUIVO SELECIONADO */}
      {nomeArquivo && !enviando && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
          ✓ {nomeArquivo}
        </p>
      )}
    </div>
  );
}
