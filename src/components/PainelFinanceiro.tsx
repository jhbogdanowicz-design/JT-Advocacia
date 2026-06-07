import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase'; // Ajustar de acordo com a estrutura do projeto

interface ComponenteFinanceiroProps {
  transacaoId: string;
  onSucessoUpload: (url: string) => void;
  areaInteresse: 'Consumidor' | 'Trabalhista' | string;
  profileState?: {
    nome?: string;
    numero_oab?: string;
    url_assinatura_digital?: string;
  };
}

export default function PainelFinanceiro({ 
  transacaoId, 
  onSucessoUpload, 
  areaInteresse,
  profileState 
}: ComponenteFinanceiroProps) {
  
  // Gerenciamento de Estados
  const [estaEditando, setEstaEditando] = useState(false);
  const [minutaGerada, setMinutaGerada] = useState('');
  const [textoContrato, setTextoContrato] = useState('');
  const [valorHonorarios, setValorHonorarios] = useState<number>(0);
  const [copiaECola, setCopiaECola] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [quemSomosAberto, setQuemSomosAberto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const assinaturaImediataRef = useRef<string | null>(null);

  // Configurações Fixas Institucionais
  const CHAVE_PIX_DRA = "nainaja@hotmail.com";
  const NOME_RECEBEDOR = "JANAINA TARABAUCA";
  const CIDADE_RECEBEDOR = "SAO PAULO";

  // Funções Auxiliares do Pix (Padrão EMV / Banco Central)
  const formatarBlocoEMV = (id: string, valor: string) => {
    const tamanho = valor.length.toString().padStart(2, '0');
    return `${id}${tamanho}${valor}`;
  };

  const calcularCRC16 = (str: string) => {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  useEffect(() => {
    if (valorHonorarios <= 0) return;

    const payloadFormatIndicator = formatarBlocoEMV('00', '01');
    const gui = formatarBlocoEMV('00', 'br.gov.bcb.pix');
    const chave = formatarBlocoEMV('01', CHAVE_PIX_DRA);
    const merchantAccountInformation = formatarBlocoEMV('26', `${gui}${chave}`);
    const merchantCategoryCode = formatarBlocoEMV('52', '0000');
    const transactionCurrency = formatarBlocoEMV('53', '986');
    const transactionAmount = formatarBlocoEMV('54', valorHonorarios.toFixed(2));
    const countryCode = formatarBlocoEMV('58', 'BR');
    const merchantName = formatarBlocoEMV('59', NOME_RECEBEDOR.substring(0, 25));
    const merchantCity = formatarBlocoEMV('60', CIDADE_RECEBEDOR.substring(0, 15));
    const txtidLimpo = `JUS${Date.now().toString().slice(-7)}`;
    const referenceLabel = formatarBlocoEMV('05', txtidLimpo);
    const additionalDataFieldTemplate = formatarBlocoEMV('62', referenceLabel);

    const payloadSemCRC = `${payloadFormatIndicator}${merchantAccountInformation}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalDataFieldTemplate}6304`;
    const crcFinal = calcularCRC16(payloadSemCRC);
    
    setCopiaECola(`${payloadSemCRC}${crcFinal}`);
  }, [valorHonorarios]);

  const handleCopiarToken = () => {
    if (!copiaECola) return;
    navigator.clipboard.writeText(copiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // Funções de Upload e Interações Externas
  const dispararSeletorArquivo = () => fileInputRef.current?.click();

  const handleUploadComprovante = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = event.target.files;
    if (!arquivos || arquivos.length === 0) return;

    const arquivoAlvo = arquivos[0];
    const formatosAceitos = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    
    if (!formatosAceitos.includes(arquivoAlvo.type)) {
      alert("Formato de arquivo inválido. Selecione PDF, PNG ou JPEG.");
      return;
    }

    if (arquivoAlvo.size > 5 * 1024 * 1024) {
      alert("O arquivo excede o limite máximo de 5MB.");
      return;
    }

    try {
      setEnviando(true);
      setNomeArquivo(arquivoAlvo.name);

      const extensao = arquivoAlvo.name.split('.').pop();
      const caminhoArquivo = `${transacaoId}/${Date.now()}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(caminhoArquivo, arquivoAlvo, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(caminhoArquivo);

      const urlPublicaComprovante = publicUrlData.publicUrl;

      const { error: dbError } = await supabase
        .from('transacoes')
        .update({ url_comprovante: urlPublicaComprovante })
        .eq('id', transacaoId);

      if (dbError) throw dbError;

      onSucessoUpload(urlPublicaComprovante);

    } catch (error) {
      console.error(error);
      setNomeArquivo(null);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto p-4 transition-colors duration-200">
      
      {/* SEÇÃO SELETA: TRAJETÓRIA E QUEM SOMOS (RETRÁTIL E SOBRIA) */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setQuemSomosAberto(!quemSomosAberto)}
          className="w-full flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-800/40 text-left focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 transition-colors"
        >
          <div>
            <h3 className="text-base font-bold text-[#0f1e36] dark:text-white uppercase tracking-wider">
              Quem somos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Histórico institucional e linhas de pesquisa acadêmica</p>
          </div>
          <svg 
            className={`h-5 w-5 text-slate-500 transform transition-transform duration-300 ${quemSomosAberto ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${quemSomosAberto ? 'max-h-[1200px] opacity-100 border-t border-slate-100 dark:border-slate-800' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 md:grid md:grid-cols-2 md:gap-8 items-center bg-white dark:bg-slate-900">
            <div className="space-y-6 font-serif text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                Fundada pela Dra. Janaina Tarabauca do Prado (OAB/SP 501.070), bacharel em Direito e Administração pela Universidade São Judas Tadeu, com especialização em Direito do Trabalho. A banca consolida uma vivência executiva de mais de duas décadas na gestão de operações de alta complexidade, governança de contratos e mitigação de passivos. Essa sólida bagagem operacional confere à Janaina Tarabauca Advocacia uma visão estritamente estratégica e preventiva, unindo a precisão técnica do ecossistema jurídico à realidade prática corporativa de seus clientes.
              </p>
              <p>
                Sua produção intelectual e acadêmica destaca-se pela pesquisa voltada à tutela do direito à saúde e à vida, com ênfase na tese sobre o direito do nascituro e na responsabilidade do Estado e de operadoras no fornecimento de tratamentos médicos essenciais.
              </p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-sans font-bold text-[#0f1e36] dark:text-[#d4af37] tracking-widest uppercase mb-2">
                  Produção Acadêmica e Pesquisa
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  O Direito do Nascituro à Chance de Nascer com Vida – Monografia de Graduação voltada ao Direito Constitucional à Saúde, Planejamento Familiar e Teoria da Perda de uma Chance (USJT, 2021).
                </p>
              </div>
            </div>
            <div className="mt-6 md:mt-0 flex justify-center p-8 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
              <img src="/og-logo-jt.jpg" alt="Monograma JT" className="h-44 w-auto object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* COMPONENTE CENTRAL: AREA DO CONTRATO E IMPRESSÃO EM BLOCO OCULTO */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm relative">
        
        {/* Div Gêmea Oculta de Impressão (Fundo A4) */}
        <div id="contrato-impressao" className="absolute bg-white text-slate-900 font-serif whitespace-pre-line opacity-100 select-none" style={{ top: '-9999px', left: '-9999px', width: '794px', padding: '70px 60px 60px 60px', lineHeight: '1.6', fontSize: '15px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #0f1e36', paddingBottom: '15px' }}>
            <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 'bold', letterSpacing: '2px', color: '#0f1e36', textTransform: 'uppercase' }}>
              Janaina Tarabauca Advocacia
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', letterSpacing: '1px' }}>
              Inscrição OAB/SP nº {profileState?.numero_oab || "__________"}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '35px', fontWeight: 'bold', fontSize: '16px', color: '#0f1e36' }}>
            {areaInteresse === 'Consumidor' && "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E DEFESA DO CONSUMIDOR"}
            {areaInteresse === 'Trabalhista' && "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E CONSULTORIA TRABALHISTA"}
            {areaInteresse !== 'Consumidor' && areaInteresse !== 'Trabalhista' && "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS"}
          </div>
          <div style={{ minHeight: '600px', color: '#1e293b' }}>
            {minutaGerada || textoContrato || ""}
          </div>
          <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', pageBreakInside: 'avoid' }}>
            {(assinaturaImediataRef.current || profileState?.url_assinatura_digital) ? (
              <img src={assinaturaImediataRef.current || profileState?.url_assinatura_digital} alt="Assinatura Digital" style={{ height: '55px', width: 'auto', marginBottom: '5px', objectFit: 'contain', mixBlendMode: 'multiply' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ height: '55px' }} />
            )}
            <div style={{ borderTop: '1px solid #0f1e36', width: '280px', textAlign: 'center', paddingTop: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0f1e36' }}>
              {profileState?.nome || "Dra. Janaina Tarabauca"}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              OAB/SP nº {profileState?.numero_oab || "__________"}
            </div>
          </div>
        </div>

        {/* Interface Visual do Editor */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-[#0f1e36] dark:text-white uppercase tracking-wider">
              Estrutura da Minuta Gerada
            </h3>
            <p className="text-xs text-slate-400">Gerado via sistema de automação JUS IA</p>
          </div>
          <button
            type="button"
            onClick={() => setEstaEditando(!estaEditando)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer select-none ${
              estaEditando ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#0f1e36] hover:bg-[#162a4a] text-white"
            }`}
          >
            {estaEditando ? "Salvar Alterações" : "Editar Conteúdo"}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg min-h-[350px]">
          {estaEditando ? (
            <textarea
              value={minutaGerada || ""} 
              onChange={(e) => { setMinutaGerada(e.target.value); setTextoContrato(e.target.value); }}
              rows={16}
              className="w-full p-5 text-sm md:text-base font-mono text-slate-800 bg-slate-50 border-2 border-[#d4af37]/60 rounded-lg focus:outline-none focus:bg-white shadow-inner leading-relaxed resize-y block dark:bg-slate-800 dark:text-white dark:border-slate-700"
              placeholder="Digite as modificações textuais contratuais necessárias..."
              autoFocus
            />
          ) : (
            <div className="prose max-w-none text-sm md:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-serif bg-slate-50/50 dark:bg-slate-800/40 p-5 rounded-lg border border-slate-100 dark:border-slate-800">
              {minutaGerada || textoContrato || "Nenhuma minuta de contrato gerada para exibição ativa."}
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE CONFIGURAÇÃO DE HONORÁRIOS E EMISSÃO DE FATURAMENTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Formulário Dinâmico de Entrada */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider">
              Definir Honorários de Prestação de Serviços
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-sm font-medium">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                onChange={(e) => setValorHonorarios(Number(e.target.value))}
                className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4af37] bg-white text-slate-800 dark:bg-slate-800 dark:text-white font-medium animate-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-sm font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider">
              Comprovante de Liquidação
            </label>
            <input type="file" ref={fileInputRef} onChange={handleUploadComprovante} accept=".pdf, .png, .jpg, .jpeg" className="hidden" />
            <button
              type="button"
              disabled={enviando}
              onClick={dispararSeletorArquivo}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer w-full select-none border ${
                enviando 
                  ? "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700" 
                  : "bg-white text-[#0f1e36] border-slate-300 hover:bg-slate-50 hover:border-[#d4af37]/60 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
              }`}
            >
              {enviando ? (
                <span>Processando arquivo digital...</span>
              ) : (
                <span>Anexar Comprovante de Pagamento</span>
              )}
            </button>
            {nomeArquivo && !enviando && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                Arquivo vinculado: <span className="font-mono underline truncate max-w-[240px] inline-block align-bottom">{nomeArquivo}</span>
              </p>
            )}
          </div>
        </div>

        {/* MÓDULO EXCLUSIVO DE COBRANÇA PIX (EMISSÃO DINÂMICA) */}
        {valorHonorarios > 0 && (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm max-w-sm mx-auto w-full">
            <h4 className="text-sm font-bold text-[#0f1e36] dark:text-white uppercase tracking-wider mb-0.5">
              Liquidação via Pix
            </h4>
            <p className="text-xs text-slate-400 mb-5 text-center">Utilize o código bidimensional ou copie a linha de caracteres</p>

            <div className="bg-white p-4 rounded-lg shadow-md border border-slate-100 mb-5 flex items-center justify-center">
              {copiaECola ? (
                <QRCodeSVG value={copiaECola} size={170} level="M" includeMargin={false} />
              ) : (
                <div className="w-[170px] h-[170px] bg-slate-100 dark:bg-slate-800 rounded-md" />
              )}
            </div>

            <div className="text-center mb-5">
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Total Emitido</span>
              <span className="text-xl font-black text-[#0f1e36] dark:text-[#d4af37]">
                {valorHonorarios.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopiarToken}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer select-none shadow-sm ${
                copiado ? "bg-emerald-600 text-white" : "bg-[#0f1e36] hover:bg-[#1c3254] text-white dark:bg-slate-800 dark:hover:bg-slate-700"
              }`}
            >
              {copiado ? "Código Copiado" : "Copiar Linha Digitável Pix"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
