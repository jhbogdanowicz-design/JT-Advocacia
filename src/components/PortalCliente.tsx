import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// Interfaces de Tipo TypeScript
interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  whatsapp: string;
}

interface Processo {
  id: string;
  numero_processo: string;
  titulo: string;
  area_direito: string;
  status: string;
  tribunal: string;
  vara: string;
  historico_andamentos: string | any[];
}

interface Documento {
  id: string;
  nome: string;
  categoria: "Identificação" | "Comprovantes" | "Peças Iniciais";
  url: string;
  data_upload: string;
}

interface MensagemChat {
  id: string;
  cliente_id: string;
  enviado_por: "Cliente" | "Advogado";
  conteudo: string;
  created_at: string;
}

interface PortalClienteProps {
  transacaoId?: string;
  areaInteresse?: string;
  onSucessoFaturamento?: () => void;
}

const MARCOS_TIMELINE_PADRAO = [
  "Contrato Assinado",
  "Documentos Recebidos",
  "Processo Distribuído",
  "Fase de Contestação",
  "Audiência Designada",
  "Sentença"
];

export const PortalCliente: React.FC<PortalClienteProps> = () => {
  // Estado de Autenticação do Supabase
  const [session, setSession] = useState<any>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [solicitadoOtp, setSolicitadoOtp] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
  const [authErro, setAuthErro] = useState<string | null>(null);

  // Cliente logado vinculado ao e-mail autenticado
  const [clienteLogado, setClienteLogado] = useState<Cliente | null>(null);
  const [loadingDados, setLoadingDados] = useState<boolean>(false);
  const [cadastroNaoEncontrado, setCadastroNaoEncontrado] = useState<boolean>(false);

  // Aba Ativa
  const [abaAtiva, setAbaAtiva] = useState<"dashboard" | "processos" | "documentos" | "mensagens">("dashboard");

  // Dados do Painel
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([
    { id: "doc-01", nome: "RG_CNH_Identificacao.pdf", categoria: "Identificação", url: "#", data_upload: "01/06/2026" },
    { id: "doc-02", nome: "Comprovante_Residencia_Maio.pdf", categoria: "Comprovantes", url: "#", data_upload: "02/06/2026" }
  ]);
  const [mensagensChat, setMensagensChat] = useState<MensagemChat[]>([]);

  // Novo Envio de Mensagem no Chat
  const [novoTextoChat, setNovoTextoChat] = useState<string>("");
  const [enviandoChat, setEnviandoChat] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Upload de Documentos
  const [selectedCategoria, setSelectedCategoria] = useState<"Identificação" | "Comprovantes" | "Peças Iniciais">("Identificação");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Tema
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 1. Sincroniza sessão ativa e escuta mudanças de autenticação
  useEffect(() => {
    const cachedEmail = localStorage.getItem("portal_cliente_email");
    if (cachedEmail) {
      setSession({ user: { email: cachedEmail } });
      buscarClienteEPrefetch(cachedEmail);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          buscarClienteEPrefetch(session.user.email);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(session);
        buscarClienteEPrefetch(session.user.email);
      } else {
        const stillCached = localStorage.getItem("portal_cliente_email");
        if (!stillCached) {
          setClienteLogado(null);
          setProcessos([]);
          setMensagensChat([]);
          setSession(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Observer de Tema
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const theme = root.getAttribute("data-theme");
      setIsDarkMode(theme === "dark");
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    setIsDarkMode(root.getAttribute("data-theme") === "dark");

    return () => observer.disconnect();
  }, []);

  // 3. Scroll para a última mensagem do chat quando atualizado
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensagensChat, abaAtiva]);

  // Busca o cliente correspondente na tabela "clientes" pelo e-mail
  const buscarClienteEPrefetch = async (email: string) => {
    setLoadingDados(true);
    setCadastroNaoEncontrado(false);

    try {
      const { data: clients, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("email", email);

      if (error) throw error;

      if (!clients || clients.length === 0) {
        setCadastroNaoEncontrado(true);
        setLoadingDados(false);
        return;
      }

      const client = clients[0] as Cliente;
      setClienteLogado(client);

      // Carrega dados associados de forma ordenada
      await carregarDadosBasicos(client.id);

    } catch (err) {
      console.error("[Pre-fetch] Falha ao carregar dados do cliente:", err);
    } finally {
      setLoadingDados(false);
    }
  };

  const carregarDadosBasicos = async (clienteId: string) => {
    try {
      // Processos
      const { data: procs } = await supabase
        .from("processos")
        .select("*")
        .eq("cliente_id", clienteId);

      if (procs) setProcessos(procs as Processo[]);

      // Histórico do Chat (mensagens_portal)
      const { data: chatMsgs } = await supabase
        .from("mensagens_portal")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: true });

      if (chatMsgs) setMensagensChat(chatMsgs as MensagemChat[]);

    } catch (err) {
      console.error("[Pre-fetch] Falha ao consultar processos ou mensagens:", err);
    }
  };

  // Dispara a consulta direta e efetua login imediato se o e-mail estiver cadastrado
  const handleSolicitarMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email) {
      setAuthErro("Informe o seu e-mail cadastrado.");
      return;
    }

    setLoadingAuth(true);
    setAuthErro(null);
    setSolicitadoOtp(false);

    try {
      // Consulta a tabela "clientes" no Supabase para ver se este e-mail existe
      const { data: clients, error: searchError } = await supabase
        .from("clientes")
        .select("*")
        .eq("email", email);

      if (searchError) throw searchError;

      if (!clients || clients.length === 0) {
        setAuthErro("E-mail não cadastrado. Certifique-se de que o e-mail informado coincide com o cadastrado em seu prontuário.");
        return;
      }

      // Se o cliente existe, loga direto salvando no LocalStorage e atualizando estados
      localStorage.setItem("portal_cliente_email", email);
      setSession({ user: { email } });
      await buscarClienteEPrefetch(email);
    } catch (err: any) {
      console.error("[Auth] Erro ao autenticar cliente:", err);
      setAuthErro(err.message || "Erro de conexão ao banco de dados.");
    } finally {
      setLoadingAuth(false);
    }
  };

  // Acesso de Demonstração (Permite testar e navegar sem precisar de e-mail ativo)
  const handleAcessoDemonstrativo = () => {
    setLoadingDados(true);
    const clienteMock: Cliente = {
      id: "mock-cliente-123",
      nome: "Carlos Eduardo de Alencar",
      cpf_cnpj: "123.456.789-00",
      email: "carlos.alencar@exemplo.com.br",
      telefone: "(11) 98765-4321",
      whatsapp: "(11) 98765-4321"
    };

    setClienteLogado(clienteMock);
    
    // Configura Processos de Exemplo
    setProcessos([
      {
        id: "proc-mock-01",
        numero_processo: "1004562-89.2026.8.26.0100",
        titulo: "Ação de Reparação de Danos ao Consumidor (Erro em Reembolso)",
        area_direito: "Direito do Consumidor",
        status: "Contestação apresentada pela parte contrária. Autos conclusos para despacho do juiz de direito.",
        tribunal: "TJSP (Tribunal de Justiça de São Paulo)",
        vara: "3ª Vara Cível da Capital",
        historico_andamentos: [
          { fase: 1, descricao: "Contrato assinado e documentação digitalizada.", data: "15/05/2026" },
          { fase: 2, descricao: "Análise prévia e compilação de provas documentais concluída.", data: "20/05/2026" },
          { fase: 3, descricao: "Ação judicial distribuída e protocolada com sucesso.", data: "25/05/2026" },
          { fase: 4, descricao: "Fase de contestação. Réu apresentou manifestação contrária.", data: "05/06/2026" }
        ]
      }
    ]);

    // Configura Mensagens de Exemplo
    setMensagensChat([
      {
        id: "msg-mock-1",
        cliente_id: "mock-cliente-123",
        enviado_por: "Cliente",
        conteudo: "Olá, Dra. Janaina. Conforme solicitado, acabo de enviar na aba de documentos o comprovante de residência atualizado.",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: "msg-mock-2",
        cliente_id: "mock-cliente-123",
        enviado_por: "Advogado",
        conteudo: "Perfeito, Carlos. Já recebemos os comprovantes e anexamos aos autos do processo. Aguardamos agora a manifestação do juiz.",
        created_at: new Date(Date.now() - 3600000 * 23).toISOString()
      },
      {
        id: "msg-mock-3",
        cliente_id: "mock-cliente-123",
        enviado_por: "Cliente",
        conteudo: "Muito obrigado pelo retorno rápido. Fico no aguardo de mais instruções por aqui.",
        created_at: new Date().toISOString()
      }
    ]);

    setSession({ user: { email: "carlos.alencar@exemplo.com.br" } });
    setLoadingDados(false);
    setAbaAtiva("dashboard");
  };

  // Efetua Logout limpando Supabase, localStorage e estados
  const handleLogout = async () => {
    localStorage.removeItem("portal_cliente_email");
    await supabase.auth.signOut();
    setClienteLogado(null);
    setSession(null);
    setProcessos([]);
    setMensagensChat([]);
  };

  // Envia Mensagem ao Supabase (Chat - mensagens_portal)
  const handleEnviarMensagemChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteLogado) return;
    if (!novoTextoChat.trim()) return;

    setEnviandoChat(true);

    try {
      const novaMsg = {
        cliente_id: clienteLogado.id,
        enviado_por: "Cliente" as const,
        conteudo: novoTextoChat.trim()
      };

      if (clienteLogado.id !== "mock-cliente-123") {
        const { data, error } = await supabase
          .from("mensagens_portal")
          .insert([novaMsg])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          setMensagensChat(prev => [...prev, data[0] as MensagemChat]);
        }
      } else {
        // Simulação local para demonstração
        const msgSimulada: MensagemChat = {
          id: `msg-simulada-${Date.now()}`,
          cliente_id: clienteLogado.id,
          enviado_por: "Cliente",
          conteudo: novoTextoChat.trim(),
          created_at: new Date().toISOString()
        };
        setMensagensChat(prev => [...prev, msgSimulada]);
      }

      setNovoTextoChat("");
    } catch (err: any) {
      console.error("[Chat] Falha ao enviar mensagem:", err);
    } finally {
      setEnviandoChat(false);
    }
  };

  // Handler para Upload de Arquivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !clienteLogado) return;

    const file = files[0];
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileExt = sanitizedName.substring(sanitizedName.lastIndexOf("."));
      const fileName = `${Date.now()}_${sanitizedName.substring(0, sanitizedName.lastIndexOf("."))}${fileExt}`;
      const filePath = `clientes-uploads/${clienteLogado.id}/${fileName}`;

      let fileUrl = "#";

      if (clienteLogado.id !== "mock-cliente-123") {
        const { error: uploadErr } = await supabase.storage
          .from("documentos-cliente")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadErr) throw new Error(uploadErr.message);

        const { data: publicUrlData } = supabase.storage
          .from("documentos-cliente")
          .getPublicUrl(filePath);
        
        fileUrl = publicUrlData.publicUrl || "#";
      }

      const novoDocumento: Documento = {
        id: `uploaded-${Date.now()}`,
        nome: file.name,
        categoria: selectedCategoria,
        url: fileUrl,
        data_upload: new Date().toLocaleDateString("pt-BR")
      };

      setDocumentos(prev => [novoDocumento, ...prev]);
      setUploadSuccess(true);
    } catch (err: any) {
      console.error("[PortalCliente] Erro no upload:", err);
      setUploadError(err.message || "Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── RENDER 1: TELA DE LOGIN (SEM USUÁRIO AUTENTICADO)
  // ─────────────────────────────────────────────────────────────────────────
  if (!session && !clienteLogado) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c1424] text-[#0f1e36] dark:text-slate-100 flex items-center justify-center p-6 transition-all duration-300">
        <div className="w-full max-w-md bg-white dark:bg-[#111c30] rounded-2xl border border-slate-200 dark:border-[#d4af37]/15 shadow-2xl overflow-hidden relative">
          
          {/* Faixa Superior Ouro Nobre */}
          <div className="h-1.5 bg-gradient-to-r from-[#0f1e36] via-[#d4af37] to-[#0f1e36]" />
          
          <div className="p-8 md:p-10 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block">
                Janaina Tarabauca Advocacia
              </span>
              <h2 className="font-playfair text-2xl font-bold tracking-tight">
                Área de Autoatendimento
              </h2>
              <p className="text-xs text-slate-400">
                Entre de forma segura informando o e-mail cadastrado em seu prontuário.
              </p>
            </div>

            {solicitadoOtp ? (
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center space-y-3">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">
                  Link de Acesso Enviado!
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enviamos uma mensagem de confirmação para <strong>{emailInput}</strong>. Abra seu e-mail e clique no link de acesso para entrar.
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/15 leading-relaxed">
                  💡 <strong>Importante:</strong> Caso a mensagem não apareça na sua Caixa de Entrada principal, por favor, <strong>verifique a pasta de Spam ou Lixo Eletrônico</strong>.
                </p>
                <button
                  onClick={() => setSolicitadoOtp(false)}
                  className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest hover:underline bg-transparent border-none mt-2 cursor-pointer"
                >
                  Usar outro e-mail
                </button>
              </div>
            ) : (
              <form onSubmit={handleSolicitarMagicLink} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    E-mail do Titular
                  </label>
                  <input
                    type="email"
                    placeholder="exemplo@e-mail.com.br"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setAuthErro(null);
                    }}
                    className="w-full bg-[#0f1e36]/5 dark:bg-[#070a13]/60 border border-slate-250 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-[#d4af37] transition-all"
                    disabled={loadingAuth}
                  />
                </div>

                {authErro && (
                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg text-rose-500 text-xs text-center font-medium">
                    {authErro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full bg-[#0f1e36] dark:bg-[#d4af37] text-white dark:text-[#0c1424] hover:bg-[#182d4f] dark:hover:bg-[#f3e5ab] font-bold py-3 px-4 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {loadingAuth ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      Acessando...
                    </>
                  ) : (
                    "Acessar Portal"
                  )}
                </button>
              </form>
            )}

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ou Teste Agora</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Acesso Demonstrativo */}
            <button
              onClick={handleAcessoDemonstrativo}
              disabled={loadingAuth}
              className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-dashed border-[#d4af37]/40 text-[#d4af37] hover:text-[#d4af37] py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Acesso de Demonstração (Mock)
            </button>

            <div className="text-center pt-2 text-[9px] text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800">
              Segurança reforçada por autenticação de um único uso (Magic Link). Em conformidade com as diretrizes da OAB e LGPD.
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── RENDER 2: SESSÃO ATIVA, MAS CARREGANDO DADOS OU CADASTRO NÃO ENCONTRADO
  // ─────────────────────────────────────────────────────────────────────────
  if (cadastroNaoEncontrado) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c1424] text-[#0f1e36] dark:text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#111c30] rounded-2xl border border-slate-200 dark:border-[#d4af37]/15 shadow-2xl p-8 text-center space-y-6">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block">
            Acesso Restrito
          </span>
          <h2 className="font-playfair text-xl font-bold">E-mail não cadastrado</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            O e-mail <strong>{session?.user?.email}</strong> foi autenticado com sucesso pelo provedor de acessos, mas não foi encontrado no cadastro de clientes do escritório Janaina Tarabauca Advocacia.
          </p>
          <p className="text-xs text-slate-400">
            Entre em contato com a equipe jurídica para autorizar o seu e-mail no sistema.
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-[#0f1e36] dark:bg-[#d4af37] text-white dark:text-[#0c1424] py-3 rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer border-none"
          >
            Voltar e Sair
          </button>
        </div>
      </div>
    );
  }

  // Visualização de Esqueleto (Skeleton) elegante de Carregamento para evitar lentidão ou travamentos de renderização
  if (loadingDados || !clienteLogado) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c1424] text-[#0f1e36] dark:text-slate-100 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <svg className="animate-spin h-8 w-8 text-[#d4af37] mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
          <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] block">
            Carregando Informações Seguras...
          </span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── RENDER 3: PORTAL AUTENTICADO E DADOS PRONTOS
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#0c1424] text-[#0f1e36] dark:text-slate-100 transition-colors duration-300">
      
      {/* ── SIDEBAR NAV ── */}
      <aside className="w-full md:w-72 bg-[#0f1e36] text-slate-100 flex flex-col border-b md:border-b-0 md:border-r border-[#d4af37]/15">
        
        {/* IDENTIDADE */}
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm tracking-wider text-[#d4af37]">
              JANAINA TARABAUCA
            </span>
            <span className="text-[9px] font-medium tracking-widest text-slate-400 uppercase">
              Área de Autoatendimento
            </span>
          </div>
          
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#d4af37]/10 text-[#d4af37] uppercase tracking-wider border border-[#d4af37]/20">
              Seguro
            </span>
          </div>
        </div>

        {/* ROTAS */}
        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setAbaAtiva("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 outline-none text-left border-none cursor-pointer ${
              abaAtiva === "dashboard"
                ? "bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]"
                : "text-slate-300 hover:bg-slate-800/40"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </button>

          <button
            onClick={() => setAbaAtiva("processos")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 outline-none text-left border-none cursor-pointer ${
              abaAtiva === "processos"
                ? "bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]"
                : "text-slate-300 hover:bg-slate-800/40"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Meus Processos
          </button>

          <button
            onClick={() => setAbaAtiva("documentos")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 outline-none text-left border-none cursor-pointer ${
              abaAtiva === "documentos"
                ? "bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]"
                : "text-slate-300 hover:bg-slate-800/40"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Documentos
          </button>

          <button
            onClick={() => setAbaAtiva("mensagens")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 outline-none text-left border-none cursor-pointer ${
              abaAtiva === "mensagens"
                ? "bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]"
                : "text-slate-300 hover:bg-slate-800/40"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Mensagens
          </button>
        </nav>

        {/* RODAPÉ E LOGOUT */}
        <div className="p-4 border-t border-[#d4af37]/15 bg-black/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-[#d4af37] truncate">
                {clienteLogado.nome}
              </span>
              <span className="text-[8px] text-slate-400 truncate">
                {clienteLogado.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-500 transition-all outline-none bg-transparent cursor-pointer"
              title="Sair do Portal"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-7xl">

        {/* 1. DASHBOARD */}
        {abaAtiva === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block">
                Central de Informações
              </span>
              <h1 className="font-playfair text-3xl font-bold mt-1">
                Prezado(a) {clienteLogado.nome.split(" ")[0]}, seja bem-vindo.
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                Este portal provê acesso seguro e em tempo real a todas as etapas contratuais, andamentos processuais e documentação sob cuidados do escritório Janaina Tarabauca Advocacia.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-[#111c30] p-6 rounded-xl border border-slate-200 dark:border-[#d4af37]/15 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Processos Ativos</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-bold text-[#0f1e36] dark:text-white">
                    {String(processos.length).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-[#22c55e]">Em Andamento</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111c30] p-6 rounded-xl border border-slate-200 dark:border-[#d4af37]/15 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Audiências</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-bold text-[#0f1e36] dark:text-white">00</span>
                  <span className="text-xs text-slate-400">Aguardando Pauta</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111c30] p-6 rounded-xl border border-slate-200 dark:border-[#d4af37]/15 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Documentos Salvos</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-bold text-[#0f1e36] dark:text-white">
                    {String(documentos.length).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-[#d4af37]">Portal Criptografado</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111c30] p-6 rounded-xl border border-slate-200 dark:border-[#d4af37]/15 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Mensagens</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-bold text-[#0f1e36] dark:text-white">
                    {String(mensagensChat.length).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-[#d4af37]">Canal de Diálogo</span>
                </div>
              </div>
            </div>

            <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-xl p-6">
              <h3 className="font-playfair font-bold text-sm text-slate-900 dark:text-white">Aviso de Governança</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Para novos envios de provas documentais de andamento civil, utilize a aba de "Documentos" no menu lateral. Todos os arquivos são analisados previamente pela Dra. Janaina Tarabauca do Prado.
              </p>
            </div>
          </div>
        )}

        {/* 2. PROCESSOS */}
        {abaAtiva === "processos" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block">
                Acompanhamento Oficial
              </span>
              <h1 className="font-playfair text-3xl font-bold mt-1">Meus Processos</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Consulte o status operacional atual e cada passo concluído de suas ações.
              </p>
            </div>

            {processos.length === 0 ? (
              <div className="bg-white dark:bg-[#111c30] rounded-xl border border-slate-200 dark:border-[#d4af37]/15 p-10 text-center text-slate-400 text-sm italic">
                Nenhum processo ativo vinculado ao seu e-mail foi localizado.
              </div>
            ) : (
              processos.map((proc) => {
                let andamentos: any[] = [];
                if (typeof proc.historico_andamentos === "string") {
                  try {
                    andamentos = JSON.parse(proc.historico_andamentos);
                  } catch {
                    andamentos = [];
                  }
                } else if (Array.isArray(proc.historico_andamentos)) {
                  andamentos = proc.historico_andamentos;
                }

                const faseAtual = andamentos.length || 3;

                return (
                  <div key={proc.id} className="bg-white dark:bg-[#111c30] rounded-xl border border-slate-200 dark:border-[#d4af37]/15 shadow-sm p-6 md:p-10 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-6 gap-4">
                      <div>
                        <h2 className="font-playfair text-lg md:text-xl font-bold text-[#0f1e36] dark:text-white">
                          {proc.titulo}
                        </h2>
                        <p className="text-xs text-[#d4af37] font-semibold mt-1">
                          Número: {proc.numero_processo}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase">
                          Área: {proc.area_direito}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="inline-block px-3 py-1 bg-[#d4af37]/10 text-[#d4af37] rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Tramitação Ativa
                        </span>
                        <p className="text-slate-400 text-[10px] mt-1.5 uppercase">
                          {proc.tribunal} - {proc.vara}
                        </p>
                      </div>
                    </div>

                    {/* TIMELINE */}
                    <div className="py-6">
                      {/* Mobile View */}
                      <div className="flex flex-col md:hidden relative border-l-2 border-[#d4af37]/20 pl-6 space-y-8 ml-2">
                        {MARCOS_TIMELINE_PADRAO.map((marco, index) => {
                          const stepNumber = index + 1;
                          const isCompleted = stepNumber <= faseAtual;
                          const isActive = stepNumber === faseAtual;

                          return (
                            <div key={index} className="relative">
                              <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-4 transition-all duration-300 ${
                                isCompleted
                                  ? "bg-[#d4af37] border-white dark:border-[#0c1424] shadow-[0_0_8px_rgba(197,168,92,0.4)]"
                                  : "bg-[#0c1424] border-slate-700"
                              }`} />
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Passo 0{stepNumber}</span>
                                <h4 className={`text-sm font-bold ${isActive ? "text-[#d4af37]" : isCompleted ? "text-slate-800 dark:text-slate-200" : "text-slate-500"}`}>
                                  {marco}
                                </h4>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:flex flex-col space-y-6">
                        <div className="relative flex justify-between items-center w-full px-6">
                          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
                          <div 
                            className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#d4af37] transition-all duration-500 z-0"
                            style={{ width: `${((faseAtual - 1) / (MARCOS_TIMELINE_PADRAO.length - 1)) * 92}%` }}
                          />

                          {MARCOS_TIMELINE_PADRAO.map((_, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = stepNumber <= faseAtual;
                            const isActive = stepNumber === faseAtual;

                            return (
                              <div key={index} className="relative z-10 flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold font-serif transition-all duration-300 ${
                                  isActive
                                    ? "bg-[#d4af37] border-white dark:border-[#111c30] text-[#0f1e36] scale-110 shadow-lg shadow-[#d4af37]/20"
                                    : isCompleted
                                    ? "bg-[#0f1e36] dark:bg-[#0c1424] border-[#d4af37] text-[#d4af37]"
                                    : "bg-[#0f1e36] dark:bg-[#0c1424] border-slate-700 text-slate-500"
                                }`}>
                                  {stepNumber}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {MARCOS_TIMELINE_PADRAO.map((marco, index) => {
                            const isActive = index + 1 === faseAtual;
                            return (
                              <span key={index} className={isActive ? "text-[#d4af37]" : ""}>
                                {marco}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Status Operacional</span>
                          <p className="text-sm mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                            {proc.status}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Última Atualização</span>
                          <p className="text-sm mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                            {andamentos.length > 0
                              ? `${andamentos[andamentos.length - 1].data} - ${andamentos[andamentos.length - 1].descricao}`
                              : "Consultando novas movimentações técnicas no sistema do tribunal."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 3. DOCUMENTOS */}
        {abaAtiva === "documentos" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block">
                Acervo de Evidências
              </span>
              <h1 className="font-playfair text-3xl font-bold mt-1">Meus Documentos</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Envie comprovantes e gerencie arquivos requeridos pelo escritório para instrução de sua defesa.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="bg-white dark:bg-[#111c30] rounded-xl border border-slate-200 dark:border-[#d4af37]/15 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="font-playfair font-bold text-base text-[#0f1e36] dark:text-white">Transmitir Documento</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Selecione a categoria apropriada e envie arquivos digitalizados (PDF ou JPG).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Categoria</label>
                  <select
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value as any)}
                    className="w-full bg-[#0f1e36]/5 dark:bg-[#070a13]/60 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-[#d4af37]/40 transition-all font-semibold uppercase tracking-wider"
                  >
                    <option value="Identificação">Identificação</option>
                    <option value="Comprovantes">Comprovantes</option>
                    <option value="Peças Iniciais">Peças Iniciais</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Upload</label>
                  <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-[#d4af37]/20 rounded-xl p-8 cursor-pointer hover:border-[#d4af37]/60 dark:hover:border-[#d4af37]/40 hover:bg-[#d4af37]/3 transition-all">
                    <svg className="w-8 h-8 text-slate-400 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Selecionar Arquivo</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploading && (
                  <div className="bg-[#d4af37]/5 border border-[#d4af37]/25 rounded-lg p-3 flex items-center justify-center gap-3">
                    <svg className="animate-spin h-4 w-4 text-[#d4af37]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">Carregando Arquivo...</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Arquivo Enviado</span>
                  </div>
                )}

                {uploadError && (
                  <div className="bg-rose-500/5 border border-rose-500/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">Erro</span>
                    <p className="text-[10px] text-slate-400 leading-normal">{uploadError}</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-6">
                {(["Identificação", "Comprovantes", "Peças Iniciais"] as const).map((cat) => {
                  const items = documentos.filter(doc => doc.categoria === cat);

                  return (
                    <div key={cat} className="bg-white dark:bg-[#111c30] rounded-xl border border-slate-200 dark:border-[#d4af37]/15 shadow-sm p-6 space-y-4">
                      <h3 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                        {cat}
                      </h3>

                      {items.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhum arquivo nesta pasta.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                          {items.map(doc => (
                            <div key={doc.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <div>
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{doc.nome}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Transmitido em {doc.data_upload}</p>
                                </div>
                              </div>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#d4af37]/50 hover:text-[#d4af37] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all decoration-none inline-flex"
                              >
                                Visualizar
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. CANAL DE DIÁLOGO (CHAT / MENSAGENS) */}
        {abaAtiva === "mensagens" && (
          <div className="space-y-8 animate-fadeIn flex flex-col h-[calc(100vh-8rem)]">
            
            {/* Header */}
            <div>
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block">
                Comunicação Interna
              </span>
              <h1 className="font-playfair text-3xl font-bold mt-1">Canal de Mensagens</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Converse diretamente com o escritório e mantenha o histórico das discussões jurídicas documentado.
              </p>
            </div>

            {/* Chat Frame */}
            <div className="flex-1 bg-white dark:bg-[#111c30] rounded-xl border border-slate-200 dark:border-[#d4af37]/15 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              
              {/* Messages Thread */}
              <div 
                ref={chatContainerRef}
                className="flex-1 p-6 overflow-y-auto space-y-4 scroll-smooth"
              >
                {mensagensChat.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                    Nenhuma mensagem registrada. Envie uma dúvida abaixo para iniciar a conversa.
                  </div>
                ) : (
                  mensagensChat.map((msg) => {
                    const isSelf = msg.enviado_por === "Cliente";
                    return (
                      <div 
                        key={msg.id}
                        className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-md rounded-2xl p-4 shadow-sm space-y-1.5 ${
                          isSelf
                            ? "bg-[#0f1e36] text-white rounded-tr-none"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/60"
                        }`}>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.conteudo}</p>
                          <span className={`text-[8px] font-semibold block text-right ${
                            isSelf ? "text-slate-400" : "text-slate-500"
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 bg-slate-50 dark:bg-[#0c1424] border-t border-slate-200 dark:border-slate-800/80">
                <form onSubmit={handleEnviarMensagemChat} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <textarea
                      placeholder="Digite sua mensagem para o escritório..."
                      value={novoTextoChat}
                      onChange={(e) => setNovoTextoChat(e.target.value)}
                      rows={2}
                      className="w-full bg-white dark:bg-[#111c30] border border-slate-250 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-250 outline-none focus:border-[#d4af37]/60 transition-all resize-none leading-relaxed"
                      disabled={enviandoChat}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleEnviarMensagemChat(e);
                        }
                      }}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={enviandoChat || !novoTextoChat.trim()}
                    className="bg-[#0f1e36] dark:bg-[#d4af37] text-white dark:text-[#0c1424] hover:bg-[#182d4f] dark:hover:bg-[#f3e5ab] font-bold p-3.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer border-none flex items-center justify-center shadow-md"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default PortalCliente;
