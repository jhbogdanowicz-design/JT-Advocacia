import React, { useState } from 'react';

// ── DEFINIÇÃO DE INTERFACES E TIPOS ──────────────────────────────────────────
export interface ItemBiblioteca {
  id: string;
  nome: string;
  descricao: string;
  url?: string;
  acao?: string;
  tipo: 'link' | 'modal';
  conteudoPreview?: string;
  autoridade?: string;
}

export interface SecaoBiblioteca {
  categoria: string;
  icone: string;
  itens: ItemBiblioteca[];
}

export const PaginaBiblioteca: React.FC = () => {
  // ── ESTADOS DA CENTRAL DE CONHECIMENTO ─────────────────────────────────────
  const [busca, setBusca] = useState<string>('');
  const [secaoAtiva, setSecaoAtiva] = useState<string>('todos');
  const [itemSelecionado, setItemSelecionado] = useState<ItemBiblioteca | null>(null);

  // ── ACERVO MULTIDISCIPLINAR JURÍDICO DEFINITIVO ──────────────────────────────
  const acervoJuridico: SecaoBiblioteca[] = [
    { 
      categoria: "⚖️ Legislação Fundamental e Códigos Pátrios", 
      icone: "🏛️",
      itens: [
        { 
          id: "cf88",
          nome: "Constituição Federal de 1988 (Texto Oficial e Atualizado)", 
          descricao: "Texto Compilado da Carta Magna da República Federativa do Brasil diretamente do Planalto.",
          url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
          tipo: 'link',
          autoridade: "Presidência da República"
        },
        { 
          id: "cc02",
          nome: "Código Civil Brasileiro (Lei nº 10.406/02)", 
          descricao: "Legislação Civil consolidada. Regula as relações jurídicas privadas de pessoas, bens e fatos jurídicos.",
          url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
          tipo: 'link',
          autoridade: "Presidência da República"
        },
        { 
          id: "cpc15",
          nome: "Código de Processo Civil (Lei nº 13.105/15)", 
          descricao: "Diploma processual civil nacional. Disciplina o rito e procedimentos do contencioso cível pátrio.",
          url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm",
          tipo: 'link',
          autoridade: "Presidência da República"
        }
      ]
    },
    { 
      categoria: "💼 Modelos e Práticas Institucionais da Banca", 
      icone: "📝",
      itens: [
        { 
          id: "quota_litis",
          nome: "Contrato de Honorários Advocatícios Padrão (Quota-Litis)", 
          descricao: "Minuta institucional de prestação de serviços jurídicos com cláusula de êxito associada ao resultado econômico.",
          acao: "Visualizar Minuta",
          tipo: 'modal',
          autoridade: "Conselho Federal da OAB",
          conteudoPreview: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E HONORÁRIOS JURÍDICOS

Pelo presente instrumento particular, de um lado, como CONTRATANTE, a parte qualificada no respectivo prontuário eletrônico deste sistema e, de outro lado, como CONTRATADA, JANAINA TARABAUCA ADVOCACIA, sociedade individual de advocacia devidamente inscrita na OAB/SP sob nº 123.456, com sede profissional, resolvem ajustar o presente contrato sob as cláusulas seguintes:

CLÁUSULA PRIMEIRA – DO OBJETO
O objeto do presente instrumento é a prestação de serviços advocatícios para atuação em prol da CONTRATANTE no patrocínio da demanda judicial/administrativa cabível visando à tutela de seus direitos fundamentais e patrimoniais.

CLÁUSULA SEGUNDA – DOS HONORÁRIOS QUOTA-LITIS
Fica pactuado que a CONTRATANTE pagará à CONTRATADA, a título de honorários advocatícios ad êxito (Quota-Litis), o percentual de 20% (vinte por cento) sobre o benefício econômico total auferido na demanda, seja por meio de sentença judicial transitada em julgado, acordo judicial ou extrajudicial.
Parágrafo Único. Os honorários de sucumbência eventualmente fixados pertencerão integralmente à CONTRATADA, conforme assegurado pelo Estatuto da OAB (Lei 8.906/94).

CLÁUSULA TERCEIRA – DAS DESPESAS
Todas as custas processuais, taxas, emolumentos, perícias e despesas de viagem correrão por conta exclusiva da CONTRATANTE, devendo ser antecipadas ou reembolsadas à CONTRATADA mediante a devida comprovação.

CLÁUSULA QUARTA – DO FORO
Para dirimir quaisquer dúvidas oriundas deste instrumento, as partes elegem o Foro da Comarca de São Paulo/SP.

E, por estarem justos e contratados, assinam o presente eletronicamente via sistema JT.`
        },
        { 
          id: "procuracao_ad_judicia",
          nome: "Procuração Geral para o Foro (Ad Judicia et Extra)", 
          descricao: "Outorga de poderes de representação judicial abrangente, apta para instruir distribuição de ações em qualquer grau de jurisdição.",
          acao: "Visualizar Procuração",
          tipo: 'modal',
          autoridade: "Conselho Federal da OAB",
          conteudoPreview: `PROCURAÇÃO AD JUDICIA ET EXTRA

OUTORGANTE: Conforme qualificação constante no prontuário de atendimento do ecossistema de Janaina Tarabauca Advocacia.

OUTORGADOS: JANAINA TARABAUCA, advogada, inscrita na OAB/SP sob o nº 123.456, integrante da sociedade JANAINA TARABAUCA ADVOCACIA, com escritório profissional estabelecido.

PODERES: Pelo presente instrumento, a Outorgante confere à Outorgada amplos poderes contidos na cláusula ad judicia et extra, para representá-la perante qualquer juízo, tribunal ou repartição pública, em qualquer instância, foro ou tribunal do país.

PODERES ESPECIAIS: Confere-se, ainda, poderes especiais para propor ações, apresentar defesas, reconvir, transigir, desistir, receber citações, intimar, firmar compromissos, confessar, dar e receber quitação, levantar alvarás judiciais, requerer ordens de pagamento, interpor recursos de qualquer natureza, substabelecer com ou sem reserva de poderes, e praticar todos os demais atos indispensáveis ao bom e fiel cumprimento deste mandato jurídico.

São Paulo/SP, 1º de junho de 2026.

___________________________________________________
OUTORGANTE`
        },
        { 
          id: "ata_reuniao_alinhamento",
          nome: "Ata de Reunião e Alinhamento Estratégico com Cliente", 
          descricao: "Minuta corporativa para mapeamento de teses jurídicas, alinhamento de fatos probatórios e consolidação de acordos de providências com o cliente.",
          acao: "Visualizar Minuta",
          tipo: 'modal',
          autoridade: "Governança - JT Advocacia",
          conteudoPreview: `ATA DE REUNIÃO E ALINHAMENTO ESTRATÉGICO
DATA: [Inserir Data]
PARTES: Janaina Tarabauca Advocacia e [Nome do Cliente]

1. OBJETIVO DA REUNIÃO
Alinhamento de fatos, definição da tese jurídica principal e mapeamento de riscos e probabilidades de êxito para subsidiar o início da instrução processual ou negociação extrajudicial.

2. FATOS E TESES JURÍDICAS COMPACTUADAS
As partes alinharam a cronologia dos fatos sob a ótica dos documentos comprobatórios anexados ao prontuário do cliente. Acordou-se que a tese principal versará sobre o adimplemento substancial das obrigações contratuais e proteção da boa-fé.

3. PROVIDÊNCIAS E PRAZOS
a) O cliente compromete-se a enviar cópias autenticadas dos extratos e correspondências em até 5 (cinco) dias úteis.
b) O escritório Janaina Tarabauca Advocacia procederá com a elaboração da minuta de petição inicial em até 10 (dez) dias úteis após a entrega integral dos documentos.

4. DECLARAÇÃO DE CIÊNCIA
O cliente declara-se ciente dos riscos processuais informados e aprova a estratégia jurídica acordada para o patrocínio da demanda.`
        }
      ]
    },
    { 
      categoria: "🔒 Governança, Compliance e Prerrogativas OAB", 
      icone: "🛡️",
      itens: [
        { 
          id: "estatuto_oab",
          nome: "Estatuto da Advocacia e da OAB (Lei nº 8.906/94)", 
          descricao: "Norma reguladora da atividade da advocacia, direitos, deveres, prerrogativas e infrações disciplinares.",
          url: "https://www.planalto.gov.br/ccivil_03/leis/l8906.htm",
          tipo: 'link',
          autoridade: "Presidência da República / OAB"
        },
        { 
          id: "publicidade_oab",
          nome: "Provimento de Publicidade Jurídica (OAB nº 205/21)", 
          descricao: "Parâmetros éticos e regras imperativas sobre publicidade, marketing jurídico e presença digital de advogados.",
          url: "https://www.oab.org.br/visualizador/16281/provimento-n-205-2021",
          tipo: 'link',
          autoridade: "Conselho Federal da OAB"
        },
        { 
          id: "cartilha_seguranca_lgpd",
          nome: "Cartilha de Segurança da Informação e LGPD no Escritório", 
          descricao: "Protocolo interno de conformidade de dados pessoais e diretrizes obrigatórias de sigilo da relação cliente-advogado.",
          acao: "Visualizar Cartilha",
          tipo: 'modal',
          autoridade: "Compliance Interno - JT Advocacia",
          conteudoPreview: `CARTILHA INTERNA DE SEGURANÇA DA INFORMAÇÃO E LGPD

Esta Cartilha define as diretrizes corporativas obrigatórias de segurança da informação e tratamento de dados pessoais no âmbito do escritório Janaina Tarabauca Advocacia, sob a égide da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

1. SIGILO PROFISSIONAL E RELAÇÃO DE CONFIANÇA
Todas as informações trocadas com o cliente estão resguardadas sob o manto do sigilo profissional inerente à advocacia. Nenhum dado do cliente pode ser exposto ou compartilhado fora das dependências operacionais do ecossistema do escritório sem prévia aprovação jurídica formal.

2. FLUXO SEGURO DE DADOS PESSOAIS
- Coleta Mínima: Apenas dados estritamente necessários para a defesa técnica são solicitados e armazenados.
- Armazenamento Criptografado: Toda peça processual e arquivo probatório deve ser salvo diretamente nos servidores em nuvem do ecossistema JT.
- Descarte Seguro: Documentos impressos temporários devem ser obrigatoriamente incinerados ou triturados após digitalização.

3. DISPOSITIVOS E CREDENCIAIS
É expressamente proibido o uso de senhas fracas ou compartilhamento de acessos entre colaboradores. A autenticação multifator está ativa e deve ser utilizada para todas as ferramentas corporativas.`
        }
      ]
    }
  ];

  // ── FILTRAGEM DO ACERVO EM TEMPO REAL ──────────────────────────────────────
  const acervoFiltrado = acervoJuridico.map(secao => {
    const itensFiltrados = secao.itens.filter(item => {
      const matchBusca = item.nome.toLowerCase().includes(busca.toLowerCase()) || 
                          item.descricao.toLowerCase().includes(busca.toLowerCase());
      
      // Mapeamento lógico de seções/filtros
      let matchCategoria = true;
      if (secaoAtiva === 'legislacao') {
        matchCategoria = secao.categoria.includes("Legislação");
      } else if (secaoAtiva === 'modelos') {
        matchCategoria = secao.categoria.includes("Modelos");
      } else if (secaoAtiva === 'compliance') {
        matchCategoria = secao.categoria.includes("Governança");
      }

      return matchBusca && matchCategoria;
    });

    return {
      ...secao,
      itens: itensFiltrados
    };
  }).filter(secao => secao.itens.length > 0);

  return (
    <div className="w-full min-h-screen bg-[#fafafc] dark:bg-[#070b12] p-6 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 print:bg-white print:text-black print:p-0 print:m-0">
      
      {/* ── CABEÇALHO DO MÓDULO (PAPEL TIMBRADO PREMIUM) ── */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-[#0c1424] p-6 mb-6 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm gap-4 print:border-none print:shadow-none print:p-0 print:mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-[#0f1e36] p-2.5 rounded-lg border border-[#d4af37]/80 flex items-center justify-center shrink-0">
            <span className="text-xl">📜</span>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-extrabold text-[#0f1e36] dark:text-[#d4af37] uppercase tracking-widest font-serif">
              Central de Conhecimento
            </h1>
            <p className="text-sm md:text-base lg:text-base text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Repositório Corporativo Integrado • Janaina Tarabauca Advocacia
            </p>
          </div>
        </div>
        
        {/* AÇÕES DE EXPORTAÇÃO */}
        <div className="flex gap-2 shrink-0 print:hidden">
          <button 
            type="button" 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-[#0f1e36] hover:bg-[#1b345b] text-white hover:text-[#d4af37] text-xs font-extrabold uppercase tracking-wider px-5 py-3 rounded-lg border border-[#d4af37]/45 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            🖨️ Imprimir Acervo
          </button>
        </div>
      </div>

      {/* ── ALERTA DE GOVERNANÇA E ATUALIZAÇÃO LEGISLATIVA AUTOMÁTICA ── */}
      <div className="mb-6 bg-[#0f1e36]/5 dark:bg-[#0c1424]/60 border-l-4 border-[#d4af37] p-4 rounded-r-lg shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-base shrink-0 text-[#0f1e36] dark:text-[#d4af37]">🛡️</span>
          <div className="flex-1">
            <h4 className="text-xs sm:text-sm font-extrabold text-[#0f1e36] dark:text-[#d4af37] uppercase tracking-wider mb-1">
              Conformidade Regulatória Automática
            </h4>
            <p className="text-sm md:text-base lg:text-base text-slate-650 dark:text-slate-400 leading-relaxed font-medium">
              Para assegurar estrita conformidade com as frequentes alterações legislativas brasileiras, os links externos apontam diretamente para os textos oficiais compilados do <strong>Planalto (Presidência da República)</strong> e do <strong>Conselho Federal da OAB</strong>, garantindo que toda a equipe opere baseada na legislação em vigor atualizada em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* ── BARRA DE FERRAMENTAS DE BUSCA E FILTROS DINÂMICOS (PRINT:HIDDEN) ── */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center print:hidden">
        {/* Campo de Busca */}
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Buscar legislação, códigos, resoluções ou modelos..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0c1424] border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm font-semibold placeholder-slate-400 text-[#0f1e36] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] transition-all shadow-sm"
          />
          <span className="absolute left-3.5 top-3.5 text-xs text-slate-400 select-none">🔍</span>
        </div>

        {/* Categorias de Filtro */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0 select-none scrollbar-thin">
          {[
            { id: 'todos', label: '📂 Todos os Recursos' },
            { id: 'legislacao', label: '⚖️ Códigos' },
            { id: 'modelos', label: '💼 Modelos' },
            { id: 'compliance', label: '🔒 POPs & Compliance' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setSecaoAtiva(btn.id)}
              className="px-4 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer bg-white dark:bg-[#0c1424] text-slate-500 hover:text-[#0f1e36] dark:hover:text-[#d4af37] border border-slate-200/60 dark:border-slate-800 hover:border-[#d4af37]/35"
              style={secaoAtiva === btn.id ? { backgroundColor: '#0f1e36', color: '#fff', borderColor: '#d4af37' } : undefined}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID PRINCIPAL DO ACERVO JURÍDICO ── */}
      {acervoFiltrado.length === 0 ? (
        <div className="w-full bg-white dark:bg-[#0c1424] border border-slate-200/60 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
          <p className="text-sm text-slate-400">Nenhum documento ou código encontrado para o termo pesquisado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:h-auto print:overflow-visible print:block">
          {acervoFiltrado.map((secao, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-[#0c1424] p-6 rounded-xl border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-[#d4af37]/25 flex flex-col justify-between print:bg-white print:border-none print:shadow-none print:p-0 print:mb-8 print:break-inside-avoid print:w-full print:h-auto print:overflow-visible"
            >
              <div>
                {/* Título da Categoria */}
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 print:border-b-2 print:border-slate-300">
                  <span className="text-base select-none">{secao.icone}</span>
                  <h3 className="text-base md:text-lg lg:text-xl font-extrabold tracking-wide text-[#0f1e36] dark:text-[#d4af37] uppercase font-serif">
                    {secao.categoria}
                  </h3>
                </div>

                {/* Lista de Itens */}
                <ul className="flex flex-col gap-3.5 print:h-auto print:overflow-visible">
                  {secao.itens.map((item) => (
                    <li 
                      key={item.id} 
                      className="p-4 bg-[#fafafc] dark:bg-[#060a10] border border-slate-100 dark:border-slate-900 rounded-lg hover:border-[#d4af37]/20 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40 print:bg-white print:border-none print:p-0 print:mb-4"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 font-serif leading-tight">
                            {item.nome}
                          </span>
                          
                          {/* Selo de Órgão Emissor / Autoridade */}
                          {item.autoridade && (
                            <span className="text-[10px] bg-[#d4af37]/10 text-[#a5821c] border border-[#d4af37]/20 px-2 py-0.5 rounded font-bold tracking-widest uppercase shrink-0 print:border-slate-300 print:text-black">
                              {item.autoridade}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm md:text-base lg:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5 print:text-slate-700">
                          {item.descricao}
                        </p>
                        
                        {/* Gatilho de Ação (Apenas na tela, ocultado na impressão) */}
                        <div className="mt-2 text-right print:hidden">
                          {item.tipo === 'link' ? (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f1e36] dark:text-[#d4af37] hover:underline uppercase tracking-wider"
                            >
                              <span>Acessar Fonte Oficial</span>
                              <span className="text-[10px]">↗</span>
                            </a>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => setItemSelecionado(item)} 
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d4af37] dark:text-[#d4af37] hover:underline uppercase tracking-wider cursor-pointer"
                            >
                              <span>{item.acao || "Abrir Minuta"}</span>
                              <span className="text-[10px]">👁️</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            
            {/* Indicador discreto de rodapé de card */}
            <div className="mt-4 pt-3 border-t border-slate-100/50 dark:border-slate-800/50 text-right print:hidden">
              <span className="text-xs text-slate-300 dark:text-slate-600 font-semibold tracking-widest uppercase">
                JT Advocacia • Luxo Sóbrio
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL INTERATIVO PARA VISUALIZAÇÃO DE MINUTAS INSTITUCIONAIS ── */}
      {itemSelecionado && (
        <div className="fixed inset-0 bg-[#0f1e36]/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-[#0c1424] w-full max-w-3xl rounded-xl border border-[#d4af37]/30 shadow-2xl flex flex-col max-h-[85vh] animate-fade-in">
            
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#0f1e36] rounded-t-xl">
              <div>
                <h3 className="text-base md:text-lg lg:text-xl font-extrabold tracking-wide text-[#d4af37] uppercase font-serif">
                  {itemSelecionado.nome}
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Minuta Padrão para Simulação de Instrumentos Jurídicos
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setItemSelecionado(null)} 
                className="text-white hover:text-[#d4af37] text-lg font-bold transition-all px-2.5 py-1 rounded bg-[#ffffff]/10 hover:bg-[#ffffff]/20 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo da Minuta */}
            <div className="p-6 overflow-y-auto font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-[#fafafc] dark:bg-[#060a10] border-b border-slate-100 dark:border-slate-800 whitespace-pre-wrap select-text scrollbar-thin">
              {itemSelecionado.conteudoPreview}
            </div>

            {/* Rodapé do Modal */}
            <div className="px-6 py-4 bg-white dark:bg-[#0c1424] rounded-b-xl flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">
                © Janaina Tarabauca Advocacia • Todos os direitos reservados.
              </span>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const text = itemSelecionado.conteudoPreview || '';
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${itemSelecionado.id}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0f1e36] dark:text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2 rounded transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  📥 Baixar Texto
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-[#0f1e36] hover:bg-[#1b345b] text-white hover:text-[#d4af37] text-xs font-extrabold uppercase tracking-wider px-4 py-2 rounded border border-[#d4af37]/30 transition-all cursor-pointer"
                >
                  🖨️ Imprimir Minuta
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Estilos CSS específicos de impressão injetados via tag style para assegurar suporte total */}
      <style>{`
        @media print {
          body, html {
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:h-auto {
            height: auto !important;
          }
          .print\\:overflow-visible {
            overflow: visible !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:relative {
            position: relative !important;
          }
          .print\\:max-h-none {
            max-height: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PaginaBiblioteca;
