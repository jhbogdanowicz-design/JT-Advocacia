// =========================================================================
// CONFIGURAÇÕES E INICIALIZAÇÃO DO SUPABASE
// =========================================================================
const SUPABASE_URL = "https://cuvhkusitvhygnqbdcyb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dmhrdXNpdHZoeWducWJkY3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTgwNzQsImV4cCI6MjA5NTQ5NDA3NH0.lAJDZpOBwIyqJWV3e96Xf0ntrctv0TWQLGtjEbPa9ao";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================================
// FUNÇÕES AUXILIARES DE MÁSCARA MONETÁRIA (BRL)
// =========================================================================
function formatarMoedaBRL(valor) {
  let v = String(valor).replace(/\D/g, "");
  if (!v) return "";
  let floatVal = parseFloat(v) / 100;
  return floatVal.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function desformatarMoedaBRL(valorFormatado) {
  if (!valorFormatado) return null;
  const limpo = String(valorFormatado)
    .replace(/[^\d,]/g, "")
    .replace(",", ".");
  const parsed = parseFloat(limpo);
  return isNaN(parsed) ? null : parsed;
}

const formatarInputMoedaBRL = (e) => {
  const input = e.target;
  const originalLength = input.value.length;
  let cursorPosition = input.selectionStart;
  const formatado = formatarMoedaBRL(input.value);
  input.value = formatado;
  const newLength = formatado.length;
  cursorPosition = cursorPosition + (newLength - originalLength);
  input.setSelectionRange(cursorPosition, cursorPosition);
};


// =========================================================================
// VARIÁVEIS DE ESTADO GLOBAL (SPA STATE)
// =========================================================================
let activeClientId = null; // Guarda o ID do cliente visualizado no momento
let activeClientObject = null; // Guarda o objeto completo do cliente visualizado no momento

// =========================================================================
// ELEMENTOS DO DOM (MAPEAMENTO)
// =========================================================================
// Containers Principais
const authContainer = document.getElementById("auth-container");
const appLayout = document.getElementById("app-layout");

// Views da Área Pública
const viewLogin = document.getElementById("view-login");
const viewSignup = document.getElementById("view-signup");

// Views da Área Privada (Administrativa)
const contentViews = document.querySelectorAll(".content-view");

// Itens de Navegação da Sidebar
const navItems = document.querySelectorAll(".nav-item");

// Forms & Inputs de Autenticação
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

const signupForm = document.getElementById("signup-form");
const signupTreatment = document.getElementById("signup-treatment");
const signupName = document.getElementById("signup-name");
const signupEmail = document.getElementById("signup-email");
const signupOab = document.getElementById("signup-oab");
const signupPassword = document.getElementById("signup-password");
const signupPasswordConfirm = document.getElementById("signup-password-confirm");

// Links de Navegação Pública
const linkGoSignup = document.getElementById("link-go-signup");
const linkGoLogin = document.getElementById("link-go-login");

// Elementos da Landing Page
const landingContainer = document.getElementById("landing-container");
const btnGoRestricted = document.getElementById("btn-go-restricted");
const btnHeroLogin = document.getElementById("btn-hero-login");
const linksGoLanding = document.querySelectorAll(".link-go-landing");

// Botões de Ação
const btnLoginSubmit = document.getElementById("btn-login-submit");
const btnSignupSubmit = document.getElementById("btn-signup-submit");
const btnLogout = document.getElementById("btn-logout");
const btnLogoutMobile = document.getElementById("btn-logout-mobile");
const btnEditProfileMobile = document.getElementById("btn-edit-profile-mobile");

// Caixas de Feedback
const loginMessage = document.getElementById("login-message");
const signupMessage = document.getElementById("signup-message");
const viewForgotPassword = document.getElementById("view-forgot-password");
const forgotForm = document.getElementById("forgot-form");
const forgotEmail = document.getElementById("forgot-email");
const forgotMessage = document.getElementById("forgot-message");
const btnForgotSubmit = document.getElementById("btn-forgot-submit");
const linkForgotPassword = document.getElementById("link-forgot-password");
const linkBackLogin = document.getElementById("link-back-login");

// Elementos de Perfil do Usuário
const welcomeMessage = document.getElementById("welcome-message");
const sidebarUserName = document.getElementById("sidebar-user-name");
const sidebarUserOab = document.getElementById("sidebar-user-oab");
const sidebarUserAvatar = document.getElementById("sidebar-user-avatar");

// Elementos das Métricas do Dashboard
const metricClientsCount = document.getElementById("metric-clients-count");
const metricEventsCount = document.getElementById("metric-events-count");
const inactiveBadgeCount = document.getElementById("inactive-badge-count");
const inactiveListPlaceholder = document.getElementById("inactive-list-placeholder");
const inactiveProcessesList = document.getElementById("inactive-processes-list");

// =========================================================================
// ELEMENTOS DO MÓDULO DE CLIENTES
// =========================================================================
// Painéis
const clientesListPanel = document.getElementById("clientes-list-panel");
const clientesFormPanel = document.getElementById("clientes-form-panel");
const clientesDetailPanel = document.getElementById("clientes-detail-panel");

// Botões & Controles
const btnNovoCliente = document.getElementById("btn-novo-cliente");
const btnCancelarCadastro = document.getElementById("btn-cancelar-cadastro");
const btnVoltarListagemDetail = document.getElementById("btn-voltar-listagem-detail");
const searchInputClientes = document.getElementById("clientes-search-input");
const listEmptyClientes = document.getElementById("clientes-list-empty");
const gridListClientes = document.getElementById("clientes-grid-list");

// Abas do Formulário de Cadastro
const tabButtons = document.querySelectorAll(".form-tab-btn");
const tabContents = document.querySelectorAll(".form-tab-content");

// Formulário de Cadastro
const clienteForm = document.getElementById("cliente-cadastro-form");
const inName = document.getElementById("client-nome");
const inCpfCnpj = document.getElementById("client-cpf-cnpj");
const inDataNasc = document.getElementById("client-data-nasc");
const inTelefone = document.getElementById("client-telefone");
const inWhatsapp = document.getElementById("client-whatsapp");
const inEmail = document.getElementById("client-email");
const inEstadoCivil = document.getElementById("client-estado-civil");
const inProfissao = document.getElementById("client-profissao");
const inRgIe = document.getElementById("client-rg-ie");
const inCep = document.getElementById("client-cep");
const inRua = document.getElementById("client-endereco-rua");
const inComp = document.getElementById("client-endereco-comp");
const inBairro = document.getElementById("client-endereco-bairro");
const inCidade = document.getElementById("client-endereco-cidade");
const inEstado = document.getElementById("client-endereco-estado");
const inAreasExtra = document.getElementById("client-areas-extra");
const inProcessosAndamento = document.getElementById("client-processos-andamento");
const inTipoAssistencia = document.getElementById("client-tipo-assistencia");
const inRenda = document.getElementById("client-renda");
const inObservacoes = document.getElementById("client-observacoes");

// Toggles Dinâmicos do Formulário de Cadastro
const lblCpfCnpj = document.getElementById("lbl-cpf-cnpj");
const lblDataNasc = document.getElementById("lbl-data-nasc");
const lblProfissao = document.getElementById("lbl-profissao");
const lblRgIe = document.getElementById("lbl-rg-ie");
const groupProcessosAndamento = document.getElementById("group-processos-andamento");

// =========================================================================
// ELEMENTOS DO PROFILE / FICHA DO CLIENTE (EDITÁVEL & 3 SEÇÕES)
// =========================================================================
const clientProfileTitleName = document.getElementById("client-profile-title-name");
const editClienteForm = document.getElementById("edit-cliente-form");

// Abas Internas da Ficha de Perfil
const profileTabButtons = document.querySelectorAll(".profile-tab-btn");
const profileTabContents = document.querySelectorAll(".profile-tab-content");

// Inputs de Edição
const editInName = document.getElementById("edit-client-nome");
const editInCpfCnpj = document.getElementById("edit-client-cpf-cnpj");
const editInDataNasc = document.getElementById("edit-client-data-nasc");
const editInTelefone = document.getElementById("edit-client-telefone");
const editInWhatsapp = document.getElementById("edit-client-whatsapp");
const editInEmail = document.getElementById("edit-client-email");
const editInEstadoCivil = document.getElementById("edit-client-estado-civil");
const editInProfissao = document.getElementById("edit-client-profissao");
const editInRgIe = document.getElementById("edit-client-rg-ie");
const editInCep = document.getElementById("edit-client-cep");
const editInRua = document.getElementById("edit-client-endereco-rua");
const editInComp = document.getElementById("edit-client-endereco-comp");
const editInBairro = document.getElementById("edit-client-endereco-bairro");
const editInCidade = document.getElementById("edit-client-endereco-cidade");
const editInEstado = document.getElementById("edit-client-endereco-estado");
const editInAreasExtra = document.getElementById("edit-client-areas-extra");
const editInProcessosAndamento = document.getElementById("edit-client-processos-andamento");
const editInTipoAssistencia = document.getElementById("edit-client-tipo-assistencia");
const editInRenda = document.getElementById("edit-client-renda");
const editInObservacoes = document.getElementById("edit-client-observacoes");

// Labels Dinâmicos do Formulário de Edição
const editLblCpfCnpj = document.getElementById("edit-lbl-cpf-cnpj");
const editLblDataNasc = document.getElementById("edit-lbl-data-nasc");
const editLblProfissao = document.getElementById("edit-lbl-profissao");
const editLblRgIe = document.getElementById("edit-lbl-rg-ie");
const editGroupProcessosAndamento = document.getElementById("edit-group-processos-andamento");

// Módulo de Compromissos da Ficha
const btnNovoCompromisso = document.getElementById("btn-novo-compromisso");
const badgePrazos = document.getElementById("badge-prazos");
const badgeAudiencias = document.getElementById("badge-audiencias");
const badgeReunioes = document.getElementById("badge-reunioes");
const compromissosEmptyMsg = document.getElementById("compromissos-empty-msg");
const compromissosTimelineList = document.getElementById("compromissos-timeline-list");

// Modais da Aplicação
const modalCompromisso = document.getElementById("modal-compromisso");
const btnCloseModalCompromisso = document.getElementById("btn-close-modal-compromisso");
const compromissoForm = document.getElementById("compromisso-form");

const modalProcessoDetail = document.getElementById("modal-processo-detail");
const btnCloseModalProcesso = document.getElementById("btn-close-modal-processo");

// Módulo de Processos da Ficha
const btnCriarProcessoTrigger = document.getElementById("btn-criar-processo-trigger");
const processosEmptyMsg = document.getElementById("processos-empty-msg");
const processosTimelineListContainer = document.getElementById("processos-timeline-list-container");

// Central de Documentos
const documentosEmptyMsg = document.getElementById("documentos-empty-msg");
const documentosListContainer = document.getElementById("documentos-list-container");
const btnExportarPdfEstrategia = document.getElementById("btn-exportar-pdf-estrategia");

// Dashboard Compromissos
const commitmentsBadgeCount = document.getElementById("commitments-badge-count");
const commitmentsDashboardPlaceholder = document.getElementById("commitments-dashboard-placeholder");
const commitmentsDashboardList = document.getElementById("commitments-dashboard-list");

// Módulo Financeiro (Honorários)
const formLancarHonorario = document.getElementById("form-lancar-honorario");
const finProcessoId = document.getElementById("fin-processo-id");
const finValorTotal = document.getElementById("fin-valor-total");

if (inRenda) inRenda.addEventListener("input", formatarInputMoedaBRL);
if (editInRenda) editInRenda.addEventListener("input", formatarInputMoedaBRL);
if (finValorTotal) finValorTotal.addEventListener("input", formatarInputMoedaBRL);

const finTipoHonorario = document.getElementById("fin-tipo-honorario");
const finStatusPagamento = document.getElementById("fin-status-pagamento");
const finDataVencimento = document.getElementById("fin-data-vencimento");
const finLancamentosEmpty = document.getElementById("fin-lancamentos-empty");
const finLancamentosList = document.getElementById("fin-lancamentos-list");

// Módulo Financeiro Unificado (Modal Geral)
const btnModalLancarTransacao = document.getElementById("btn-modal-lancar-transacao");
const btnModalLancarTransacaoClient = document.getElementById("btn-modal-lancar-transacao-client");
const modalLancamentoFinanceiro = document.getElementById("modal-lancamento-financeiro");
const formModalLancamentoFinanceiro = document.getElementById("form-modal-lancamento-financeiro");
const btnCloseModalFinanceiro = document.getElementById("btn-close-modal-financeiro");
const btnCancelarFinanceiro = document.getElementById("btn-cancelar-financeiro");

const finModalClienteId = document.getElementById("fin-modal-cliente-id");
const finModalProcessoId = document.getElementById("fin-modal-processo-id");
const finModalCategoria = document.getElementById("fin-modal-categoria");
const finModalGrupoTipoHonorario = document.getElementById("fin-modal-grupo-tipo-honorario");
const finModalTipoHonorario = document.getElementById("fin-modal-tipo-honorario");
const finModalGrupoIndenizacao = document.getElementById("fin-modal-grupo-indenizacao");
const finModalValorBruto = document.getElementById("fin-modal-valor-bruto");
const finModalTaxaBanca = document.getElementById("fin-modal-taxa-banca");
const finModalCotaEscritorio = document.getElementById("fin-modal-cota-escritorio");
const finModalCotaCliente = document.getElementById("fin-modal-cota-cliente");
const finModalGrupoValorPadrao = document.getElementById("fin-modal-grupo-valor-padrao");
const finModalValor = document.getElementById("fin-modal-valor");
const finModalVencimento = document.getElementById("fin-modal-vencimento");
const finModalStatus = document.getElementById("fin-modal-status");


// Elementos do Gráfico Financeiro no Dashboard
const financialOverdueAlert = document.getElementById("financial-overdue-alert");
const btnVerFinanceiroAtrasado = document.getElementById("btn-ver-financeiro-atrasado");
const finTotalRecebidoDashboard = document.getElementById("fin-total-recebido-dashboard");
const chartBarFixo = document.getElementById("chart-bar-fixo");
const chartBarMensal = document.getElementById("chart-bar-mensal");
const chartBarExito = document.getElementById("chart-bar-exito");
const chartValFixo = document.getElementById("chart-val-fixo");
const chartValMensal = document.getElementById("chart-val-mensal");
const chartValExito = document.getElementById("chart-val-exito");

// Elementos do Módulo de Contratos
const viewContratos = document.getElementById("view-contratos");
const btnContratosTabMinuta = document.getElementById("btn-contratos-tab-minuta");
const btnContratosTabPlanos = document.getElementById("btn-contratos-tab-planos");
const contratosClientSelect = document.getElementById("contratos-client-select");
const contratosClientPreview = document.getElementById("contratos-client-preview");
const contratosPreviewNome = document.getElementById("contratos-preview-nome");
const contratosPreviewDoc = document.getElementById("contratos-preview-doc");
const contratosPreviewFatos = document.getElementById("contratos-preview-fatos");
const btnContratosEsbocar = document.getElementById("btn-contratos-esbocar");
const btnContratosCopiar = document.getElementById("btn-contratos-copiar");
const contratosMinutaLoading = document.getElementById("contratos-minuta-loading");
const contratosMinutaLoadingStatus = document.getElementById("contratos-minuta-loading-status");
const contratosMinutaTextarea = document.getElementById("contratos-minuta-textarea");

const contratosViewMinuta = document.getElementById("contratos-view-minuta");
const contratosViewPlanos = document.getElementById("contratos-view-planos");
const btnPlanoMensal = document.getElementById("btn-plano-mensal");
const btnPlanoAnual = document.getElementById("btn-plano-anual");
const contratosPlanoInicio = document.getElementById("contratos-plano-inicio");
const contratosPlanoRenovacao = document.getElementById("contratos-plano-renovacao");
const contratosPlanoValor = document.getElementById("contratos-plano-valor");
const btnContratosAtivarPlano = document.getElementById("btn-contratos-ativar-plano");
const btnContratosAtualizarValores = document.getElementById("btn-contratos-atualizar-valores");
const btnContratosRecarregarMensalidades = document.getElementById("btn-contratos-recarregar-mensalidades");
const contratosBillingNoClient = document.getElementById("contratos-billing-no-client");
const contratosBillingLoading = document.getElementById("contratos-billing-loading");
const contratosBillingEmpty = document.getElementById("contratos-billing-empty");
const contratosBillingTableContainer = document.getElementById("contratos-billing-table-container");
const contratosBillingTableBody = document.getElementById("contratos-billing-table-body");

// Modais de faturamento de contratos
const modalContratosBoleto = document.getElementById("modal-contratos-boleto");
const btnCloseModalBoleto = document.getElementById("btn-close-modal-boleto");
const btnCloseBoleto = document.getElementById("btn-close-boleto");
const btnPrintBoleto = document.getElementById("btn-print-boleto");
const modalContratosPix = document.getElementById("modal-contratos-pix");
const btnCloseModalPix = document.getElementById("btn-close-modal-pix");
const btnClosePix = document.getElementById("btn-close-pix");
const pixQrCodeImg = document.getElementById("pix-qr-code-img");
const pixCopiaColaInput = document.getElementById("pix-copia-cola-input");
const btnPixCopiar = document.getElementById("btn-pix-copiar");

// Elementos de Assinatura do Contrato
const contratosAssinaturaContainer = document.getElementById("contratos-assinatura-container");
const contratosCanvasPad = document.getElementById("contratos-canvas-pad");
const contratosCanvasSuccess = document.getElementById("contratos-canvas-success");
const btnContratosLimpar = document.getElementById("btn-contratos-limpar");
const btnContratosConfirmar = document.getElementById("btn-contratos-confirmar");

// Elementos de Impressão de Contrato
const btnContratosPrintPreview = document.getElementById("btn-contratos-print-preview");
const btnContratosPrintSigned = document.getElementById("btn-contratos-print-signed");
const contratosPrintArea = document.getElementById("contratos-print-area");
const contratosPrintPre = document.getElementById("contratos-print-pre");
const contratosPrintWatermark = document.getElementById("contratos-print-watermark");
const contratosPrintWatermarkText = document.getElementById("contratos-print-watermark-text");
const contratosPrintSigImgContainer = document.getElementById("contratos-print-sig-img-container");
const contratosPrintSigImg = document.getElementById("contratos-print-sig-img");
const contratosPrintSigBlank = document.getElementById("contratos-print-sig-blank");
const contratosPrintClientName = document.getElementById("contratos-print-client-name");
const contratosPrintSigTimestamp = document.getElementById("contratos-print-sig-timestamp");
const contratosPrintLawyerSigImg = document.getElementById("contratos-print-lawyer-sig-img");
const contratosPrintLawyerSigFallback = document.getElementById("contratos-print-lawyer-sig-fallback");
const contratosPrintLawyerNameLabel = document.getElementById("contratos-print-lawyer-name-label");

// Elementos de Assinatura da Advogada (Configuração de Perfil)
const lawyerSignatureCanvas = document.getElementById("lawyer-signature-canvas");
const btnLawyerSignatureClear = document.getElementById("btn-lawyer-signature-clear");
const btnLawyerSignatureRedraw = document.getElementById("btn-lawyer-signature-redraw");
const lawyerSignaturePreviewContainer = document.getElementById("lawyer-signature-preview-container");
const lawyerSignaturePreviewImg = document.getElementById("lawyer-signature-preview-img");
let lawyerSignatureIsDrawing = false;
let lawyerSignatureHasDrawing = false;
const lawyerSignatureUpload = document.getElementById("lawyer-signature-upload");
let uploadedSignatureBase64 = null;

// Novos Modais e Elementos de Edição
const btnEditLawyerProfile = document.getElementById("btn-edit-lawyer-profile");
const modalEditLawyer = document.getElementById("modal-edit-lawyer");
const btnCloseModalLawyer = document.getElementById("btn-close-modal-lawyer");
const editLawyerForm = document.getElementById("edit-lawyer-form");
const editLawyerTreatment = document.getElementById("edit-lawyer-treatment");
const editLawyerName = document.getElementById("edit-lawyer-name");
const editLawyerOab = document.getElementById("edit-lawyer-oab");
const editLawyerEmail = document.getElementById("edit-lawyer-email");
const editLawyerPhone = document.getElementById("edit-lawyer-phone");

const btnEditProcessTrigger = document.getElementById("btn-edit-process-trigger");
const modalEditProcess = document.getElementById("modal-edit-process");
const btnCloseModalEditProcess = document.getElementById("btn-close-modal-edit-process");
const editProcessForm = document.getElementById("edit-process-form");
const editProcTitulo = document.getElementById("edit-proc-titulo");
const editProcNumero = document.getElementById("edit-proc-numero");
const editProcArea = document.getElementById("edit-proc-area");
const editProcStatus = document.getElementById("edit-proc-status");
const editProcTribunal = document.getElementById("edit-proc-tribunal");
const editProcVara = document.getElementById("edit-proc-vara");
const editProcValor = document.getElementById("edit-proc-valor");
const editProcObservacoes = document.getElementById("edit-proc-observacoes");

const editProcTituloPremium = document.getElementById("edit-proc-titulo-premium");
const editProcNumeroPremium = document.getElementById("edit-proc-numero-premium");
const editProcAreaPremium = document.getElementById("edit-proc-area-premium");
const editProcStatusPremium = document.getElementById("edit-proc-status-premium");
const editProcTribunalPremium = document.getElementById("edit-proc-tribunal-premium");
const editProcVaraPremium = document.getElementById("edit-proc-vara-premium");
const editProcValorPremium = document.getElementById("edit-proc-valor-premium");

const modalEditCompromisso = document.getElementById("modal-edit-compromisso");
const btnCloseModalEditCompromisso = document.getElementById("btn-close-modal-edit-compromisso");
const editCompromissoForm = document.getElementById("edit-compromisso-form");
const editCompTitulo = document.getElementById("edit-comp-titulo");
const editCompTipo = document.getElementById("edit-comp-tipo");
const editCompDataHora = document.getElementById("edit-comp-data-hora");
const editCompLocalLink = document.getElementById("edit-comp-local-link");
const editCompStatus = document.getElementById("edit-comp-status");
const editCompAnotacoes = document.getElementById("edit-comp-anotacoes");

let activeProcessId = null; // Guarda o ID do processo em visualização/edição
let activeCompromissoId = null; // Guarda o ID do compromisso em edição

// =========================================================================
// ⚡ MAPEAMENTO DE ELEMENTOS DO MODAL DE CRIAÇÃO E IA
// =========================================================================
const modalProcessoIa = document.getElementById("modal-processo-ia");
const btnCloseModalProcessoIa = document.getElementById("btn-close-modal-processo-ia");
const processoIaForm = document.getElementById("processo-ia-form");
const inProcIaTitulo = document.getElementById("proc-ia-titulo");
const inProcIaNumero = document.getElementById("proc-ia-numero");
const inProcIaArea = document.getElementById("proc-ia-area");
const inProcIaStatus = document.getElementById("proc-ia-status");
const inProcIaTribunal = document.getElementById("proc-ia-tribunal");
const inProcIaVara = document.getElementById("proc-ia-vara");
const inProcIaValor = document.getElementById("proc-ia-valor");
const inProcIaObservacoes = document.getElementById("proc-ia-observacoes");
const btnGerarEstrategiaIa = document.getElementById("btn-gerar-estrategia-ia");
const iaLoadingOverlay = document.getElementById("ia-loading-overlay");
const iaLoadingText = document.getElementById("ia-loading-text");
const iaStrategyContainer = document.getElementById("ia-strategy-container");
const btnRegerarIa = document.getElementById("btn-regerar-ia");
const btnCancelarProcessoIa = document.getElementById("btn-cancelar-processo-ia");
const btnSalvarProcessoIa = document.getElementById("btn-salvar-processo-ia");
const btnSalvarProcessoManual = document.getElementById("btn-salvar-processo-manual");

// Textareas do Editor de Estratégia
const iaTesesTextarea = document.getElementById("ia-teses-textarea");
const iaDocsTextarea = document.getElementById("ia-docs-textarea");
const iaLeisTextarea = document.getElementById("ia-leis-textarea");
const iaRiscosTextarea = document.getElementById("ia-riscos-textarea");
const iaPassosTextarea = document.getElementById("ia-passos-textarea");

// Abas de Estratégia
const iaStrategyTabButtons = document.querySelectorAll(".ia-strategy-tab-btn");

// Abas de Visualização no Detalhe do Processo
const btnDetailTabTimeline = document.getElementById("btn-detail-tab-timeline");
const btnDetailTabEstrategia = document.getElementById("btn-detail-tab-estrategia");
const detailTimelineContainer = document.getElementById("detail-timeline-container");
const detailEstrategiaContainer = document.getElementById("detail-estrategia-container");
const viewStrategyTabContent = document.getElementById("view-strategy-tab-content");
const viewStrategyTabButtons = document.querySelectorAll(".view-strategy-tab-btn");

// Variáveis de Estado Local da IA
let currentIAResponse = null; // Guarda o JSON completo retornado pela IA
let activeIATab = "pre"; // Aba ativa ("pre", "inicial", "audiencia")
let activeDetailProcessStrategy = null; // Guarda a estratégia do processo ativamente visualizado
let activeDetailProcessObject = null; // Guarda o objeto completo do processo ativamente visualizado no modal


// =========================================================================
// 🚀 ROTEAMENTO DE VISUALIZAÇÕES (SPA ROUTING)
// =========================================================================
function switchPublicView(viewName) {
  hideMessage(loginMessage);
  hideMessage(signupMessage);
  if (forgotMessage) hideMessage(forgotMessage);

  if (viewName === "landing") {
    landingContainer.style.display = "block";
    authContainer.style.display = "none";
    appLayout.style.display = "none";
  } else if (viewName === "login") {
    landingContainer.style.display = "none";
    authContainer.style.display = "block";
    appLayout.style.display = "none";
    viewLogin.classList.add("active");
    viewSignup.classList.remove("active");
    if (viewForgotPassword) viewForgotPassword.classList.remove("active");
  } else if (viewName === "signup") {
    landingContainer.style.display = "none";
    authContainer.style.display = "block";
    appLayout.style.display = "none";
    viewLogin.classList.remove("active");
    viewSignup.classList.add("active");
    if (viewForgotPassword) viewForgotPassword.classList.remove("active");
  } else if (viewName === "forgot") {
    landingContainer.style.display = "none";
    authContainer.style.display = "block";
    appLayout.style.display = "none";
    viewLogin.classList.remove("active");
    viewSignup.classList.remove("active");
    if (viewForgotPassword) viewForgotPassword.classList.add("active");
  }
}

function switchPrivateView(viewId) {
  if (viewId === "clientes") {
    showClientesPanel("list");
  } else if (viewId === "processos") {
    showProcessosPanel("list");
  } else if (viewId === "financeiro") {
    loadFinanceiroData();
  } else if (viewId === "agenda") {
    loadAgendaData();
  } else if (viewId === "contratos") {
    loadContratosData();
  }

  navItems.forEach(item => {
    if (item.getAttribute("data-view") === viewId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  contentViews.forEach(view => {
    if (view.id === `view-${viewId}`) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });

  if (viewId === "dashboard") {
    loadDashboardData();
  }
}

// Vincula cliques no menu lateral (Sidebar)
navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const targetView = item.getAttribute("data-view");
    switchPrivateView(targetView);
  });
});

// Navegação na tela de Login/Cadastro
linkGoSignup.addEventListener("click", (e) => {
  e.preventDefault();
  switchPublicView("signup");
});

linkGoLogin.addEventListener("click", (e) => {
  e.preventDefault();
  switchPublicView("login");
});

// =========================================================================
// 🎨 MÓDULO DE TEMA (CLARO / ESCURO GLOBAL)
// =========================================================================
function setTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("jt-theme", theme);

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
  }
  
  const sunAuth = document.getElementById("theme-sun-auth");
  const moonAuth = document.getElementById("theme-moon-auth");
  const textAuth = document.getElementById("theme-text-auth");

  const sunInner = document.getElementById("theme-sun-inner");
  const moonInner = document.getElementById("theme-moon-inner");
  const textInner = document.getElementById("theme-text-inner");

  const sunLanding = document.getElementById("theme-sun-landing");
  const moonLanding = document.getElementById("theme-moon-landing");
  const textLanding = document.getElementById("theme-text-landing");

  if (theme === "light") {
    if (sunAuth) sunAuth.style.display = "none";
    if (moonAuth) moonAuth.style.display = "block";
    if (textAuth) textAuth.innerText = "Modo Escuro";

    if (sunInner) sunInner.style.display = "none";
    if (moonInner) moonInner.style.display = "block";
    if (textInner) textInner.innerText = "Modo Escuro";

    if (sunLanding) sunLanding.style.display = "none";
    if (moonLanding) moonLanding.style.display = "block";
    if (textLanding) textLanding.innerText = "Modo Escuro";
  } else {
    if (sunAuth) sunAuth.style.display = "block";
    if (moonAuth) moonAuth.style.display = "none";
    if (textAuth) textAuth.innerText = "Modo Claro";

    if (sunInner) sunInner.style.display = "block";
    if (moonInner) moonInner.style.display = "none";
    if (textInner) textInner.innerText = "Modo Claro";

    if (sunLanding) sunLanding.style.display = "block";
    if (moonLanding) moonLanding.style.display = "none";
    if (textLanding) textLanding.innerText = "Modo Claro";
  }
}

const savedTheme = localStorage.getItem("jt-theme") || "light";
setTheme(savedTheme);

document.getElementById("theme-toggle-auth").addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

document.getElementById("theme-toggle-inner").addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

const themeToggleLanding = document.getElementById("theme-toggle-landing");
if (themeToggleLanding) {
  themeToggleLanding.addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-theme");
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

// =========================================================================
// ✉️ EXIBIÇÃO DE MENSAGENS E FEEDBACKS
// =========================================================================
function showMessage(element, text, type) {
  element.innerText = text;
  element.className = `message-box ${type}`;
  element.style.display = "flex";
}

function hideMessage(element) {
  element.innerText = "";
  element.style.display = "none";
}

// =========================================================================
// 🔑 CONTROLADOR: LOGIN (ENTRAR)
// =========================================================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage(loginMessage);

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showMessage(loginMessage, "Por favor, preencha todos os campos obrigatórios.", "error");
    return;
  }

  try {
    setLoadingState(btnLoginSubmit, true, "Entrando...");

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      let userFriendlyMsg = "Falha na autenticação. Verifique seu e-mail e senha.";
      if (error.message.includes("Invalid login credentials")) {
        userFriendlyMsg = "E-mail ou senha incorretos. Por favor, tente novamente.";
      } else if (error.message.includes("Email not confirmed")) {
        userFriendlyMsg = "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
      } else {
        userFriendlyMsg = error.message;
      }
      showMessage(loginMessage, userFriendlyMsg, "error");
    } else {
      loginForm.reset();
    }
  } catch (err) {
    console.error(err);
    showMessage(loginMessage, "Ocorreu um erro no servidor. Tente novamente mais tarde.", "error");
  } finally {
    setLoadingState(btnLoginSubmit, false, "Entrar");
  }
});

// =========================================================================
// 📝 CONTROLADOR: CADASTRO (REGISTRAR) & SEGURANÇA
// =========================================================================

// Callback Global para sucesso do Cloudflare Turnstile
window.onTurnstileSuccess = function(token) {
  btnSignupSubmit.removeAttribute("disabled");
  btnSignupSubmit.style.opacity = "1";
  btnSignupSubmit.style.cursor = "pointer";
  signupForm.dataset.turnstileToken = token;
};

// Monitoramento em Tempo Real de Força da Senha
signupPassword.addEventListener("input", () => {
  const pass = signupPassword.value;
  const strengthBar = document.getElementById("password-strength-bar");
  const strengthText = document.getElementById("password-strength-text");
  
  if (!pass) {
    strengthBar.style.width = "0%";
    strengthBar.style.background = "#EF4444";
    strengthText.innerText = "Insira a senha";
    strengthText.style.color = "#94A3B8";
    return;
  }
  
  let strength = 0;
  if (pass.length >= 8) strength++;
  if (/[A-Z]/.test(pass)) strength++;
  if (/[0-9]/.test(pass)) strength++;
  if (/[@#$_!%^&*()\-+=\[\]{}|;':",./<>?]/.test(pass)) strength++;
  
  if (strength <= 1) {
    strengthBar.style.width = "25%";
    strengthBar.style.background = "#EF4444";
    strengthText.innerText = "Fraca (Mínimo 8 chars com A-Z, 0-9, @#$_)";
    strengthText.style.color = "#EF4444";
  } else if (strength === 2) {
    strengthBar.style.width = "50%";
    strengthBar.style.background = "#F59E0B";
    strengthText.innerText = "Média (Adicione números/símbolos)";
    strengthText.style.color = "#F59E0B";
  } else if (strength === 3) {
    strengthBar.style.width = "75%";
    strengthBar.style.background = "#FBBF24";
    strengthText.innerText = "Média-Forte (Quase lá)";
    strengthText.style.color = "#FBBF24";
  } else if (strength === 4) {
    strengthBar.style.width = "100%";
    strengthBar.style.background = "#10B981";
    strengthText.innerText = "Forte (Excelente)";
    strengthText.style.color = "#10B981";
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage(signupMessage);

  const nome = signupName.value.trim();
  const tratamento = signupTreatment.value;
  const email = signupEmail.value.trim();
  const oab = signupOab.value.trim() || "Não Informado";
  const password = signupPassword.value;
  const passwordConfirm = signupPasswordConfirm.value;

  // Whitelist check
  const whitelist = ["nainaja@hotmail.com", "jhbogdanowicz@gmail.com"];
  if (!whitelist.includes(email.toLowerCase())) {
    showMessage(signupMessage, "Cadastro restrito. Este endereço de e-mail não possui autorização institucional para registro nesta banca.", "error");
    return;
  }

  // 1. Critérios rígidos de força da senha
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$_!%^&*()\-+=\[\]{}|;':",./<>?]).{8,}$/;
  if (!passRegex.test(password)) {
    showMessage(signupMessage, "Senha insuficiente! A senha deve ter ao menos 8 caracteres, incluindo pelo menos 1 letra maiúscula, 1 número e 1 caractere especial (ex: @, #, $, _).", "error");
    return;
  }

  // 2. Confirmação de Senha
  if (password !== passwordConfirm) {
    showMessage(signupMessage, "A confirmação de senha não coincide com a senha digitada.", "error");
    return;
  }

  // 3. Validação do Captcha Anti-Bot
  const turnstileToken = signupForm.dataset.turnstileToken;
  if (!turnstileToken) {
    showMessage(signupMessage, "Por favor, complete a verificação de segurança 'Não sou robô' (Cloudflare Turnstile) para continuar.", "error");
    return;
  }

  try {
    setLoadingState(btnSignupSubmit, true, "Processando...");

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nome: nome,
          oab: oab,
          tratamento: tratamento
        }
      }
    });

    if (error) {
      showMessage(signupMessage, `Falha no cadastro: ${error.message}`, "error");
    } else {
      const isConfirmed = data.user && data.user.identities && data.user.identities.length > 0;
      
      if (isConfirmed && data.session) {
        showMessage(signupMessage, "Cadastro realizado com sucesso! Redirecionando...", "success");
        setTimeout(() => {
          signupForm.reset();
          // Reset Turnstile
          if (window.turnstile) window.turnstile.reset();
          btnSignupSubmit.setAttribute("disabled", "true");
          btnSignupSubmit.style.opacity = "0.5";
          btnSignupSubmit.style.cursor = "not-allowed";
        }, 1500);
      } else {
        showMessage(signupMessage, "Conta pré-criada! Por favor, verifique seu e-mail para confirmar o cadastro.", "success");
        signupForm.reset();
        if (window.turnstile) window.turnstile.reset();
        btnSignupSubmit.setAttribute("disabled", "true");
        btnSignupSubmit.style.opacity = "0.5";
        btnSignupSubmit.style.cursor = "not-allowed";
      }
    }
  } catch (err) {
    console.error(err);
    showMessage(signupMessage, "Erro inesperado. Tente cadastrar-se novamente.", "error");
  } finally {
    setLoadingState(btnSignupSubmit, false, "Criar conta");
  }
});

// =========================================================================
// 🚪 CONTROLADOR: LOGOUT (SAIR)
// =========================================================================
const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erro ao deslogar:", error.message);
  } catch (err) {
    console.error("Erro inesperado no logout:", err);
  }
};
btnLogout.addEventListener("click", handleLogout);
if (btnLogoutMobile) {
  btnLogoutMobile.addEventListener("click", handleLogout);
}

function setLoadingState(button, isLoading, loadingText) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.innerText;
    button.innerText = loadingText;
    button.style.opacity = "0.7";
  } else {
    button.disabled = false;
    button.innerText = button.dataset.originalText || "Enviar";
    button.style.opacity = "1";
  }
}

// =========================================================================
// 📈 CARREGADOR DE DADOS: METRICAS DO DASHBOARD
// =========================================================================
async function loadDashboardData() {
  console.log("Iniciando carregamento do dashboard em tempo real...");

  try {
    const { data: clients, error: clientsError } = await supabase
      .from("clientes")
      .select("id");

    if (clientsError) throw clientsError;
    const activeClientsCount = clients ? clients.length : 0;
    metricClientsCount.innerText = activeClientsCount;

    const now = new Date();
    const dayOfWeek = now.getDay();
    
    const monday = new Date(now);
    const diffMonday = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday.setDate(diffMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { data: commitments, error: commitmentsError } = await supabase
      .from("compromissos")
      .select("*, clientes(nome, whatsapp, telefone), processos(numero_processo)")
      .gte("data_hora", monday.toISOString())
      .lte("data_hora", sunday.toISOString())
      .order("data_hora", { ascending: true });

    if (commitmentsError) throw commitmentsError;
    const weeklyCommitmentsCount = commitments ? commitments.length : 0;
    metricEventsCount.innerText = weeklyCommitmentsCount;
    commitmentsBadgeCount.innerText = weeklyCommitmentsCount;

    commitmentsDashboardList.innerHTML = "";

    if (commitments && commitments.length > 0) {
      commitmentsDashboardPlaceholder.style.display = "none";
      commitmentsDashboardList.style.display = "flex";

      commitments.forEach(c => {
        const li = document.createElement("li");
        li.className = "inactive-item";
        li.style.cursor = "default";

        const dateObj = new Date(c.data_hora);
        const formattedDate = dateObj.toLocaleDateString("pt-BR");
        const formattedTime = dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        // Limpeza de telefone do cliente
        let rawPhone = (c.clientes?.whatsapp || c.clientes?.telefone || "").replace(/\D/g, "");
        let phone = rawPhone;
        if (phone) {
          if (phone.length <= 11) {
            phone = "55" + phone;
          }
        }

        // Construção da mensagem do WhatsApp
        const clientName = c.clientes?.nome || "Cliente";
        const eventType = (c.tipo || "Compromisso").toLowerCase();
        const processNum = c.processos?.numero_processo || "Não informado";

        let article = "o nosso";
        if (eventType === "audiência" || eventType === "reunião" || eventType.includes("reunião")) {
          article = "a nossa";
        }

        const msg = `Olá, ${clientName}. Passando para lembrar que ${article} ${eventType} referente ao processo nº ${processNum} está agendada para o dia ${formattedDate} às ${formattedTime}. Atenciosamente, JT - Janaina Tarabauca Advocacia.`;
        const encodedMsg = encodeURIComponent(msg);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMsg}`;

        li.innerHTML = `
          <div class="inactive-item-details" style="flex-grow: 1;">
            <span class="inactive-item-title">${c.titulo}</span>
            <div class="inactive-item-meta" style="flex-wrap: wrap; gap: 4px 10px;">
              <span>Tipo: <strong>${c.tipo}</strong></span>
              <span>Cliente: <strong>${c.clientes?.nome || 'Não associado'}</strong></span>
              <span>Horário: <strong>${formattedDate} às ${formattedTime}</strong></span>
              <span>Nº Processo: <strong>${c.processos?.numero_processo || 'Sem número'}</strong></span>
            </div>
          </div>
          <div class="inactive-item-action" style="display: flex; gap: 8px; flex-shrink: 0; align-items: center;">
            ${phone ? `
              <a href="${whatsappUrl}" target="_blank" class="btn-generate-pdf-doc" style="background: rgba(16, 185, 129, 0.08); border-color: var(--success-color); color: var(--success-color); padding: 6px 12px; font-size: 11px; text-decoration: none; display: flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span>Notificar</span>
              </a>
            ` : `
              <span style="font-size: 10px; color: var(--text-secondary); font-style: italic;">Sem contato</span>
            `}
          </div>
        `;

        const detailsEl = li.querySelector(".inactive-item-details");
        if (c.cliente_id) {
          detailsEl.style.cursor = "pointer";
          detailsEl.addEventListener("click", () => {
            openClientDetailsById(c.cliente_id);
          });
        }

        commitmentsDashboardList.appendChild(li);
      });
    } else {
      commitmentsDashboardPlaceholder.style.display = "block";
      commitmentsDashboardList.style.display = "none";
    }

    const { data: processes, error: processesError } = await supabase
      .from("processos")
      .select("*, clientes(nome)")
      .eq("status", "Ativo");

    if (processesError) throw processesError;

    let inactiveCount = 0;
    inactiveProcessesList.innerHTML = "";

    if (processes && processes.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inactiveList = processes.filter(p => {
        let lastMovementDate = new Date(p.created_at);
        
        if (p.historico_andamentos && Array.isArray(p.historico_andamentos) && p.historico_andamentos.length > 0) {
          p.historico_andamentos.forEach(movement => {
            const movementDate = new Date(movement.data || movement.date || p.created_at);
            if (movementDate > lastMovementDate) {
              lastMovementDate = movementDate;
            }
          });
        }
        return lastMovementDate < thirtyDaysAgo;
      });

      inactiveCount = inactiveList.length;

      if (inactiveCount > 0) {
        inactiveListPlaceholder.style.display = "none";
        inactiveProcessesList.style.display = "flex";

        inactiveList.forEach(p => {
          const li = document.createElement("li");
          li.className = "inactive-item";
          
          const createdDateFormatted = new Date(p.created_at).toLocaleDateString('pt-BR');
          
          li.innerHTML = `
            <div class="inactive-item-details">
              <span class="inactive-item-title">${p.titulo}</span>
              <div class="inactive-item-meta">
                <span>Nº Processo: <strong>${p.numero_processo || 'Sem número'}</strong></span>
                <span>Cliente: <strong>${p.clientes?.nome || 'Não identificado'}</strong></span>
                <span>Data de Registro: <strong>${createdDateFormatted}</strong></span>
              </div>
            </div>
            <div class="inactive-item-action">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          `;
          
          li.addEventListener("click", () => {
            openClientDetailsById(p.cliente_id);
          });

          inactiveProcessesList.appendChild(li);
        });
      } else {
        showEmptyProcessesMessage();
      }
    } else {
      showEmptyProcessesMessage();
    }

    inactiveBadgeCount.innerText = inactiveCount;

    // === CARREGAMENTO DOS DADOS FINANCEIROS DO DASHBOARD ===
    try {
      const { data: finData, error: finError } = await supabase
        .from("financeiro")
        .select("*");

      if (!finError && finData) {
        let totalRecebido = 0;
        let sumFixo = 0;
        let sumMensal = 0;
        let sumExito = 0;
        let overdueCount = 0;
        const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        finData.forEach(item => {
          const val = parseFloat(item.valor_total) || 0;
          if (item.status_pagamento === "pago") {
            totalRecebido += val;
          }

          if (item.tipo_honorario === "fixo") {
            sumFixo += val;
          } else if (item.tipo_honorario === "mensal") {
            sumMensal += val;
          } else if (item.tipo_honorario === "êxito") {
            sumExito += val;
          }

          if (item.status_pagamento === "pendente" && item.data_vencimento < todayStr) {
            overdueCount++;
          }
        });

        // Atualiza os valores em reais
        finTotalRecebidoDashboard.innerText = `R$ ${totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        chartValFixo.innerText = `R$ ${sumFixo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        chartValMensal.innerText = `R$ ${sumMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        chartValExito.innerText = `R$ ${sumExito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

        // Calcula a escala do gráfico
        const maxVal = Math.max(sumFixo, sumMensal, sumExito, 1); // evita divisão por zero
        const pctFixo = Math.round((sumFixo / maxVal) * 100);
        const pctMensal = Math.round((sumMensal / maxVal) * 100);
        const pctExito = Math.round((sumExito / maxVal) * 100);

        // Aplica a largura com transição suave
        chartBarFixo.style.width = `${pctFixo}%`;
        chartBarMensal.style.width = `${pctMensal}%`;
        chartBarExito.style.width = `${pctExito}%`;

        // Exibe ou esconde o alerta de parcelas atrasadas
        if (overdueCount > 0) {
          financialOverdueAlert.style.display = "flex";
        } else {
          financialOverdueAlert.style.display = "none";
        }
      }
    } catch (errFin) {
      console.warn("Erro ao buscar dados financeiros do Dashboard:", errFin);
    }

  } catch (err) {
    console.error("Erro ao carregar dados do Dashboard:", err.message);
    inactiveListPlaceholder.innerText = "Falha ao sincronizar dados com o servidor Supabase.";
  }
}

function showEmptyProcessesMessage() {
  inactiveListPlaceholder.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <div>Todos os processos atualizados no momento</div>
  `;
  inactiveListPlaceholder.style.display = "block";
  inactiveProcessesList.style.display = "none";
}

// =========================================================================
// 💼 MÓDULO DE CLIENTES: FLUXO SPA E NAVEGAÇÃO DOS PAINÉIS
// =========================================================================
function showClientesPanel(panelType) {
  if (panelType === "list") {
    clientesListPanel.style.display = "block";
    clientesFormPanel.style.display = "none";
    clientesDetailPanel.style.display = "none";
    loadClientesList();
  } else if (panelType === "form") {
    clientesListPanel.style.display = "none";
    clientesFormPanel.style.display = "block";
    clientesDetailPanel.style.display = "none";
    resetCadastroForm();
  } else if (panelType === "detail") {
    clientesListPanel.style.display = "none";
    clientesFormPanel.style.display = "none";
    clientesDetailPanel.style.display = "block";
  }
}

btnNovoCliente.addEventListener("click", () => showClientesPanel("form"));
btnCancelarCadastro.addEventListener("click", () => showClientesPanel("list"));
btnVoltarListagemDetail.addEventListener("click", () => showClientesPanel("list"));

// Controle das Abas do Formulário de Cadastro
function switchFormTab(tabId) {
  tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });

  tabContents.forEach(content => {
    content.classList.toggle("active", content.id === `tab-${tabId}`);
  });
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const tabId = btn.getAttribute("data-tab");
    switchFormTab(tabId);
  });
});

// Ações rápidas de "Avançar" e "Voltar" dentro das abas de cadastro
document.querySelectorAll(".btn-next-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const nextTab = btn.getAttribute("data-next");
    if (nextTab === "qualificacao" && !inName.value.trim()) {
      alert("Por favor, preencha o Nome Completo antes de avançar.");
      inName.focus();
      return;
    }
    switchFormTab(nextTab);
  });
});

document.querySelectorAll(".btn-prev-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const prevTab = btn.getAttribute("data-prev");
    switchFormTab(prevTab);
  });
});

// =========================================================================
// 🎭 MÁSCARAS E ALTERAÇÕES DINÂMICAS DE FORMULÁRIO (PF / PJ)
// =========================================================================
document.querySelectorAll("input[name='client-tipo-pessoa']").forEach(radio => {
  radio.addEventListener("change", (e) => {
    const isPf = e.target.value === "PF";
    lblCpfCnpj.innerText = isPf ? "CPF" : "CNPJ";
    inCpfCnpj.placeholder = isPf ? "000.000.000-00" : "00.000.000/0000-00";
    inCpfCnpj.value = "";
    
    lblDataNasc.innerText = isPf ? "Data de Nascimento" : "Data de Fundação";
    lblProfissao.innerText = isPf ? "Profissão" : "Ramo de Atuação";
    inProfissao.placeholder = isPf ? "Ex: Engenheiro Civil" : "Ex: Tecnologia e Consultoria";
    
    lblRgIe.innerText = isPf ? "RG" : "Inscrição Estadual";
    inRgIe.placeholder = isPf ? "Ex: 12.345.678-9" : "Ex: 123.456.789.110";
    
    inEstadoCivil.disabled = !isPf;
    if (!isPf) inEstadoCivil.value = "";
  });
});

document.querySelectorAll("input[name='client-tem-processo']").forEach(radio => {
  radio.addEventListener("change", (e) => {
    const temProcesso = e.target.value === "sim";
    groupProcessosAndamento.style.display = temProcesso ? "block" : "none";
    if (!temProcesso) inProcessosAndamento.value = "";
  });
});

// Algoritmo matemático para validação de CPF (Módulo 11)
function validateCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

// Algoritmo matemático para validação de CNPJ (Módulo 11)
function validateCNPJ(cnpj) {
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

// Validação visual e colorização de inputs
function validateAndStyleCpfCnpj(inputElement, isPf) {
  const value = inputElement.value;
  const raw = value.replace(/\D/g, "");
  const targetLength = isPf ? 11 : 14;

  if (raw.length === 0) {
    inputElement.style.borderColor = "";
    inputElement.style.background = "";
    inputElement.removeAttribute("data-valid");
    return true;
  }

  if (raw.length === targetLength) {
    const isValid = isPf ? validateCPF(raw) : validateCNPJ(raw);
    if (!isValid) {
      inputElement.style.borderColor = "#EF4444";
      inputElement.style.background = "#FEF2F2";
      inputElement.setAttribute("data-valid", "false");
      return false;
    } else {
      inputElement.style.borderColor = "#10B981";
      inputElement.style.background = "#F0FDF4";
      inputElement.setAttribute("data-valid", "true");
      return true;
    }
  } else {
    // Incompleto: sem borda de erro imediata enquanto digita, mas marcado como inválido
    inputElement.style.borderColor = "";
    inputElement.style.background = "";
    inputElement.removeAttribute("data-valid");
    return false;
  }
}

// Mascaramento genérico
function applyCpfCnpjMask(value, isPf) {
  let v = value.replace(/\D/g, "");
  if (isPf) {
    if (v.length > 11) v = v.substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    if (v.length > 14) v = v.substring(0, 14);
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v;
}

inCpfCnpj.addEventListener("input", (e) => {
  const isPf = document.querySelector("input[name='client-tipo-pessoa']:checked").value === "PF";
  e.target.value = applyCpfCnpjMask(e.target.value, isPf);
  validateAndStyleCpfCnpj(e.target, isPf);
});

function applyPhoneMask(e) {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  
  if (v.length > 10) {
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
  } else if (v.length > 5) {
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  }
  e.target.value = v;
}

inTelefone.addEventListener("input", applyPhoneMask);
inWhatsapp.addEventListener("input", applyPhoneMask);

function applyCepMask(e) {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 8) v = v.substring(0, 8);
  v = v.replace(/(\d{5})(\d)/, "$1-$2");
  e.target.value = v;
  return v;
}

inCep.addEventListener("input", (e) => {
  const v = applyCepMask(e);
  const rawCep = v.replace(/\D/g, "");
  if (rawCep.length === 8) {
    autocompleteEnderecoByCep(rawCep, inRua, inBairro, inCidade, inEstado, inCep);
  }
});

// =========================================================================
// 🗺️ INTEGRAÇÃO VIACEP: PREENCHIMENTO AUTOMÁTICO DE ENDEREÇO
// =========================================================================
async function autocompleteEnderecoByCep(cep, fRua, fBairro, fCidade, fEstado, fCep) {
  try {
    fCep.style.borderColor = varColor("--gold");
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      alert("CEP não encontrado. Por favor, preencha o endereço manualmente.");
      fCep.style.borderColor = "var(--error-color)";
      return;
    }
    
    fRua.value = data.logradouro || "";
    fBairro.value = data.bairro || "";
    fCidade.value = data.localidade || "";
    fEstado.value = data.uf || "";
    
    fRua.focus();
    fCep.style.borderColor = "var(--input-border)";
  } catch (err) {
    console.error("Erro na busca de CEP:", err);
  }
}

function varColor(variableName) {
  return getComputedStyle(document.body).getPropertyValue(variableName).trim();
}

// =========================================================================
// 💾 CONTROLADOR: SALVAR CLIENTE NO SUPABASE
// =========================================================================
clienteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = inName.value.trim();
  if (!nome) {
    alert("O campo Nome Completo / Razão Social é obrigatório.");
    return;
  }

  const tipoPessoa = document.querySelector("input[name='client-tipo-pessoa']:checked").value;
  const cpfCnpj = inCpfCnpj.value.trim();

  // Validação matemática real de CPF e CNPJ
  if (cpfCnpj) {
    const isPf = tipoPessoa === "PF";
    const rawDoc = cpfCnpj.replace(/\D/g, "");
    const isValid = isPf ? validateCPF(rawDoc) : validateCNPJ(rawDoc);
    if (!isValid) {
      alert(`CPF/CNPJ inválido! Por favor, corrija o documento de ${isPf ? "Pessoa Física (CPF)" : "Pessoa Jurídica (CNPJ)"}.`);
      inCpfCnpj.focus();
      return;
    }
  }

  const dataNascimento = inDataNasc.value || null;
  const telefone = inTelefone.value.trim();
  const whatsapp = inWhatsapp.value.trim();
  const email = inEmail.value.trim();
  const estadoCivil = tipoPessoa === "PF" ? inEstadoCivil.value : null;
  const profissaoRamo = inProfissao.value.trim();
  const rgIe = inRgIe.value.trim();
  
  const cep = inCep.value.trim();
  const rua = inRua.value.trim();
  const comp = inComp.value.trim();
  const bairro = inBairro.value.trim();
  const cidade = inCidade.value.trim();
  const estado = inEstado.value.trim();
  
  let enderecoCompleto = "";
  if (rua) enderecoCompleto += rua;
  if (comp) enderecoCompleto += `, ${comp}`;
  if (bairro) enderecoCompleto += ` - ${bairro}`;
  if (cidade) enderecoCompleto += ` - ${cidade}/${estado}`;
  if (cep) enderecoCompleto += ` (CEP: ${cep})`;

  const selectedAreas = Array.from(document.querySelectorAll("input[name='client-areas']:checked")).map(el => el.value);
  const areasExtra = inAreasExtra.value.trim();
  if (areasExtra) selectedAreas.push(areasExtra);
  const areasInteresse = selectedAreas.join(", ");

  const possuiProcesso = document.querySelector("input[name='client-tem-processo']:checked").value === "sim";
  const processosEmAndamento = possuiProcesso ? inProcessosAndamento.value.trim() : "Nenhum";
  
  const tipoAssistencia = inTipoAssistencia.value;
  const faturamento = inRenda.value ? desformatarMoedaBRL(inRenda.value) : null;
  const observacoes = inObservacoes.value.trim();

  try {
    setLoadingState(document.getElementById("btn-salvar-cliente"), true, "Gravando...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const clientPayload = {
      advogado_id: user.id,
      nome: nome,
      tipo_pessoa: tipoPessoa,
      cpf_cnpj: cpfCnpj || null,
      data_nascimento_fundacao: dataNascimento,
      estado_civil: estadoCivil,
      profissao_ramo: profissaoRamo || null,
      telefone: telefone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      endereco_completo: enderecoCompleto || null,
      observacoes: observacoes || null,
      rg_ie: rgIe || null,
      areas_interesse: areasInteresse || null,
      processos_em_andamento: processosEmAndamento || null,
      tipo_assistencia: tipoAssistencia || null,
      renda_faturamento: faturamento
    };

    const { data, error } = await supabase
      .from("clientes")
      .insert([clientPayload])
      .select();

    if (error) throw error;

    alert("Cliente cadastrado com sucesso!");
    
    if (data && data[0]) {
      openClientDetails(data[0]);
    } else {
      showClientesPanel("list");
    }

  } catch (err) {
    console.error("Erro ao gravar cliente:", err.message);
    alert(`Erro ao salvar cliente: ${err.message}`);
  } finally {
    setLoadingState(document.getElementById("btn-salvar-cliente"), false, "Salvar Cliente");
  }
});

// =========================================================================
// 🔄 CARREGADOR E RENDERIZADOR: LISTAGEM DE CLIENTES
// =========================================================================
let currentClientsLoadId = 0;
async function loadClientesList(searchQuery = "") {
  currentClientsLoadId++;
  const localLoadId = currentClientsLoadId;

  gridListClientes.innerHTML = "";
  listEmptyClientes.style.display = "block";
  listEmptyClientes.innerText = "Carregando clientes...";
  gridListClientes.style.display = "none";

  try {
    let query = supabase.from("clientes").select("*");

    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      query = query.or(`nome.ilike.${q},cpf_cnpj.ilike.${q}`);
    }

    query = query.order("nome", { ascending: true });

    const { data: clients, error } = await query;
    if (localLoadId !== currentClientsLoadId) return;
    if (error) throw error;

    if (clients && clients.length > 0) {
      listEmptyClientes.style.display = "none";
      gridListClientes.style.display = "grid";

      for (const c of clients) {
        const lastInteractionDate = await fetchLastInteractionDate(c.id);
        if (localLoadId !== currentClientsLoadId) return;

        const card = document.createElement("div");
        card.className = "cliente-card";
        
        card.innerHTML = `
          <div class="cliente-card-header">
            <h3 class="cliente-card-title" title="${c.nome}">${c.nome}</h3>
            <span class="badge-tipo">${c.tipo_pessoa || 'PF'}</span>
          </div>
          <div class="cliente-card-body">
            <div class="cliente-card-item">
              <span>CPF/CNPJ:</span>
              <strong>${c.cpf_cnpj || 'Não cadastrado'}</strong>
            </div>
            <div class="cliente-card-item">
              <span>Contato:</span>
              <strong>${c.whatsapp || c.telefone || 'Sem telefone'}</strong>
            </div>
          </div>
          <div class="cliente-card-meta">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Última Ação: <strong>${lastInteractionDate}</strong></span>
          </div>
        `;

        card.addEventListener("click", () => {
          openClientDetails(c, lastInteractionDate);
        });

        gridListClientes.appendChild(card);
      }
    } else {
      listEmptyClientes.style.display = "block";
      listEmptyClientes.innerText = searchQuery.trim() ? "Nenhum cliente atende aos critérios de pesquisa." : "Nenhum cliente cadastrado ainda.";
      gridListClientes.style.display = "none";
    }

  } catch (err) {
    console.error("Erro ao listar clientes:", err.message);
    listEmptyClientes.innerText = "Erro ao sincronizar lista de clientes.";
  }
}

let searchDebounceTimeout;
searchInputClientes.addEventListener("input", (e) => {
  clearTimeout(searchDebounceTimeout);
  const q = e.target.value;
  searchDebounceTimeout = setTimeout(() => {
    loadClientesList(q);
  }, 350);
});

// =========================================================================
// 🩺 CALCULADOR: DATA DE ÚLTIMA AÇÃO DO CLIENTE
// =========================================================================
async function fetchLastInteractionDate(clientId) {
  try {
    let latestDate = null;

    const { data: compData } = await supabase
      .from("compromissos")
      .select("data_hora")
      .eq("cliente_id", clientId)
      .order("data_hora", { ascending: false })
      .limit(1);

    if (compData && compData[0]) {
      latestDate = new Date(compData[0].data_hora);
    }

    const { data: procData } = await supabase
      .from("processos")
      .select("created_at, historico_andamentos")
      .eq("cliente_id", clientId);

    if (procData && procData.length > 0) {
      procData.forEach(p => {
        const procDate = new Date(p.created_at);
        if (!latestDate || procDate > latestDate) {
          latestDate = procDate;
        }
        
        if (p.historico_andamentos && Array.isArray(p.historico_andamentos)) {
          p.historico_andamentos.forEach(m => {
            const mDate = new Date(m.data || m.date || p.created_at);
            if (!latestDate || mDate > latestDate) {
              latestDate = mDate;
            }
          });
        }
      });
    }

    if (latestDate) {
      return latestDate.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return "Sem registros";

  } catch (err) {
    console.error("Erro na busca de data de interação:", err);
    return "Sem registros";
  }
}

// =========================================================================
// 📂 FICHA DETALHADA E INTERATIVA DE CLIENTES (PERFIL DO CLIENTE)
// =========================================================================
// Controle das abas de edição do Perfil do Cliente
profileTabButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const tabId = btn.getAttribute("data-tab");
    
    profileTabButtons.forEach(b => b.classList.toggle("active", b === btn));
    profileTabContents.forEach(content => {
      content.classList.toggle("active", content.id === `tab-${tabId}`);
    });

    if (tabId === "edit-financeiro") {
      loadClientFinancialData();
    }
  });
});

async function openClientDetailsById(clientId, activeTab = null) {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) throw error;
    if (data) {
      openClientDetails(data, activeTab);
    }
  } catch (err) {
    console.error(err);
    alert("Falha ao abrir ficha de perfil do cliente.");
  }
}

function openClientDetails(c, activeTab = null) {
  showClientesPanel("detail");
  activeClientId = c.id; // Vincula o ID do cliente globalmente
  activeClientObject = c; // Salva o objeto do cliente globalmente

  // 1. Atualizar o Título do Perfil
  clientProfileTitleName.innerText = c.nome;

  // 2. Preencher todos os inputs da ficha editável
  editInName.value = c.nome;
  
  // Toggles de tipo de pessoa do formulário de edição
  const radioPF = document.querySelector("input[name='edit-client-tipo-pessoa'][value='PF']");
  const radioPJ = document.querySelector("input[name='edit-client-tipo-pessoa'][value='PJ']");
  if (c.tipo_pessoa === "PJ") {
    radioPJ.checked = true;
    adjustEditFormLabels("PJ");
  } else {
    radioPF.checked = true;
    adjustEditFormLabels("PF");
  }

  editInCpfCnpj.value = c.cpf_cnpj || "";
  editInDataNasc.value = c.data_nascimento_fundacao || "";
  editInTelefone.value = c.telefone || "";
  editInWhatsapp.value = c.whatsapp || "";
  editInEmail.value = c.email || "";
  
  editInEstadoCivil.value = c.estado_civil || "";
  editInProfissao.value = c.profissao_ramo || "";
  editInRgIe.value = c.rg_ie || "";
  
  // Desmembrar CEP do endereço completo
  let cepValue = "";
  if (c.endereco_completo) {
    const cepMatch = c.endereco_completo.match(/\(CEP:\s*([^\)]+)\)/);
    if (cepMatch && cepMatch[1]) {
      cepValue = cepMatch[1];
    }
  }
  editInCep.value = cepValue;

  // Desmembrar rua, complemento, bairro, cidade, estado
  let ruaValue = "", compValue = "", bairroValue = "", cidadeValue = "", estadoValue = "";
  if (c.endereco_completo) {
    const addressPart = c.endereco_completo.split(" (CEP:")[0];
    const blocks = addressPart.split(" - ");
    if (blocks[0]) {
      const streetParts = blocks[0].split(", ");
      ruaValue = streetParts[0] || "";
      compValue = streetParts.slice(1).join(", ") || "";
    }
    if (blocks[1]) bairroValue = blocks[1];
    if (blocks[2]) {
      const cityParts = blocks[2].split("/");
      cidadeValue = cityParts[0] || "";
      estadoValue = cityParts[1] || "";
    }
  }
  editInRua.value = ruaValue;
  editInComp.value = compValue;
  editInBairro.value = bairroValue;
  editInCidade.value = cidadeValue;
  editInEstado.value = estadoValue;

  // Áreas de Interesse
  const checkboxes = document.querySelectorAll("input[name='edit-client-areas']");
  checkboxes.forEach(cb => cb.checked = false);
  editInAreasExtra.value = "";

  if (c.areas_interesse) {
    const areas = c.areas_interesse.split(", ");
    areas.forEach(area => {
      let matched = false;
      checkboxes.forEach(cb => {
        if (cb.value === area) {
          cb.checked = true;
          matched = true;
        }
      });
      if (!matched) {
        editInAreasExtra.value = area;
      }
    });
  }

  // Processos em Andamento
  const temProcessoSim = document.querySelector("input[name='edit-client-tem-processo'][value='sim']");
  const temProcessoNao = document.querySelector("input[name='edit-client-tem-processo'][value='nao']");
  
  if (c.processos_em_andamento && c.processos_em_andamento !== "Nenhum") {
    temProcessoSim.checked = true;
    editGroupProcessosAndamento.style.display = "block";
    editInProcessosAndamento.value = c.processos_em_andamento;
  } else {
    temProcessoNao.checked = true;
    editGroupProcessosAndamento.style.display = "none";
    editInProcessosAndamento.value = "";
  }

  editInTipoAssistencia.value = c.tipo_assistencia || "";
  editInRenda.value = c.renda_faturamento ? formatarMoedaBRL(c.renda_faturamento.toFixed(2).replace(".", "")) : "";
  editInObservacoes.value = c.observacoes || "";

  // 3. Carregar Compromissos e Status (Seção 2)
  loadClientCommitmentsList();

  // 4. Carregar Processos Vinculados (Seção 3)
  loadClientProcessesList();
  
  // Reseta visualização de abas para a aba de Identificação ou a informada
  if (activeTab) {
    const targetTabBtn = Array.from(profileTabButtons).find(btn => btn.getAttribute("data-tab") === `edit-${activeTab}` || btn.getAttribute("data-tab") === activeTab);
    if (targetTabBtn) {
      targetTabBtn.click();
    } else {
      profileTabButtons[0].click();
    }
  } else {
    profileTabButtons[0].click();
  }
}

// Alternador de labels de edição
function adjustEditFormLabels(tipoPessoa) {
  const isPf = tipoPessoa === "PF";
  editLblCpfCnpj.innerText = isPf ? "CPF" : "CNPJ";
  editInCpfCnpj.placeholder = isPf ? "000.000.000-00" : "00.000.000/0000-00";
  
  editLblDataNasc.innerText = isPf ? "Data de Nascimento" : "Data de Fundação";
  editLblProfissao.innerText = isPf ? "Profissão" : "Ramo de Atuação";
  editInProfissao.placeholder = isPf ? "Ex: Engenheiro Civil" : "Ex: Tecnologia";
  
  editLblRgIe.innerText = isPf ? "RG" : "Inscrição Estadual";
  editInRgIe.placeholder = isPf ? "Ex: 12.345.678-9" : "Ex: 123.456.789.110";
  
  editInEstadoCivil.disabled = !isPf;
  if (!isPf) editInEstadoCivil.value = "";
}

// Máscaras para formulário de edição
editInCpfCnpj.addEventListener("input", (e) => {
  const isPf = document.querySelector("input[name='edit-client-tipo-pessoa']:checked").value === "PF";
  e.target.value = applyCpfCnpjMask(e.target.value, isPf);
  validateAndStyleCpfCnpj(e.target, isPf);
});
editInTelefone.addEventListener("input", applyPhoneMask);
editInWhatsapp.addEventListener("input", applyPhoneMask);

editInCep.addEventListener("input", (e) => {
  const v = applyCepMask(e);
  const rawCep = v.replace(/\D/g, "");
  if (rawCep.length === 8) {
    autocompleteEnderecoByCep(rawCep, editInRua, editInBairro, editInCidade, editInEstado, editInCep);
  }
});

// Mudança no botão de processos da edição
document.querySelectorAll("input[name='edit-client-tem-processo']").forEach(radio => {
  radio.addEventListener("change", (e) => {
    const temProcesso = e.target.value === "sim";
    editGroupProcessosAndamento.style.display = temProcesso ? "block" : "none";
    if (!temProcesso) editInProcessosAndamento.value = "";
  });
});

// Listener de rádio de alteração tipo pessoa edição
document.querySelectorAll("input[name='edit-client-tipo-pessoa']").forEach(radio => {
  radio.addEventListener("change", (e) => {
    adjustEditFormLabels(e.target.value);
  });
});

// =========================================================================
// 💾 AÇÃO: SALVAR ALTERAÇÕES CIVIL/JURÍDICA
// =========================================================================
editClienteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!activeClientId) return;

  const nome = editInName.value.trim();
  if (!nome) {
    alert("O Nome do cliente é obrigatório.");
    return;
  }

  const tipoPessoa = document.querySelector("input[name='edit-client-tipo-pessoa']:checked").value;
  const cpfCnpj = editInCpfCnpj.value.trim();

  // Validação matemática real de CPF e CNPJ
  if (cpfCnpj) {
    const isPf = tipoPessoa === "PF";
    const rawDoc = cpfCnpj.replace(/\D/g, "");
    const isValid = isPf ? validateCPF(rawDoc) : validateCNPJ(rawDoc);
    if (!isValid) {
      alert(`CPF/CNPJ inválido! Por favor, corrija o documento de ${isPf ? "Pessoa Física (CPF)" : "Pessoa Jurídica (CNPJ)"}.`);
      editInCpfCnpj.focus();
      return;
    }
  }

  const dataNascimento = editInDataNasc.value || null;
  const telefone = editInTelefone.value.trim();
  const whatsapp = editInWhatsapp.value.trim();
  const email = editInEmail.value.trim();
  const estadoCivil = tipoPessoa === "PF" ? editInEstadoCivil.value : null;
  const profissaoRamo = editInProfissao.value.trim();
  const rgIe = editInRgIe.value.trim();
  
  const cep = editInCep.value.trim();
  const rua = editInRua.value.trim();
  const comp = editInComp.value.trim();
  const bairro = editInBairro.value.trim();
  const cidade = editInCidade.value.trim();
  const estado = editInEstado.value.trim();
  
  let enderecoCompleto = "";
  if (rua) enderecoCompleto += rua;
  if (comp) enderecoCompleto += `, ${comp}`;
  if (bairro) enderecoCompleto += ` - ${bairro}`;
  if (cidade) enderecoCompleto += ` - ${cidade}/${estado}`;
  if (cep) enderecoCompleto += ` (CEP: ${cep})`;

  const selectedAreas = Array.from(document.querySelectorAll("input[name='edit-client-areas']:checked")).map(el => el.value);
  const areasExtra = editInAreasExtra.value.trim();
  if (areasExtra) selectedAreas.push(areasExtra);
  const areasInteresse = selectedAreas.join(", ");

  const possuiProcesso = document.querySelector("input[name='edit-client-tem-processo']:checked").value === "sim";
  const processosEmAndamento = possuiProcesso ? editInProcessosAndamento.value.trim() : "Nenhum";
  
  const tipoAssistencia = editInTipoAssistencia.value;
  const faturamento = editInRenda.value ? desformatarMoedaBRL(editInRenda.value) : null;
  const observacoes = editInObservacoes.value.trim();

  try {
    setLoadingState(document.getElementById("btn-save-client-changes"), true, "Salvando...");

    const clientPayload = {
      nome: nome,
      tipo_pessoa: tipoPessoa,
      cpf_cnpj: cpfCnpj || null,
      data_nascimento_fundacao: dataNascimento,
      estado_civil: estadoCivil,
      profissao_ramo: profissaoRamo || null,
      telefone: telefone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      endereco_completo: enderecoCompleto || null,
      observacoes: observacoes || null,
      rg_ie: rgIe || null,
      areas_interesse: areasInteresse || null,
      processos_em_andamento: processosEmAndamento || null,
      tipo_assistencia: tipoAssistencia || null,
      renda_faturamento: faturamento
    };

    const { error } = await supabase
      .from("clientes")
      .update(clientPayload)
      .eq("id", activeClientId);

    if (error) throw error;

    alert("Alterações gravadas com sucesso!");
    
    // Recarrega os dados do cliente
    openClientDetailsById(activeClientId);

  } catch (err) {
    console.error("Erro ao atualizar cliente:", err.message);
    alert(`Erro ao atualizar cliente: ${err.message}`);
  } finally {
    setLoadingState(document.getElementById("btn-save-client-changes"), false, "Salvar Alterações");
  }
});

// =========================================================================
// 📅 SEÇÃO 2: ATENDIMENTOS E COMPROMISSOS (MODAL & TIMELINE)
// =========================================================================
// --- LÓGICA DE SALA VIRTUAL SMART ---
let selectedPlatform = "google_meet";
let selectedEditPlatform = "google_meet";

// Elementos Dinâmicos de Reunião Virtual (Criação)
const compVirtualRoomConfig = document.getElementById("comp-virtual-room-config");
const compLocalLinkGroup = document.getElementById("comp-local-link-group");
const compMeetingLink = document.getElementById("comp-meeting-link");
const compMeetingLinkLabel = document.getElementById("comp-meeting-link-label");
const compValidationError = document.getElementById("comp-meeting-validation-error");
const meetHelperContainer = document.getElementById("meet-helper-container");
const compTipo = document.getElementById("comp-tipo");

// Elementos Dinâmicos de Reunião Virtual (Edição)
const editCompVirtualRoomConfig = document.getElementById("edit-comp-virtual-room-config");
const editCompLocalLinkGroup = document.getElementById("edit-comp-local-link-group");
const editCompMeetingLink = document.getElementById("edit-comp-meeting-link");
const editCompMeetingLinkLabel = document.getElementById("edit-comp-meeting-link-label");
const editCompValidationError = document.getElementById("edit-comp-meeting-validation-error");
const editMeetHelperContainer = document.getElementById("edit-meet-helper-container");

// Configurar Botões de Plataforma
const setupPlatformSelect = (buttonsSelector, platformStateSetter, helperContainer, labelEl, inputEl, validationErrorEl) => {
  const buttons = document.querySelectorAll(buttonsSelector);
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const platform = btn.getAttribute("data-platform");
      platformStateSetter(platform);
      
      // Ajustar UI com base na plataforma
      validationErrorEl.style.display = "none";
      inputEl.value = "";
      
      if (platform === "google_meet") {
        helperContainer.style.display = "block";
        labelEl.innerText = "Link do Google Meet *";
        inputEl.placeholder = "meet.google.com/...";
      } else if (platform === "zoom") {
        helperContainer.style.display = "none";
        labelEl.innerText = "Link do Zoom *";
        inputEl.placeholder = "zoom.us/...";
      } else if (platform === "teams") {
        helperContainer.style.display = "none";
        labelEl.innerText = "Link do Microsoft Teams *";
        inputEl.placeholder = "teams.microsoft.com/...";
      } else {
        helperContainer.style.display = "none";
        labelEl.innerText = "Link da Reunião *";
        inputEl.placeholder = "Cole o link da reunião virtual";
      }
    });
  });
};

// Inicializa seletores de plataforma
setTimeout(() => {
  setupPlatformSelect(
    "#comp-virtual-room-config .btn-platform-select", 
    (p) => { selectedPlatform = p; }, 
    meetHelperContainer, 
    compMeetingLinkLabel, 
    compMeetingLink, 
    compValidationError
  );

  setupPlatformSelect(
    "#edit-comp-virtual-room-config .btn-platform-select", 
    (p) => { selectedEditPlatform = p; }, 
    editMeetHelperContainer, 
    editCompMeetingLinkLabel, 
    editCompMeetingLink, 
    editCompValidationError
  );
}, 100);

// Validador de Links Online via Regex
const validateMeetingLink = (link, platform) => {
  if (!link) return "O link da reunião é obrigatório.";
  
  if (platform === "google_meet") {
    const meetRegex = /^(https?:\/\/)?(www\.)?meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
    if (!meetRegex.test(link.trim())) {
      return "Formato de link inválido. O padrão deve ser meet.google.com/abc-defg-hij";
    }
  } else if (platform === "zoom") {
    const zoomRegex = /zoom\.us/;
    if (!zoomRegex.test(link.trim())) {
      return "Link inválido. Deve conter zoom.us";
    }
  } else if (platform === "teams") {
    const teamsRegex = /^(https?:\/\/)?(www\.)?teams\.microsoft\.com\/.+/;
    if (!teamsRegex.test(link.trim())) {
      return "Link inválido. Certifique-se de colar um link gerado pelo Microsoft Teams.";
    }
  }
  return null;
};

// Monitoramento dos campos de tipo e Toggle de Reunião Online
const compOnlineToggleContainer = document.getElementById("comp-online-toggle-container");
const compOnlineToggle = document.getElementById("comp-online-toggle");
const compOnlineToggleTitle = document.getElementById("comp-online-toggle-title");
const compLocalGroup = document.getElementById("comp-local-group");
const compLocalFisico = document.getElementById("comp-local-fisico");

const editCompOnlineToggleContainer = document.getElementById("edit-comp-online-toggle-container");
const editCompOnlineToggle = document.getElementById("edit-comp-online-toggle");
const editCompOnlineToggleTitle = document.getElementById("edit-comp-online-toggle-title");
const editCompLocalGroup = document.getElementById("edit-comp-local-group");
const editCompLocalFisico = document.getElementById("edit-comp-local-fisico");

// Lógica de alternância dinâmica do Toggle Switch (Outlook style)
const handleToggleChange = (toggleEl, localGroupEl, virtualGroupEl, isOnline) => {
  if (isOnline) {
    localGroupEl.style.display = "none";
    virtualGroupEl.style.display = "block";
  } else {
    localGroupEl.style.display = "block";
    virtualGroupEl.style.display = "none";
  }
};

compOnlineToggle.addEventListener("change", (e) => {
  handleToggleChange(compOnlineToggle, compLocalGroup, compVirtualRoomConfig, e.target.checked);
});

editCompOnlineToggle.addEventListener("change", (e) => {
  handleToggleChange(editCompOnlineToggle, editCompLocalGroup, editCompVirtualRoomConfig, e.target.checked);
});

// Monitoramento dos campos de tipo
compTipo.addEventListener("change", (e) => {
  const val = e.target.value;
  compValidationError.style.display = "none";
  
  if (val === "Reunião Online") {
    compOnlineToggleContainer.style.display = "flex";
    compOnlineToggleTitle.innerText = "🎥 Reunião Online";
    compOnlineToggle.checked = true;
    handleToggleChange(compOnlineToggle, compLocalGroup, compVirtualRoomConfig, true);
    document.getElementById("btn-platform-meet").click(); // Trigger Google Meet por padrão
  } else if (val === "Audiência") {
    compOnlineToggleContainer.style.display = "flex";
    compOnlineToggleTitle.innerText = "🎥 Audiência Virtual";
    compOnlineToggle.checked = false;
    handleToggleChange(compOnlineToggle, compLocalGroup, compVirtualRoomConfig, false);
  } else if (val === "Atendimento Presencial") {
    compOnlineToggleContainer.style.display = "none";
    compOnlineToggle.checked = false;
    handleToggleChange(compOnlineToggle, compLocalGroup, compVirtualRoomConfig, false);
  } else if (val === "Prazo Processual") {
    compOnlineToggleContainer.style.display = "none";
    compLocalGroup.style.display = "none";
    compVirtualRoomConfig.style.display = "none";
  }
});

editCompTipo.addEventListener("change", (e) => {
  const val = e.target.value;
  editCompValidationError.style.display = "none";
  
  if (val === "Reunião Online") {
    editCompOnlineToggleContainer.style.display = "flex";
    editCompOnlineToggleTitle.innerText = "🎥 Reunião Online";
    editCompOnlineToggle.checked = true;
    handleToggleChange(editCompOnlineToggle, editCompLocalGroup, editCompVirtualRoomConfig, true);
  } else if (val === "Audiência") {
    editCompOnlineToggleContainer.style.display = "flex";
    editCompOnlineToggleTitle.innerText = "🎥 Audiência Virtual";
    editCompOnlineToggle.checked = false;
    handleToggleChange(editCompOnlineToggle, editCompLocalGroup, editCompVirtualRoomConfig, false);
  } else if (val === "Atendimento Presencial") {
    editCompOnlineToggleContainer.style.display = "none";
    editCompOnlineToggle.checked = false;
    handleToggleChange(editCompOnlineToggle, editCompLocalGroup, editCompVirtualRoomConfig, false);
  } else if (val === "Prazo Processual") {
    editCompOnlineToggleContainer.style.display = "none";
    editCompLocalGroup.style.display = "none";
    editCompVirtualRoomConfig.style.display = "none";
  }
});

// Adicionar live validation
compMeetingLink.addEventListener("input", (e) => {
  const err = validateMeetingLink(e.target.value.trim(), selectedPlatform);
  if (err) {
    compValidationError.innerText = err;
    compValidationError.style.display = "block";
  } else {
    compValidationError.style.display = "none";
  }
});

editCompMeetingLink.addEventListener("input", (e) => {
  const err = validateMeetingLink(e.target.value.trim(), selectedEditPlatform);
  if (err) {
    editCompValidationError.innerText = err;
    editCompValidationError.style.display = "block";
  } else {
    editCompValidationError.style.display = "none";
  }
});

// Abertura do Modal de Novo Compromisso
btnNovoCompromisso.addEventListener("click", () => {
  modalCompromisso.style.display = "flex";
  compromissoForm.reset();
  
  // Reseta campos virtuais e toggle switch
  compOnlineToggleContainer.style.display = "none";
  compOnlineToggle.checked = false;
  compLocalGroup.style.display = "block";
  compVirtualRoomConfig.style.display = "none";
  selectedPlatform = "google_meet";
  compValidationError.style.display = "none";
  compMeetingLink.value = "";
  compLocalFisico.value = "";
  
  // Seta data e hora padrão para o momento atual arredondado
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("comp-data-hora").value = now.toISOString().slice(0, 16);
});

// Fechamento dos Modais
btnCloseModalCompromisso.addEventListener("click", () => {
  modalCompromisso.style.display = "none";
});

btnCloseModalProcesso.addEventListener("click", () => {
  modalProcessoDetail.style.display = "none";
});

btnCloseModalLawyer.addEventListener("click", () => {
  modalEditLawyer.style.display = "none";
});

btnCloseModalEditProcess.addEventListener("click", () => {
  modalEditProcess.style.display = "none";
});

btnCloseModalEditCompromisso.addEventListener("click", () => {
  modalEditCompromisso.style.display = "none";
});

// Submissão do Novo Compromisso
compromissoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!activeClientId) return;

  const titulo = document.getElementById("comp-titulo").value.trim();
  const tipo = document.getElementById("comp-tipo").value;
  const dataHora = document.getElementById("comp-data-hora").value;
  const status = document.getElementById("comp-status").value;
  const rawAnotacoes = document.getElementById("comp-anotacoes").value.trim();

  let localLink = "";
  let anotacoes = rawAnotacoes;

  const isOnlineChecked = compOnlineToggle.checked && (tipo !== "Prazo Processual");

  if (tipo === "Prazo Processual") {
    localLink = "";
    anotacoes = JSON.stringify({ online: false, anotacoes: rawAnotacoes });
  } else if (isOnlineChecked) {
    const meetLink = compMeetingLink.value.trim();
    const validationErr = validateMeetingLink(meetLink, selectedPlatform);
    if (validationErr) {
      alert(`Erro de Validação: ${validationErr}`);
      compMeetingLink.focus();
      return;
    }
    localLink = meetLink;
    anotacoes = JSON.stringify({ plataforma: selectedPlatform, online: true, anotacoes: rawAnotacoes });
  } else {
    localLink = compLocalFisico.value.trim();
    anotacoes = JSON.stringify({ online: false, anotacoes: rawAnotacoes });
  }

  try {
    setLoadingState(document.getElementById("btn-save-compromisso"), true, "Processando...");

    // Pega o ID do advogado ativo
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Advogado não logado.");

    const compromissoPayload = {
      advogado_id: user.id,
      cliente_id: activeClientId,
      titulo: titulo,
      tipo: tipo,
      data_hora: new Date(dataHora).toISOString(),
      local_link: localLink || null,
      status: status,
      anotacoes_pos_evento: anotacoes || null
    };

    const { error } = await supabase
      .from("compromissos")
      .insert([compromissoPayload]);

    if (error) throw error;

    alert("Compromisso salvo com sucesso!");
    modalCompromisso.style.display = "none";
    
    // Atualiza a listagem de compromissos deste cliente
    loadClientCommitmentsList();
    
    // Recarrega o dashboard em background
    loadDashboardData();

    // Recarrega a agenda
    if (typeof loadAgendaData === "function") {
      loadAgendaData();
    }

  } catch (err) {
    console.error("Erro ao salvar compromisso:", err.message);
    alert(`Erro ao salvar compromisso: ${err.message}`);
  } finally {
    setLoadingState(document.getElementById("btn-save-compromisso"), false, "Salvar compromisso");
  }
});

// Busca e lista compromissos de forma cronológica decrescente
async function loadClientCommitmentsList() {
  if (!activeClientId) return;

  try {
    const { data: commitments, error } = await supabase
      .from("compromissos")
      .select("*")
      .eq("cliente_id", activeClientId)
      .order("data_hora", { ascending: false });

    if (error) throw error;

    // 1. Atualizar badges de status do painel
    let prazos = 0;
    let audiencias = 0;
    let reunioes = 0;

    if (commitments) {
      commitments.forEach(item => {
        if (item.status === "Agendado") {
          if (item.tipo === "Prazo Processual") prazos++;
          else if (item.tipo === "Audiência") audiencias++;
          else if (item.tipo === "Reunião Online" || item.tipo === "Reunião") reunioes++;
        }
      });
    }

    badgePrazos.innerText = `${prazos} Prazos`;
    badgeAudiencias.innerText = `${audiencias} Audiências`;
    badgeReunioes.innerText = `${reunioes} Reuniões`;

    // 2. Renderizar a timeline vertical de compromissos
    compromissosTimelineList.innerHTML = "";

    if (commitments && commitments.length > 0) {
      compromissosEmptyMsg.style.display = "none";
      compromissosTimelineList.style.display = "flex";

      commitments.forEach(item => {
        const div = document.createElement("div");
        
        let typeClass = "service";
        if (item.tipo === "Prazo Processual") typeClass = "deadline";
        else if (item.tipo === "Audiência") typeClass = "hearing";
        else if (item.tipo === "Reunião Online" || item.tipo === "Reunião") typeClass = "meeting";

        div.className = `timeline-item ${typeClass}`;

        const dt = new Date(item.data_hora);
        const formattedDate = dt.toLocaleDateString("pt-BR") + " às " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

        // Tenta fazer o parse das anotações se for reunião online
        let plataforma = "";
        let displayAnotacoes = item.anotacoes_pos_evento || "";
        
        if (item.anotacoes_pos_evento && item.anotacoes_pos_evento.startsWith("{") && item.anotacoes_pos_evento.endsWith("}")) {
          try {
            const parsed = JSON.parse(item.anotacoes_pos_evento);
            plataforma = parsed.plataforma || "";
            displayAnotacoes = parsed.anotacoes || "";
          } catch (e) {
            // ignore
          }
        }

        // Se for reunião mas não tiver plataforma gravada no JSON, tenta adivinhar pelo URL
        if ((item.tipo === "Reunião Online" || item.tipo === "Reunião") && !plataforma && item.local_link) {
          if (item.local_link.includes("zoom.us")) plataforma = "zoom";
          else if (item.local_link.includes("teams.microsoft.com")) plataforma = "teams";
          else if (item.local_link.includes("meet.google.com") || item.local_link.includes("google.com")) plataforma = "google_meet";
          else plataforma = "outro";
        }

        // Determina o nome da plataforma e o estilo do botão
        let platformName = "";
        let joinBtnHtml = "";
        
        if (plataforma && item.local_link) {
          let btnColor = "var(--gold)";
          let btnBg = "rgba(197, 168, 92, 0.1)";
          let btnBorder = "var(--gold)";
          
          if (plataforma === "google_meet") {
            platformName = "Google Meet";
            btnColor = "#10B981";
            btnBg = "rgba(16, 185, 129, 0.12)";
            btnBorder = "rgba(16, 185, 129, 0.4)";
          } else if (plataforma === "zoom") {
            platformName = "Zoom";
            btnColor = "#00BCFF";
            btnBg = "rgba(0, 188, 255, 0.12)";
            btnBorder = "rgba(0, 188, 255, 0.4)";
          } else if (plataforma === "teams") {
            platformName = "Teams";
            btnColor = "#6366F1";
            btnBg = "rgba(99, 102, 241, 0.12)";
            btnBorder = "rgba(99, 102, 241, 0.4)";
          } else {
            platformName = "Sala Virtual";
            btnColor = "var(--gold)";
            btnBg = "rgba(212, 175, 55, 0.1)";
            btnBorder = "var(--gold)";
          }

          joinBtnHtml = `
            <div style="margin-top: 10px;">
              <a href="${item.local_link}" target="_blank" class="btn-join-meeting" style="display: inline-flex; align-items: center; gap: 8px; color: ${btnColor}; background: ${btnBg}; border: 1px solid ${btnBorder}; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <span>🎥 Entrar na Reunião Virtual (${platformName})</span>
              </a>
            </div>
          `;
        }

        // Plataforma badge
        let platBadge = "";
        if (platformName) {
          platBadge = `<span style="background: rgba(255,255,255,0.05); border: 1px solid var(--panel-border); font-size: 10px; padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); margin-left: 6px;">${platformName}</span>`;
        }

        div.innerHTML = `
          <div class="timeline-dot"></div>
          <span class="timeline-time">${formattedDate}</span>
          <span class="timeline-title">${item.titulo} ${platBadge}</span>
          <div class="timeline-meta">
            <span>Tipo: <strong>${item.tipo}</strong></span> | 
            <span>Local/Link: <strong>${item.local_link || 'Não informado'}</strong></span> | 
            <span>Status: <strong style="color: ${item.status === 'Realizado' ? 'var(--success-color)' : (item.status === 'Cancelado' ? 'var(--error-color)' : 'var(--gold)')}">${item.status}</strong></span> | 
            <button type="button" class="btn-edit-comp-trigger" data-id="${item.id}" style="background: none; border: none; color: var(--gold); font-size: 11px; cursor: pointer; text-decoration: underline; font-weight: 600; padding: 0; vertical-align: middle; transition: color 0.2s;">Editar</button>
          </div>
          ${displayAnotacoes ? `<p class="timeline-desc">${displayAnotacoes}</p>` : ''}
          ${joinBtnHtml}
        `;

        compromissosTimelineList.appendChild(div);
      });
    } else {
      compromissosEmptyMsg.style.display = "block";
      compromissosTimelineList.style.display = "none";
    }

  } catch (err) {
    console.error("Erro ao carregar compromissos do cliente:", err.message);
  }
}

// =========================================================================
// ⚖️ SEÇÃO 3: PROCESSOS VINCULADOS (CRONOLOGIA & DETALHES VERTICAIS)
// =========================================================================
btnCriarProcessoTrigger.addEventListener("click", () => {
  // Reseta formulário de criação de processo e IA
  processoIaForm.reset();
  currentIAResponse = null;
  activeIATab = "pre";
  
  iaStrategyContainer.style.display = "none";
  iaLoadingOverlay.style.display = "none";
  
  // Exibição padrão dos botões
  btnSalvarProcessoIa.style.display = "none";
  btnSalvarProcessoManual.style.display = "block";
  
  // Abre o modal
  modalProcessoIa.style.display = "flex";
});

async function loadClientProcessesList() {
  if (!activeClientId) return;

  try {
    const { data: processes, error } = await supabase
      .from("processos")
      .select("*")
      .eq("cliente_id", activeClientId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    processosTimelineListContainer.innerHTML = "";

    if (processes && processes.length > 0) {
      processosEmptyMsg.style.display = "none";
      processosTimelineListContainer.style.display = "flex";

      processes.forEach(p => {
        const card = document.createElement("div");
        card.className = "inactive-item";

        card.innerHTML = `
          <div class="inactive-item-details">
            <span class="inactive-item-title">${p.titulo}</span>
            <div class="inactive-item-meta">
              <span>Nº Processo: <strong>${p.numero_processo || 'Sem número'}</strong></span>
              <span>Área: <strong>${p.area_direito || 'Não especificada'}</strong></span>
              <span>Status: <strong style="color:var(--gold);">${p.status}</strong></span>
            </div>
          </div>
          <div class="inactive-item-action">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        `;

        // Ao clicar no card do processo, abre o modal detalhado dele
        card.addEventListener("click", () => {
          openProcessModalDetails(p);
        });

        processosTimelineListContainer.appendChild(card);
      });
    } else {
      processosEmptyMsg.style.display = "block";
      processosTimelineListContainer.style.display = "none";
    }

    // Carregar a Central de Documentos com os processos do cliente
    loadClientDocumentsList(processes || []);

  } catch (err) {
    console.error("Erro ao buscar processos do cliente:", err.message);
  }
}

// Expansão do Modal do Processo com Timeline de Andamentos (JSONB) e Estratégia IA
function openProcessModalDetails(p) {
  activeProcessId = p.id;
  activeDetailProcessObject = p; // Guarda o processo visualizado no modal para exportação
  modalProcessoDetail.style.display = "flex";

  // Preenche dados textuais
  document.getElementById("proc-detail-titulo").innerText = p.titulo;
  document.getElementById("proc-detail-numero").innerText = p.numero_processo || "Não informado";
  document.getElementById("proc-detail-area").innerText = p.area_direito || "Não informada";
  document.getElementById("proc-detail-tribunal").innerText = p.tribunal || "Não informado";
  document.getElementById("proc-detail-vara").innerText = p.vara || "Não informada";
  document.getElementById("proc-detail-valor").innerText = p.valor_causa ? `R$ ${p.valor_causa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Não Informado";
  
  const statusEl = document.getElementById("proc-detail-status");
  statusEl.innerText = p.status;
  statusEl.style.color = p.status === "Ativo" ? "var(--success-color)" : "var(--text-secondary)";

  // Configura a estratégia carregada do processo
  activeDetailProcessStrategy = p.estrategia_ia || null;
  if (activeDetailProcessStrategy) {
    btnDetailTabEstrategia.style.display = "block";
  } else {
    btnDetailTabEstrategia.style.display = "none";
  }

  // Reseta abas do modal para a timeline por padrão
  btnDetailTabTimeline.classList.add("active");
  btnDetailTabEstrategia.classList.remove("active");
  btnDetailTabTimeline.style.color = "var(--text-primary)";
  btnDetailTabTimeline.style.borderBottomColor = "var(--gold)";
  btnDetailTabEstrategia.style.color = "var(--text-secondary)";
  btnDetailTabEstrategia.style.borderBottomColor = "transparent";
  
  detailTimelineContainer.style.display = "block";
  detailEstrategiaContainer.style.display = "none";

  // Renderiza a linha do tempo vertical de movimentações do histórico (JSONB)
  const timeline = document.getElementById("proc-detail-timeline");
  timeline.innerHTML = "";

  if (p.historico_andamentos && Array.isArray(p.historico_andamentos) && p.historico_andamentos.length > 0) {
    // Ordena por data decrescente (do mais recente para o mais antigo)
    const sortedMovements = [...p.historico_andamentos].sort((a, b) => new Date(b.data || b.date) - new Date(a.data || a.date));

    sortedMovements.forEach(m => {
      const div = document.createElement("div");
      div.className = "timeline-item service"; // Blue dot

      const mDate = new Date(m.data || m.date);
      const formattedDate = mDate.toLocaleDateString("pt-BR");

      div.innerHTML = `
        <div class="timeline-dot"></div>
        <span class="timeline-time">${formattedDate}</span>
        <span class="timeline-title">${m.descricao || m.title || "Andamento Processual"}</span>
        ${m.observacoes || m.description ? `<p class="timeline-desc">${m.observacoes || m.description}</p>` : ''}
      `;
      timeline.appendChild(div);
    });
  } else {
    timeline.innerHTML = `<div class="inactive-empty">Nenhum andamento ou movimentação registrada para este processo.</div>`;
  }
}

// =========================================================================
// 🧼 CONFIGURADORES: LIMPEZA E RESETS
// =========================================================================
function resetCadastroForm() {
  clienteForm.reset();
  switchFormTab("identificacao");
  
  lblCpfCnpj.innerText = "CPF";
  inCpfCnpj.placeholder = "000.000.000-00";
  lblDataNasc.innerText = "Data de Nascimento";
  lblProfissao.innerText = "Profissão";
  inProfissao.placeholder = "Ex: Engenheiro Civil";
  lblRgIe.innerText = "RG";
  inRgIe.placeholder = "Ex: 12.345.678-9";
  inEstadoCivil.disabled = false;
  
  groupProcessosAndamento.style.display = "none";
}

// =========================================================================
// 🔄 MONITOR DE SESSÃO ATIVA (REATIVE SESSON STATE)
// =========================================================================
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log(`Supabase Auth Evento: ${event}`);

  if (session && session.user) {
    const user = session.user;
    const userEmail = user.email || "";

    // Whitelist check (Security shielding)
    const whitelist = ["nainaja@hotmail.com", "jhbogdanowicz@gmail.com"];
    if (!whitelist.includes(userEmail.toLowerCase())) {
      console.warn("Acesso bloqueado: E-mail não autorizado na Whitelist.");
      alert("Acesso restrito. Este endereço de e-mail não possui autorização institucional nesta banca.");
      await supabase.auth.signOut();
      return;
    }
    
    const userMetadataName = user.user_metadata?.nome || "Advogado(a)";
    const userMetadataOab = user.user_metadata?.oab || "Não cadastrada";
    const userMetadataTratamento = user.user_metadata?.tratamento || "Dr(a).";

    const primeName = userMetadataName.split(' ')[0];
    let saudacao = "Bem-vindo(a), Dr(a).";
    if (userMetadataTratamento === "Dr.") {
      saudacao = "Bem-vindo, Dr.";
    } else if (userMetadataTratamento === "Dra.") {
      saudacao = "Bem-vinda, Dra.";
    }
    welcomeMessage.innerText = `${saudacao} ${primeName}`;
    sidebarUserName.innerText = userMetadataName;
    sidebarUserOab.innerText = userMetadataOab;
    
    const initials = userMetadataName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    sidebarUserAvatar.innerText = initials;

    landingContainer.style.display = "none";
    authContainer.style.display = "none";
    appLayout.style.display = "flex";

    const activeItem = document.querySelector(".nav-item.active");
    if (activeItem && activeItem.getAttribute("data-view") === "clientes") {
      // Se já estava visualizando detalhes, carrega, senão mostra a listagem
      if (activeClientId) {
        openClientDetailsById(activeClientId);
      } else {
        showClientesPanel("list");
      }
    } else {
      switchPrivateView("dashboard");
    }
  } else {
    landingContainer.style.display = "block";
    authContainer.style.display = "none";
    appLayout.style.display = "none";
    switchPublicView("landing");
  }
});

// =========================================================================
// ⚙️ SEÇÃO: EDIÇÃO DO PERFIL DO ADVOGADO
// =========================================================================
const handleEditProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Advogado não está autenticado.");

    editLawyerName.value = user.user_metadata?.nome || "";
    editLawyerOab.value = user.user_metadata?.oab || "";
    editLawyerTreatment.value = user.user_metadata?.tratamento || "Dr.";
    editLawyerEmail.value = user.email || "";

    // Busca o telefone e assinatura do banco relacional ou dos metadados
    let phone = user.user_metadata?.telefone || "";
    let signatureUrl = "";
    try {
      const { data: dbData, error: dbErr } = await supabase
        .from("advogados")
        .select("telefone, assinatura_digital_url")
        .eq("id", user.id)
        .single();
      if (!dbErr && dbData) {
        phone = dbData.telefone || phone;
        signatureUrl = dbData.assinatura_digital_url || "";
      }
    } catch (dbErr) {
      console.warn("Erro ao ler dados adicionais do banco de dados:", dbErr);
    }
    editLawyerPhone.value = phone;
    
    // Configurar exibição da assinatura digital cadastrada
    if (signatureUrl) {
      if (lawyerSignaturePreviewImg) lawyerSignaturePreviewImg.src = signatureUrl;
      if (lawyerSignaturePreviewContainer) lawyerSignaturePreviewContainer.style.display = "flex";
    } else {
      if (lawyerSignaturePreviewContainer) lawyerSignaturePreviewContainer.style.display = "none";
      if (lawyerSignatureCanvas) {
        const ctx = lawyerSignatureCanvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, lawyerSignatureCanvas.width, lawyerSignatureCanvas.height);
      }
      lawyerSignatureHasDrawing = false;
    }
    
    modalEditLawyer.style.display = "flex";
  } catch (err) {
    console.error("Erro ao carregar dados do advogado:", err.message);
    alert("Erro ao abrir formulário de edição de perfil.");
  }
};

btnEditLawyerProfile.addEventListener("click", handleEditProfile);
if (btnEditProfileMobile) {
  btnEditProfileMobile.addEventListener("click", handleEditProfile);
}

editLawyerPhone.addEventListener("input", applyPhoneMask);

editLawyerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const treatment = editLawyerTreatment.value;
  const name = editLawyerName.value.trim();
  const oab = editLawyerOab.value.trim();
  const phone = editLawyerPhone.value.trim();

  if (!name) {
    alert("O Nome é obrigatório.");
    return;
  }

  try {
    setLoadingState(document.getElementById("btn-save-lawyer-profile"), true, "Processando...");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sessão inválida.");

    // 1. Verificar se a assinatura foi alterada e desenhada ou carregada
    let lawyerSignatureDataUrl = null;
    if (uploadedSignatureBase64) {
      lawyerSignatureDataUrl = uploadedSignatureBase64;
    } else if (lawyerSignaturePreviewContainer && lawyerSignaturePreviewContainer.style.display === "none" && lawyerSignatureHasDrawing) {
      if (lawyerSignatureCanvas) {
        lawyerSignatureDataUrl = lawyerSignatureCanvas.toDataURL("image/png");
      }
    }

    // 2. Atualizar Supabase Auth
    let authData = { nome: name, oab: oab, tratamento: treatment, telefone: phone };
    if (lawyerSignatureDataUrl) {
      authData.assinatura_digital_url = lawyerSignatureDataUrl;
    }
    const { error: authErr } = await supabase.auth.updateUser({
      data: authData
    });
    if (authErr) throw authErr;

    // 3. Atualizar tabela public.advogados
    let dbDataUpdate = { nome: name, oab: oab, tratamento: treatment, telefone: phone };
    if (lawyerSignatureDataUrl) {
      dbDataUpdate.assinatura_digital_url = lawyerSignatureDataUrl;
    }
    const { error: dbErr } = await supabase
      .from("advogados")
      .update(dbDataUpdate)
      .eq("id", user.id);
    if (dbErr) throw dbErr;

    alert("Perfil profissional atualizado com sucesso!");
    modalEditLawyer.style.display = "none";

    // Atualizar UI
    const primeName = name.split(' ')[0];
    let saudacao = "Bem-vindo(a), Dr(a).";
    if (treatment === "Dr.") {
      saudacao = "Bem-vindo, Dr.";
    } else if (treatment === "Dra.") {
      saudacao = "Bem-vinda, Dra.";
    }
    welcomeMessage.innerText = `${saudacao} ${primeName}`;
    sidebarUserName.innerText = name;
    sidebarUserOab.innerText = oab;

    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    sidebarUserAvatar.innerText = initials;

  } catch (err) {
    console.error("Erro ao salvar perfil profissional:", err.message);
    alert(`Erro ao salvar alterações: ${err.message}`);
  } finally {
    setLoadingState(document.getElementById("btn-save-lawyer-profile"), false, "Salvar Alterações");
  }
});

// Inicialização e gerenciamento do quadro de assinatura digital da advogada
function initLawyerSignatureCanvas() {
  if (!lawyerSignatureCanvas) return;

  const ctx = lawyerSignatureCanvas.getContext("2d");
  let activeCanvasRect = null; // Cache do bounding rect para evitar reflow lag durante o desenho
  
  // Função para reconfigurar dimensões e estilos do canvas
  const setupCanvasSize = () => {
    lawyerSignatureCanvas.width = lawyerSignatureCanvas.parentElement.clientWidth || 350;
    lawyerSignatureCanvas.height = 120;
    if (ctx) {
      ctx.strokeStyle = "#0c1625"; // Cor azul-escura clássica de caneta
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
    }
  };

  // Inicializar dimensões
  setupCanvasSize();
  
  // Redimensionar se a janela mudar de tamanho
  window.addEventListener("resize", () => {
    if (lawyerSignaturePreviewContainer && lawyerSignaturePreviewContainer.style.display === "none") {
      setupCanvasSize();
    }
  });

  const getCoords = (e) => {
    const rect = activeCanvasRect || lawyerSignatureCanvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    lawyerSignatureIsDrawing = true;
    lawyerSignatureHasDrawing = true;
    activeCanvasRect = lawyerSignatureCanvas.getBoundingClientRect(); // Caching rect on click start!
    const coords = getCoords(e);
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const drawLine = (e) => {
    if (!lawyerSignatureIsDrawing) return;
    e.preventDefault();
    const coords = getCoords(e);
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const endDraw = () => {
    lawyerSignatureIsDrawing = false;
    activeCanvasRect = null; // Limpa o cache ao terminar
  };

  lawyerSignatureCanvas.addEventListener("mousedown", startDraw);
  lawyerSignatureCanvas.addEventListener("mousemove", drawLine);
  lawyerSignatureCanvas.addEventListener("mouseup", endDraw);
  lawyerSignatureCanvas.addEventListener("mouseleave", endDraw);

  lawyerSignatureCanvas.addEventListener("touchstart", startDraw, { passive: false });
  lawyerSignatureCanvas.addEventListener("touchmove", drawLine, { passive: false });
  lawyerSignatureCanvas.addEventListener("touchend", endDraw);

  // Escuta o input de importação de arquivo
  if (lawyerSignatureUpload) {
    lawyerSignatureUpload.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          alert("Por favor, selecione um arquivo de imagem válido (PNG ou JPEG).");
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Str = event.target?.result;
          if (base64Str) {
            uploadedSignatureBase64 = base64Str;
            lawyerSignatureHasDrawing = true;
            if (lawyerSignaturePreviewImg) lawyerSignaturePreviewImg.src = base64Str;
            if (lawyerSignaturePreviewContainer) lawyerSignaturePreviewContainer.style.display = "flex";
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnLawyerSignatureClear) {
    btnLawyerSignatureClear.addEventListener("click", () => {
      if (ctx) ctx.clearRect(0, 0, lawyerSignatureCanvas.width, lawyerSignatureCanvas.height);
      lawyerSignatureHasDrawing = false;
      uploadedSignatureBase64 = null; // Reseta arquivo carregado
      if (lawyerSignatureUpload) lawyerSignatureUpload.value = ""; // Reseta input
    });
  }

  if (btnLawyerSignatureRedraw) {
    btnLawyerSignatureRedraw.addEventListener("click", () => {
      if (lawyerSignaturePreviewContainer) lawyerSignaturePreviewContainer.style.display = "none";
      setTimeout(setupCanvasSize, 50);
      lawyerSignatureHasDrawing = false;
      uploadedSignatureBase64 = null; // Reseta arquivo carregado
      if (lawyerSignatureUpload) lawyerSignatureUpload.value = ""; // Reseta input
    });
  }
}



// =========================================================================
// ⚖️ SEÇÃO: EDIÇÃO DE PROCESSOS VINCULADOS
// =========================================================================
btnEditProcessTrigger.addEventListener("click", async () => {
  if (!activeProcessId) return;
  try {
    const { data: p, error } = await supabase
      .from("processos")
      .select("*")
      .eq("id", activeProcessId)
      .single();
    
    if (error) throw error;
    if (p) {
      editProcTitulo.value = p.titulo || "";
      editProcNumero.value = p.numero_processo || "";
      editProcArea.value = p.area_direito || "";
      editProcStatus.value = p.status || "Ativo";
      editProcTribunal.value = p.tribunal || "";
      editProcVara.value = p.vara || "";
      editProcValor.value = p.valor_causa || "";
      editProcObservacoes.value = p.observacoes_internas || "";

      modalEditProcess.style.display = "flex";
    }
  } catch (err) {
    console.error("Erro ao carregar processo para edição:", err.message);
    alert("Erro ao abrir formulário de edição do processo.");
  }
});

editProcessForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeProcessId) return;

  const titulo = editProcTitulo.value.trim();
  const numero = editProcNumero.value.trim();
  const area = editProcArea.value.trim();
  const status = editProcStatus.value;
  const tribunal = editProcTribunal.value.trim();
  const vara = editProcVara.value.trim();
  const valor = editProcValor.value ? parseFloat(editProcValor.value) : null;
  const observacoes = editProcObservacoes.value.trim();

  if (!titulo || !numero) {
    alert("O Título e o Número do processo são obrigatórios.");
    return;
  }

  try {
    setLoadingState(document.getElementById("btn-save-process-changes"), true, "Salvando...");

    const { error } = await supabase
      .from("processos")
      .update({
        titulo: titulo,
        numero_processo: numero,
        area_direito: area,
        status: status,
        tribunal: tribunal,
        vara: vara,
        valor_causa: valor,
        observacoes_internas: observacoes
      })
      .eq("id", activeProcessId);

    if (error) throw error;

    alert("Processo atualizado com sucesso!");
    modalEditProcess.style.display = "none";
    modalProcessoDetail.style.display = "none";

    // Recarrega lista de processos do cliente
    loadClientProcessesList();
    
    // Recarrega dashboard
    loadDashboardData();

  } catch (err) {
    console.error("Erro ao atualizar processo:", err.message);
    alert(`Erro ao salvar alterações: ${err.message}`);
  } finally {
    setLoadingState(document.getElementById("btn-save-process-changes"), false, "Salvar Alterações");
  }
});

// =========================================================================
// 📅 SEÇÃO: EDIÇÃO DE COMPROMISSOS E AGENDA
// =========================================================================
compromissosTimelineList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-edit-comp-trigger");
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  openEditCompromisso(id);
});

async function openEditCompromisso(id) {
  activeCompromissoId = id;

  try {
    const { data: comp, error } = await supabase
      .from("compromissos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (comp) {
      editCompTitulo.value = comp.titulo || "";
      editCompTipo.value = comp.tipo || "Reunião Online";
      
      if (comp.data_hora) {
        const dateObj = new Date(comp.data_hora);
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        editCompDataHora.value = dateObj.toISOString().slice(0, 16);
      } else {
        editCompDataHora.value = "";
      }

      editCompStatus.value = comp.status || "Agendado";
      editCompValidationError.style.display = "none";

      // Determinar dados de Reunião Online
      let isOnline = false;
      let plat = "google_meet";
      let notesText = comp.anotacoes_pos_evento || "";
      
      if (comp.anotacoes_pos_evento && comp.anotacoes_pos_evento.startsWith("{") && comp.anotacoes_pos_evento.endsWith("}")) {
        try {
          const parsed = JSON.parse(comp.anotacoes_pos_evento);
          isOnline = parsed.online === true || (parsed.plataforma ? true : false);
          plat = parsed.plataforma || "google_meet";
          notesText = parsed.anotacoes || "";
        } catch (e) {
          // ignore
        }
      } else if (comp.tipo === "Reunião Online" || comp.tipo === "Reunião") {
        isOnline = true;
        if (comp.local_link) {
          if (comp.local_link.includes("zoom.us")) plat = "zoom";
          else if (comp.local_link.includes("teams.microsoft.com")) plat = "teams";
          else if (comp.local_link.includes("meet.google.com") || comp.local_link.includes("google.com")) plat = "google_meet";
          else plat = "outro";
        }
      }

      // Lógica de Exibição Outlook-style baseada no Tipo
      if (comp.tipo === "Prazo Processual") {
        editCompOnlineToggleContainer.style.display = "none";
        editCompLocalGroup.style.display = "none";
        editCompVirtualRoomConfig.style.display = "none";
      } else {
        if (comp.tipo === "Reunião Online" || comp.tipo === "Reunião") {
          editCompOnlineToggleContainer.style.display = "flex";
          editCompOnlineToggleTitle.innerText = "🎥 Reunião Online";
        } else if (comp.tipo === "Audiência") {
          editCompOnlineToggleContainer.style.display = "flex";
          editCompOnlineToggleTitle.innerText = "🎥 Audiência Virtual";
        } else {
          editCompOnlineToggleContainer.style.display = "none";
        }

        editCompOnlineToggle.checked = isOnline;
        handleToggleChange(editCompOnlineToggle, editCompLocalGroup, editCompVirtualRoomConfig, isOnline);

        if (isOnline) {
          editCompMeetingLink.value = comp.local_link || "";
          editCompLocalFisico.value = "";

          // Ativar botão da plataforma
          selectedEditPlatform = plat;
          const platBtns = document.querySelectorAll("#edit-comp-virtual-room-config .btn-platform-select");
          platBtns.forEach(b => b.classList.remove("active"));
          const activeBtn = document.querySelector(`#edit-comp-virtual-room-config button[data-platform="${plat}"]`);
          if (activeBtn) {
            activeBtn.classList.add("active");
          }
          
          // Ajustar visualização do meet helper
          if (plat === "google_meet") {
            editMeetHelperContainer.style.display = "block";
            editCompMeetingLinkLabel.innerText = "Link do Google Meet *";
            editCompMeetingLink.placeholder = "meet.google.com/...";
          } else if (plat === "zoom") {
            editMeetHelperContainer.style.display = "none";
            editCompMeetingLinkLabel.innerText = "Link do Zoom *";
            editCompMeetingLink.placeholder = "zoom.us/...";
          } else if (plat === "teams") {
            editMeetHelperContainer.style.display = "none";
            editCompMeetingLinkLabel.innerText = "Link do Microsoft Teams *";
            editCompMeetingLink.placeholder = "teams.microsoft.com/...";
          } else {
            editMeetHelperContainer.style.display = "none";
            editCompMeetingLinkLabel.innerText = "Link da Reunião *";
            editCompMeetingLink.placeholder = "Cole o link da reunião virtual";
          }
        } else {
          editCompLocalFisico.value = comp.local_link || "";
          editCompMeetingLink.value = "";
        }
      }

      editCompAnotacoes.value = notesText;

      modalEditCompromisso.style.display = "flex";
    }
  } catch (err) {
    console.error("Erro ao buscar compromisso para edição:", err.message);
    alert("Não foi possível carregar os dados do compromisso.");
  }
}

editCompromissoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeCompromissoId) return;

  const titulo = editCompTitulo.value.trim();
  const tipo = editCompTipo.value;
  const dataHora = editCompDataHora.value;
  const status = editCompStatus.value;
  const rawAnotacoes = editCompAnotacoes.value.trim();

  if (!titulo || !dataHora) {
    alert("O Título e a Data/Hora são obrigatórios.");
    return;
  }

  let localLink = "";
  let anotacoes = rawAnotacoes;

  const isOnlineChecked = editCompOnlineToggle.checked && (tipo !== "Prazo Processual");

  if (tipo === "Prazo Processual") {
    localLink = "";
    anotacoes = JSON.stringify({ online: false, anotacoes: rawAnotacoes });
  } else if (isOnlineChecked) {
    const meetLink = editCompMeetingLink.value.trim();
    const validationErr = validateMeetingLink(meetLink, selectedEditPlatform);
    if (validationErr) {
      alert(`Erro de Validação: ${validationErr}`);
      editCompMeetingLink.focus();
      return;
    }
    localLink = meetLink;
    anotacoes = JSON.stringify({ plataforma: selectedEditPlatform, online: true, anotacoes: rawAnotacoes });
  } else {
    localLink = editCompLocalFisico.value.trim();
    anotacoes = JSON.stringify({ online: false, anotacoes: rawAnotacoes });
  }

  try {
    setLoadingState(document.getElementById("btn-save-compromisso-changes"), true, "Salvando...");

    const { error } = await supabase
      .from("compromissos")
      .update({
        titulo: titulo,
        tipo: tipo,
        data_hora: new Date(dataHora).toISOString(),
        local_link: localLink || null,
        status: status,
        anotacoes_pos_evento: anotacoes || null
      })
      .eq("id", activeCompromissoId);

    if (error) throw error;

    alert("Compromisso atualizado com sucesso!");
    modalEditCompromisso.style.display = "none";

    // Recarrega a timeline de compromissos
    loadClientCommitmentsList();
    
    // Recarrega o dashboard
    loadDashboardData();

  } catch (err) {
    console.error("Erro ao atualizar compromisso:", err.message);
    alert(`Erro ao salvar alterações: ${err.message}`);
  } finally {
    setLoadingState(document.getElementById("btn-save-compromisso-changes"), false, "Salvar Alterações");
  }
});

// =========================================================================
// 🌐 SEÇÃO: NAVEGAÇÃO DA LANDING PAGE
// =========================================================================
btnGoRestricted.addEventListener("click", () => {
  switchPublicView("login");
});

if (btnHeroLogin) {
  btnHeroLogin.addEventListener("click", () => {
    switchPublicView("login");
  });
}

  linksGoLanding.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchPublicView("landing");
  });
});

if (linkForgotPassword) {
  linkForgotPassword.addEventListener("click", (e) => {
    e.preventDefault();
    switchPublicView("forgot");
  });
}

if (linkBackLogin) {
  linkBackLogin.addEventListener("click", (e) => {
    e.preventDefault();
    switchPublicView("login");
  });
}

if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(forgotMessage);

    const email = forgotEmail.value.trim().toLowerCase();
    if (!email) {
      showMessage(forgotMessage, "Por favor, preencha o e-mail.", "error");
      return;
    }

    const whitelist = ["nainaja@hotmail.com", "jhbogdanowicz@gmail.com"];
    if (!whitelist.includes(email)) {
      showMessage(forgotMessage, "Acesso não autorizado para este endereço institucional.", "error");
      return;
    }

    try {
      setLoadingState(btnForgotSubmit, true, "Processando...");
      
      const redirectUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/atualizar-senha' 
        : `${window.location.origin}/atualizar-senha`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        showMessage(forgotMessage, `Erro: ${error.message}`, "error");
      } else {
        showMessage(forgotMessage, "Link de redefinição enviado! Verifique sua caixa de entrada.", "success");
        forgotForm.reset();
      }
    } catch (err) {
      console.error(err);
      showMessage(forgotMessage, "Erro inesperado. Tente novamente.", "error");
    } finally {
      setLoadingState(btnForgotSubmit, false, "Enviar Link de Recuperação");
    }
  });
}

// =========================================================================
// ⚡ SEÇÃO: FLUXO COMPLETO E LÓGICA DE ESTRATÉGIAS JURÍDICAS IA
// =========================================================================

// Fechamento de Modais
btnCloseModalProcessoIa.addEventListener("click", () => {
  modalProcessoIa.style.display = "none";
});
btnCancelarProcessoIa.addEventListener("click", () => {
  modalProcessoIa.style.display = "none";
});

// Mapeamento do índice das fases processuais da estratégia
const FASES_IA = {
  pre: 0,
  inicial: 1,
  audiencia: 2
};

// Carrega os dados do estado para os textareas do editor
function updateIAEditorFields() {
  if (!currentIAResponse || !currentIAResponse.estrategia_processual) return;
  
  const phaseIndex = FASES_IA[activeIATab];
  const phaseData = currentIAResponse.estrategia_processual[phaseIndex];
  
  if (!phaseData || !phaseData.acoes) return;
  
  const acoes = phaseData.acoes;
  
  // Converte arrays de strings retornados pela IA em linhas de texto
  iaTesesTextarea.value = (acoes.teses_juridicas || []).join("\n");
  iaDocsTextarea.value = (acoes.documentos_necessarios || []).join("\n");
  iaLeisTextarea.value = (acoes.fundamentacao_legal || []).join("\n");
  iaRiscosTextarea.value = (acoes.riscos_e_alertas || []).join("\n");
  iaPassosTextarea.value = (acoes.proximos_passos || []).join("\n");
}

// Salva os valores atualmente digitados nos textareas de volta para o estado
function saveIAEditorFieldsToState() {
  if (!currentIAResponse || !currentIAResponse.estrategia_processual) return;
  
  const phaseIndex = FASES_IA[activeIATab];
  const phaseData = currentIAResponse.estrategia_processual[phaseIndex];
  
  if (!phaseData) return;
  if (!phaseData.acoes) {
    phaseData.acoes = {};
  }
  
  // Função auxiliar para dividir strings em arrays removendo linhas vazias
  const textToArray = (val) => val.split("\n").map(l => l.trim()).filter(l => l !== "");
  
  phaseData.acoes.teses_juridicas = textToArray(iaTesesTextarea.value);
  phaseData.acoes.documentos_necessarios = textToArray(iaDocsTextarea.value);
  phaseData.acoes.fundamentacao_legal = textToArray(iaLeisTextarea.value);
  phaseData.acoes.riscos_e_alertas = textToArray(iaRiscosTextarea.value);
  phaseData.acoes.proximos_passos = textToArray(iaPassosTextarea.value);
}

// Controla a troca de abas no formulário/editor de estratégia
function switchIATab(tabName) {
  // 1. Salva o conteúdo digitado no estado da aba anterior
  saveIAEditorFieldsToState();
  
  // 2. Atualiza a classe de aba ativa na UI
  iaStrategyTabButtons.forEach(btn => {
    if (btn.getAttribute("data-ia-tab") === tabName) {
      btn.classList.add("active");
      btn.style.color = "var(--gold)";
      btn.style.backgroundColor = "rgba(197, 168, 92, 0.08)";
      btn.style.borderColor = "rgba(197, 168, 92, 0.25)";
    } else {
      btn.classList.remove("active");
      btn.style.color = "var(--text-secondary)";
      btn.style.backgroundColor = "transparent";
      btn.style.borderColor = "transparent";
    }
  });
  
  // 3. Define a nova aba ativa e carrega seus dados no editor
  activeIATab = tabName;
  updateIAEditorFields();
}

// Vincula eventos nos botões das abas da estratégia
iaStrategyTabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-ia-tab");
    switchIATab(tabName);
  });
});

// Sincronizador de Loading da IA com Mensagens Dinâmicas
let iaLoadingInterval = null;
function startIALoading() {
  iaLoadingOverlay.style.display = "flex";
  iaStrategyContainer.style.display = "none";
  btnGerarEstrategiaIa.disabled = true;
  btnRegerarIa.disabled = true;
  
  const messages = [
    "Analisando relatos do cliente...",
    "Mapeando artigos da lei...",
    "Estruturando teses jurídicas...",
    "Buscando jurisprudência complementar...",
    "Validando fundamentações na legislação brasileira...",
    "Refinando planos de ação processual..."
  ];
  
  let i = 0;
  iaLoadingText.innerText = messages[0];
  
  iaLoadingInterval = setInterval(() => {
    i = (i + 1) % messages.length;
    iaLoadingText.innerText = messages[i];
  }, 3000);
}

function stopIALoading() {
  if (iaLoadingInterval) {
    clearInterval(iaLoadingInterval);
    iaLoadingInterval = null;
  }
  iaLoadingOverlay.style.display = "none";
  btnGerarEstrategiaIa.disabled = false;
  btnRegerarIa.disabled = false;
}

// Execução da geração de estratégia via IA
async function processIAGenerator() {
  if (!activeClientId) {
    alert("Nenhum cliente selecionado ativamente.");
    return;
  }
  
  // Mapear dados e observações do perfil do cliente selecionado
  const clientName = editInName.value;
  const clientObservations = editInObservacoes.value;
  const clientAssistance = editInTipoAssistencia.value;
  const selectedAreas = Array.from(document.querySelectorAll("input[name='edit-client-areas']:checked"))
    .map(cb => cb.value)
    .join(", ") || editInAreasExtra.value || "Área Não Especificada";
  
  const dadosDoClienteCompilados = `
Nome do Cliente: ${clientName}
Área Jurídica de Interesse: ${selectedAreas}
Tipo de Assistência Contratada: ${clientAssistance}
Fatos Narrados e Histórico Detalhado:
${clientObservations || "Nenhuma anotação de fatos foi inserida na ficha do cliente ainda."}
`;
  
  try {
    startIALoading();
    
    // Chamada segura para o endpoint da serverless function
    const response = await fetch("/api/gerar-estrategia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dados_do_cliente: dadosDoClienteCompilados
      })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || errData.details || "Erro no servidor da IA.");
    }
    
    const data = await response.json();
    
    if (!data || !data.estrategia_processual) {
      throw new Error("Estrutura estratégica inválida retornada pelo servidor.");
    }
    
    // Salva o JSON gerado no estado e ativa a visualização
    currentIAResponse = data;
    stopIALoading();
    
    // Atualiza a visualização com a aba padrão (Pré-Processual)
    activeIATab = "pre";
    switchIATab("pre");
    
    // Exibe o container da estratégia e ajusta os botões
    iaStrategyContainer.style.display = "block";
    btnSalvarProcessoIa.style.display = "block";
    
    // Preenche automaticamente o título da ação sugerido se estiver vazio
    if (!inProcIaTitulo.value.trim()) {
      inProcIaTitulo.value = `Ação Jurídica - ${selectedAreas} (${clientName})`;
    }
    if (!inProcIaArea.value) {
      inProcIaArea.value = selectedAreas.split(", ")[0] || "";
    }
    
  } catch (err) {
    stopIALoading();
    console.error("Falha ao gerar estratégia com IA:", err);
    
    // Exibe o toast amigável conforme regras de erro da especificação
    const retry = confirm("Não foi possível gerar a estratégia com IA no momento. Deseja tentar novamente ou estruturar o Processo Manualmente?");
    if (retry) {
      processIAGenerator();
    }
  }
}

// Vincula gatilho de geração ao botão
btnGerarEstrategiaIa.addEventListener("click", () => {
  processIAGenerator();
});
btnRegerarIa.addEventListener("click", () => {
  processIAGenerator();
});

// 💾 FLUXO: SALVAR PROCESSO COM ESTRATÉGIA GERADA E EDITADA
processoIaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!activeClientId) return;
  if (!currentIAResponse) {
    alert("Gere uma estratégia com IA antes de salvar ou utilize o salvamento manual.");
    return;
  }
  
  // Salva o conteúdo atualmente visualizado
  saveIAEditorFieldsToState();
  
  const titulo = inProcIaTitulo.value.trim();
  const numero = inProcIaNumero.value.trim();
  const area = inProcIaArea.value;
  const status = inProcIaStatus.value;
  const tribunal = inProcIaTribunal.value.trim();
  const vara = inProcIaVara.value.trim();
  const valor = inProcIaValor.value ? parseFloat(inProcIaValor.value) : null;
  const observacoes = inProcIaObservacoes.value.trim();
  
  try {
    setLoadingState(btnSalvarProcessoIa, true, "Sincronizando...");
    
    const { data, error } = await supabase
      .from("processos")
      .insert({
        cliente_id: activeClientId,
        titulo: titulo,
        numero_processo: numero || null,
        area_direito: area || null,
        status: status,
        tribunal: tribunal || null,
        vara: vara || null,
        valor_causa: valor,
        observacoes_internas: observacoes || null,
        estrategia_ia: currentIAResponse
      });
      
    if (error) throw error;
    
    alert("Processo judicial e planejamento estratégico salvos com sucesso!");
    modalProcessoIa.style.display = "none";
    
    // Recarrega as listagens correspondentes
    loadClientProcessesList();
    loadDashboardData();
    
  } catch (err) {
    console.error("Erro ao persistir processo:", err.message);
    alert(`Erro ao salvar processo: ${err.message}`);
  } finally {
    setLoadingState(btnSalvarProcessoIa, false, "Salvar Processo e Estratégia");
  }
});

// 💾 FLUXO: SALVAR APENAS OS METADADOS (MANUAL)
btnSalvarProcessoManual.addEventListener("click", async () => {
  if (!activeClientId) return;
  
  const titulo = inProcIaTitulo.value.trim();
  const numero = inProcIaNumero.value.trim();
  const area = inProcIaArea.value;
  const status = inProcIaStatus.value;
  const tribunal = inProcIaTribunal.value.trim();
  const vara = inProcIaVara.value.trim();
  const valor = inProcIaValor.value ? parseFloat(inProcIaValor.value) : null;
  const observacoes = inProcIaObservacoes.value.trim();
  
  if (!titulo || !area) {
    alert("Para o salvamento manual, preencha o Título da Ação e a Área do Direito.");
    inProcIaTitulo.focus();
    return;
  }
  
  try {
    setLoadingState(btnSalvarProcessoManual, true, "Salvando...");
    
    const { error } = await supabase
      .from("processos")
      .insert({
        cliente_id: activeClientId,
        titulo: titulo,
        numero_processo: numero || null,
        area_direito: area || null,
        status: status,
        tribunal: tribunal || null,
        vara: vara || null,
        valor_causa: valor,
        observacoes_internas: observacoes || null,
        estrategia_ia: null // Sem estratégia IA associada
      });
      
    if (error) throw error;
    
    alert("Processo judicial cadastrado manualmente com sucesso!");
    modalProcessoIa.style.display = "none";
    
    // Recarrega listagens
    loadClientProcessesList();
    loadDashboardData();
    
  } catch (err) {
    console.error("Erro no cadastro manual de processo:", err.message);
    alert(`Erro ao salvar processo: ${err.message}`);
  } finally {
    setLoadingState(btnSalvarProcessoManual, false, "Salvar Sem Estratégia (Manual)");
  }
});

// =========================================================================
// ⚡ SEÇÃO: DETALHES DO PROCESSO - NAVEGAÇÃO DE ABAS & ESTRATÉGIA IA
// =========================================================================

// Click na aba Linha do Tempo (Timeline)
btnDetailTabTimeline.addEventListener("click", () => {
  btnDetailTabTimeline.classList.add("active");
  btnDetailTabEstrategia.classList.remove("active");
  btnDetailTabTimeline.style.color = "var(--text-primary)";
  btnDetailTabTimeline.style.borderBottomColor = "var(--gold)";
  btnDetailTabEstrategia.style.color = "var(--text-secondary)";
  btnDetailTabEstrategia.style.borderBottomColor = "transparent";
  
  detailTimelineContainer.style.display = "block";
  detailEstrategiaContainer.style.display = "none";
});

// Click na aba Estratégia Jurídica IA
btnDetailTabEstrategia.addEventListener("click", () => {
  if (!activeDetailProcessStrategy) return;
  
  btnDetailTabTimeline.classList.remove("active");
  btnDetailTabEstrategia.classList.add("active");
  btnDetailTabTimeline.style.color = "var(--text-secondary)";
  btnDetailTabTimeline.style.borderBottomColor = "transparent";
  btnDetailTabEstrategia.style.color = "var(--gold)";
  btnDetailTabEstrategia.style.borderBottomColor = "var(--gold)";
  
  detailTimelineContainer.style.display = "none";
  detailEstrategiaContainer.style.display = "block";
  
  // Seta e renderiza a sub-aba padrão (Pré-Processual)
  switchDetailStrategyTab("pre");
});

// Controla a troca de sub-aba de estratégia no visualizador
function switchDetailStrategyTab(tabName) {
  viewStrategyTabButtons.forEach(btn => {
    const isTarget = btn.getAttribute("data-view-tab") === tabName;
    btn.classList.toggle("active", isTarget);
    if (isTarget) {
      btn.style.color = "var(--gold)";
      btn.style.backgroundColor = "rgba(197, 168, 92, 0.08)";
      btn.style.borderColor = "var(--gold)";
    } else {
      btn.style.color = "var(--text-secondary)";
      btn.style.backgroundColor = "transparent";
      btn.style.borderColor = "var(--input-border)";
    }
  });
  
  renderDetailStrategyTab(tabName);
}

// Vincula click aos botões de sub-abas do visualizador
viewStrategyTabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-view-tab");
    switchDetailStrategyTab(tabName);
  });
});

// Renderizador da Estratégia Jurídica Salva (Apenas leitura premium com bullet-points)
function renderDetailStrategyTab(tabName) {
  if (!activeDetailProcessStrategy) return;
  
  let phaseIndex = FASES_IA[tabName];
  const phaseData = activeDetailProcessStrategy.estrategia_processual?.[phaseIndex];
  
  if (!phaseData || !phaseData.acoes) {
    viewStrategyTabContent.innerHTML = `<div class="inactive-empty">Nenhum dado estratégico salvo para esta fase.</div>`;
    return;
  }
  
  const acoes = phaseData.acoes;
  
  // Função auxiliar de renderização de listas em HTML
  const renderList = (title, items, colorVar, iconSvg) => {
    const listHtml = (items && items.length > 0)
      ? `<ul class="strategy-bullet-list">${items.map(item => `<li>${item}</li>`).join("")}</ul>`
      : `<p style="font-size: 13px; color: var(--text-secondary); margin: 0; font-style: italic;">Nenhum item cadastrado.</p>`;
      
    return `
      <div class="strategy-card-item">
        <div class="strategy-card-title" style="color: ${colorVar}; display: flex; align-items: center; gap: 8px;">
          ${iconSvg}
          <span>${title}</span>
        </div>
        ${listHtml}
      </div>
    `;
  };
  
  const teseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  const docIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
  const leiIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  const riscoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--error-color);"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  const passoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success-color);"><polyline points="20 6 9 17 4 12"/></svg>`;
  
  viewStrategyTabContent.innerHTML = `
    ${renderList("Teses Jurídicas Sugeridas", acoes.teses_juridicas, "var(--gold)", teseIcon)}
    ${renderList("Documentos Indispensáveis", acoes.documentos_necessarios, "var(--text-primary)", docIcon)}
    ${renderList("Fundamentação Legal Recomendada", acoes.fundamentacao_legal, "var(--gold)", leiIcon)}
    <div class="strategy-row-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      ${renderList("Riscos e Pontos de Atenção", acoes.riscos_e_alertas, "var(--error-color)", riscoIcon)}
      ${renderList("Ações Jurídicas Imediatas", acoes.proximos_passos, "var(--success-color)", passoIcon)}
    </div>
  `;
}

// =========================================================================
// 📄 SEÇÃO: CENTRAL DE DOCUMENTOS & RELATÓRIOS EM PDF (jsPDF)
// =========================================================================

// Carrega e renderiza a listagem de processos com estratégia na Central de Documentos
function loadClientDocumentsList(processes) {
  if (!documentosListContainer) return;
  documentosListContainer.innerHTML = "";

  // Filtra apenas processos que possuem estratégia de IA estruturada
  const processesWithStrategy = processes.filter(
    (p) => p.estrategia_ia && p.estrategia_ia.estrategia_processual
  );

  if (processesWithStrategy.length > 0) {
    documentosEmptyMsg.style.display = "none";
    documentosListContainer.style.display = "flex";

    processesWithStrategy.forEach((p) => {
      const card = document.createElement("div");
      card.className = "doc-item-card";

      card.innerHTML = `
        <div class="doc-item-icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="doc-item-details">
          <span class="doc-item-title">${p.titulo}</span>
          <span class="doc-item-meta">Relatório de Estratégia Jurídica IA • Nº ${p.numero_processo || "Sem número"}</span>
        </div>
        <button type="button" class="btn-generate-pdf-doc" data-process-id="${p.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>Gerar PDF</span>
        </button>
      `;

      const btn = card.querySelector(".btn-generate-pdf-doc");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activeClientObject) {
          generateStrategyPDF(activeClientObject, p);
        } else {
          alert("Erro: Nenhum cliente carregado ativamente.");
        }
      });

      documentosListContainer.appendChild(card);
    });
  } else {
    documentosEmptyMsg.style.display = "block";
    documentosListContainer.style.display = "none";
  }
}

// Ouvinte do botão Gerar PDF no cabeçalho de Estratégia Jurídica do Modal de Detalhes
if (btnExportarPdfEstrategia) {
  btnExportarPdfEstrategia.addEventListener("click", () => {
    if (activeClientObject && activeDetailProcessObject) {
      generateStrategyPDF(activeClientObject, activeDetailProcessObject);
    } else {
      alert("Erro: Informações do cliente ou do processo não encontradas.");
    }
  });
}

// Motor de Geração Premium de PDF com jsPDF (Papel Timbrado Digital, Margens e Auto-Paginação)
async function generateStrategyPDF(client, process) {
  if (!window.jspdf) {
    alert("Erro: A biblioteca de geração de PDF ainda está carregando ou falhou. Verifique sua conexão.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  // Configurações Globais do Documento
  let currentPageNum = 1;
  let currentY = 30; // Margem superior inicial para conteúdo da primeira página
  const marginX = 20;
  const printableWidth = 170; // 210 - 20 - 20 (A4)
  const primaryColor = [15, 23, 42]; // Azul Escuro Slate (#0F172A)
  const goldColor = [180, 140, 50]; // Dourado Escuro para Impressão (#B48C32)
  const textColor = [50, 50, 50]; // Grafite Escuro para Corpo
  const lightGrayColor = [220, 220, 220]; // Linhas Divisórias

  // Helper para desenhar Papel Timbrado Digital em todas as páginas
  function drawLetterhead(pdf, pageNum) {
    // Linha Superior de Papel Timbrado
    pdf.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    pdf.setLineWidth(0.6);
    pdf.line(marginX, 20, 210 - marginX, 20);

    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, 21, 210 - marginX, 21);

    // Identificação do Escritório (Top-Left)
    pdf.setFont("times", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text("JT - JANAINA TARABAUCA ADVOCACIA", marginX, 15);

    // Tagline / Slogan (Top-Right)
    pdf.setFont("times", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Consultoria Jurídica de Alto Padrão", 210 - marginX, 15, { align: "right" });

    // Linha e Texto de Rodapé Confidencial
    pdf.setDrawColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, 280, 210 - marginX, 280);

    pdf.setFont("times", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Documento Jurídico Confidencial • Direitos Reservados JT - Janaina Tarabauca Advocacia", marginX, 285);
    pdf.text(`Página ${pageNum}`, 210 - marginX, 285, { align: "right" });
  }

  // Helper para controlar a quebra de página
  function checkPageOverflow(heightNeeded) {
    if (currentY + heightNeeded > 268) {
      doc.addPage();
      currentPageNum++;
      drawLetterhead(doc, currentPageNum);
      currentY = 32; // Inicia o Y no topo da nova página com margem segura
      return true;
    }
    return false;
  }

  // Helper para renderizar linhas de texto embrulhadas com quebra de página dinâmica
  function printWrappedParagraphs(paragraphs, fontSize = 10, fontStyle = "normal", color = textColor, indent = 0) {
    doc.setFont("times", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    paragraphs.forEach((text) => {
      const wrappedText = doc.splitTextToSize(text, printableWidth - indent);
      const lineHeight = fontSize * 0.45; // mm por linha
      const paragraphHeight = wrappedText.length * lineHeight;

      checkPageOverflow(paragraphHeight + 3); // 3mm de espaçamento

      wrappedText.forEach((line) => {
        doc.text(line, marginX + indent, currentY);
        currentY += lineHeight;
      });

      currentY += 2; // Espaço entre parágrafos
    });
  }

  // Helper para renderizar cabeçalhos de seções no PDF
  function printSectionTitle(title, topMargin = 6) {
    currentY += topMargin;
    checkPageOverflow(12);

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title.toUpperCase(), marginX, currentY);
    currentY += 2;

    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, marginX + 30, currentY); // Traço dourado elegante de 30mm
    currentY += 5;
  }

  // --- EXECUÇÃO DO DESENHO DO DOCUMENTO ---

  // Desenha o cabeçalho/timbre inicial da Página 1
  drawLetterhead(doc, currentPageNum);

  // 1. TÍTULO DO RELATÓRIO
  currentY = 36;
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("PARECER JURÍDICO DE ESTRATÉGIA PROCESSUAL", 105, currentY, { align: "center" });
  currentY += 4;

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text("Análise Estruturada por Inteligência Artificial Especializada", 105, currentY, { align: "center" });
  currentY += 8;

  // 2. SEÇÃO I: QUALIFICAÇÃO DO CLIENTE & DADOS DO PROCESSO
  printSectionTitle("I. Qualificação da Ficha e Metadados do Caso", 2);

  // Construção do bloco de dados civil do cliente e do processo
  const dataNascimentoLabel = client.tipo_pessoa === "PJ" ? "Fundação" : "Nascimento";
  const docLabel = client.tipo_pessoa === "PJ" ? "CNPJ" : "CPF";
  const profissaoLabel = client.tipo_pessoa === "PJ" ? "Ramo de Atuação" : "Profissão";

  const clientInfo = [
    `Cliente: ${client.nome} (${client.tipo_pessoa || "PF"})`,
    `${docLabel}: ${client.cpf_cnpj || "Não cadastrado"}  |  ${dataNascimentoLabel}: ${client.data_nascimento_fundacao || "Não informada"}`,
    `Contato: ${client.telefone || "Sem telefone"}  |  E-mail: ${client.email || "Não informado"}`,
    `Endereço: ${client.endereco_completo || "Não qualificado"}`,
  ];

  printWrappedParagraphs(clientInfo, 9.5, "normal", textColor, 4);
  currentY += 2;

  // Bloco de informações do Processo
  const valCausa = process.valor_causa 
    ? `R$ ${process.valor_causa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "Não cadastrado";

  const processInfo = [
    `Título do Processo: ${process.titulo}`,
    `Número Único CNJ: ${process.numero_processo || "Em fase pré-processual / não distribuído"}`,
    `Área do Direito: ${process.area_direito || "Não informada"}  |  Valor da Causa: ${valCausa}`,
    `Tribunal de Destino: ${process.tribunal || "Não especificado"}  |  Vara / Comarca: ${process.vara || "Não qualificada"}`,
    `Status Processual: ${process.status || "Ativo"}`
  ];

  doc.setDrawColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
  doc.setLineWidth(0.15);
  doc.line(marginX, currentY, 210 - marginX, currentY); // Linha divisória fina
  currentY += 5;

  printWrappedParagraphs(processInfo, 9.5, "normal", textColor, 4);
  currentY += 4;

  // 3. SEÇÃO II: ESTRATÉGIA PROCESSUAL POR FASES (PROMPT 6)
  printSectionTitle("II. estratégia jurídica recomendada", 4);

  const strategy = process.estrategia_ia;

  if (strategy && strategy.estrategia_processual && Array.isArray(strategy.estrategia_processual)) {
    strategy.estrategia_processual.forEach((phase) => {
      // Título da Fase Processual
      checkPageOverflow(14);
      currentY += 3;
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.text(`> FASE: ${phase.fase.toUpperCase()}`, marginX, currentY);
      currentY += 5;

      const acoes = phase.acoes || {};

      // Função auxiliar para renderizar listas no PDF
      const printBulletList = (sectionTitle, items, isRisco = false) => {
        if (!items || !Array.isArray(items) || items.length === 0) return;

        checkPageOverflow(10);
        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.setTextColor(isRisco ? 180 : primaryColor[0], isRisco ? 40 : primaryColor[1], isRisco ? 40 : primaryColor[2]);
        doc.text(sectionTitle, marginX + 4, currentY);
        currentY += 4;

        items.forEach((item) => {
          const bulletSymbol = "•  ";
          const itemText = bulletSymbol + item;
          const wrapped = doc.splitTextToSize(itemText, printableWidth - 8);
          const lineHeight = 4.2;
          const heightNeeded = wrapped.length * lineHeight;

          checkPageOverflow(heightNeeded + 1.5);

          wrapped.forEach((line, index) => {
            doc.setFont("times", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            // Alinhamento com indentação na segunda linha do mesmo item
            const indentX = index === 0 ? marginX + 8 : marginX + 11;
            doc.text(line, indentX, currentY);
            currentY += lineHeight;
          });
          currentY += 1; // Pequeno respiro entre bullets
        });
        currentY += 2; // Respiro entre seções da mesma fase
      };

      // Imprime as subdivisões estratégicas da fase
      printBulletList("Teses Jurídicas Sugeridas", acoes.teses_juridicas);
      printBulletList("Documentos Indispensáveis", acoes.documentos_necessarios);
      printBulletList("Fundamentação Legal Recomendada", acoes.fundamentacao_legal);
      printBulletList("Riscos e Alertas de Atenção", acoes.riscos_e_alertas, true);
      printBulletList("Ações e Diligências Imediatas", acoes.proximos_passos);
      
      currentY += 3;
    });
  } else {
    printWrappedParagraphs(
      ["Nenhuma estratégia detalhada gerada via Inteligência Artificial foi encontrada para este processo."],
      9.5,
      "italic",
      textColor,
      4
    );
  }

  // 4. SEÇÃO IV: FECHAMENTO / ASSINATURA
  checkPageOverflow(32);
  currentY += 10;
  
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setLineWidth(0.3);
  doc.line(70, currentY, 140, currentY); // Linha centralizada para assinatura
  currentY += 4.5;

  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("JT - JANAINA TARABAUCA ADVOCACIA", 105, currentY, { align: "center" });
  currentY += 4;

  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Documento emitido em ${dateStr}`, 105, currentY, { align: "center" });

  // Dispara o download automático do PDF
  const safeClientName = client.nome.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Estrategia_JT_Janaina_Tarabauca_Advocacia_${safeClientName}.pdf`);
}

// =========================================================================
// 💰 SEÇÃO: GESTÃO FINANCEIRA & HONORÁRIOS (Dra. Janaina)
// =========================================================================

// Carrega as informações financeiras e a lista de honorários de um cliente
async function loadClientFinancialData() {
  if (!activeClientId) return;

  try {
    // 1. Popular os processos do cliente na caixa de seleção (dropdown)
    finProcessoId.innerHTML = '<option value="">Não vinculado a processo (Geral)</option>';
    const { data: processes } = await supabase
      .from("processos")
      .select("id, titulo, numero_processo")
      .eq("cliente_id", activeClientId);

    if (processes && processes.length > 0) {
      processes.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.innerText = `${p.titulo} (${p.numero_processo || 'Sem número'})`;
        finProcessoId.appendChild(option);
      });
    }

    // 2. Buscar lançamentos financeiros do cliente
    const { data: finLaunches, error: finError } = await supabase
      .from("financeiro")
      .select("*, processos(titulo)")
      .eq("cliente_id", activeClientId)
      .order("data_vencimento", { ascending: true });

    if (finError) throw finError;

    finLancamentosList.innerHTML = "";

    if (finLaunches && finLaunches.length > 0) {
      finLancamentosEmpty.style.display = "none";
      finLancamentosList.style.display = "flex";

      finLaunches.forEach(launch => {
        const item = document.createElement("div");
        item.className = "doc-item-card";
        item.style.cursor = "default";

        const valFormatted = parseFloat(launch.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        const dateFormatted = new Date(launch.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR");
        
        const isPago = launch.status_pagamento === "pago";
        const isAtrasado = launch.status_pagamento === "pendente" && launch.data_vencimento < new Date().toISOString().split("T")[0];

        let badgeStyle = "background: rgba(245, 158, 11, 0.1); color: var(--gold); border: 1px solid var(--gold);";
        let statusText = "Pendente";
        
        if (isPago) {
          badgeStyle = "background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid var(--success-color);";
          statusText = "Pago";
        } else if (isAtrasado) {
          badgeStyle = "background: rgba(239, 68, 68, 0.1); color: var(--error-color); border: 1px solid var(--error-color);";
          statusText = "Atrasado";
        }

        const procTitle = launch.processos?.titulo || "Lançamento Geral";

        item.innerHTML = `
          <div class="doc-item-icon-wrapper" style="background: ${isPago ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.1)'}; color: ${isPago ? 'var(--success-color)' : 'var(--gold)'}; display: flex; align-items: center; justify-content: center; font-weight: bold;">
            <span>$</span>
          </div>
          <div class="doc-item-details" style="margin-left: 12px; flex-grow: 1;">
            <span class="doc-item-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary);">R$ ${valFormatted} <span style="font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px; margin-left: 8px; ${badgeStyle}">${statusText}</span></span>
            <span class="doc-item-meta" style="font-size: 11px; color: var(--text-secondary);">
              Modelo: <strong>${launch.tipo_honorario.toUpperCase()}</strong> | Vencimento: <strong>${dateFormatted}</strong> | Ref: <strong>${procTitle}</strong>
            </span>
          </div>
          <div style="display: flex; gap: 8px; flex-shrink: 0; align-items: center;">
            <button type="button" class="btn-generate-pdf-doc btn-toggle-payment" data-id="${launch.id}" data-status="${launch.status_pagamento}" style="background: rgba(255, 255, 255, 0.04); border-color: var(--panel-border); color: var(--text-primary); padding: 5px 10px; font-size: 10px; cursor: pointer;">
              Marcar como ${isPago ? 'Pendente' : 'Pago'}
            </button>
            <button type="button" class="btn-generate-pdf-doc btn-delete-financial" data-id="${launch.id}" style="background: rgba(239, 68, 68, 0.08); border-color: var(--error-color); color: var(--error-color); padding: 5px 10px; font-size: 10px; cursor: pointer;">
              Excluir
            </button>
          </div>
        `;

        // Manipulador para alternar status do pagamento
        item.querySelector(".btn-toggle-payment").addEventListener("click", async (e) => {
          e.stopPropagation();
          const btn = e.currentTarget;
          const launchId = btn.getAttribute("data-id");
          const currentStatus = btn.getAttribute("data-status");
          const nextStatus = currentStatus === "pago" ? "pendente" : "pago";

          try {
            setLoadingState(btn, true, "Processando...");
            const { error: updateError } = await supabase
              .from("financeiro")
              .update({ status_pagamento: nextStatus })
              .eq("id", launchId);

            if (updateError) throw updateError;
            
            // Recarrega os dados locais e o dashboard principal
            await loadClientFinancialData();
            await loadDashboardData();
          } catch (updateErr) {
            console.error("Erro ao atualizar pagamento:", updateErr.message);
            alert("Erro ao alterar status do pagamento.");
            setLoadingState(btn, false, `Marcar como ${currentStatus === "pago" ? "Pendente" : "Pago"}`);
          }
        });

        // Manipulador para excluir lançamento financeiro
        item.querySelector(".btn-delete-financial").addEventListener("click", async (e) => {
          e.stopPropagation();
          const btn = e.currentTarget;
          if (!confirm("Tem certeza de que deseja excluir este lançamento financeiro permanentemente?")) return;

          const launchId = btn.getAttribute("data-id");

          try {
            setLoadingState(btn, true, "Removendo...");
            const { error: deleteError } = await supabase
              .from("financeiro")
              .delete()
              .eq("id", launchId);

            if (deleteError) throw deleteError;
            
            await loadClientFinancialData();
            await loadDashboardData();
          } catch (deleteErr) {
            console.error("Erro ao excluir lançamento financeiro:", deleteErr.message);
            alert("Erro ao excluir lançamento financeiro.");
            setLoadingState(btn, false, "Excluir");
          }
        });

        finLancamentosList.appendChild(item);
      });
    } else {
      finLancamentosEmpty.style.display = "block";
      finLancamentosList.style.display = "none";
    }
  } catch (err) {
    console.error("Erro ao carregar dados financeiros do cliente:", err.message);
  }
}

// Manipulador do formulário de novos lançamentos financeiros
if (formLancarHonorario) {
  formLancarHonorario.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!activeClientId) {
      alert("Erro: Nenhum cliente selecionado.");
      return;
    }

    const valor = desformatarMoedaBRL(finValorTotal.value);
    const tipo = finTipoHonorario.value;
    const status = finStatusPagamento.value;
    const vencimento = finDataVencimento.value;
    const processoId = finProcessoId.value || null;

    if (isNaN(valor) || valor <= 0) {
      alert("O valor do honorário deve ser um número positivo.");
      return;
    }

    if (!vencimento) {
      alert("Selecione a data de vencimento do honorário.");
      return;
    }

    try {
      setLoadingState(document.getElementById("btn-save-honorario"), true, "Lançando...");

      const { error: insertError } = await supabase
        .from("financeiro")
        .insert({
          cliente_id: activeClientId,
          processo_id: processoId,
          valor_total: valor,
          tipo_honorario: tipo,
          status_pagamento: status,
          data_vencimento: vencimento
        });

      if (insertError) throw insertError;

      // Limpa formulário
      formLancarHonorario.reset();
      
      // Recarrega dados e estatísticas
      loadClientFinancialData();
      loadDashboardData();
      
      alert("Honorário lançado com sucesso!");
    } catch (insertErr) {
      console.error("Erro ao lançar honorário:", insertErr.message);
      alert(`Falha ao lançar honorário: ${insertErr.message}`);
    } finally {
      setLoadingState(document.getElementById("btn-save-honorario"), false, "Lançar Honorário");
    }
  });
}

// =========================================================================
// MÓDULO FINANCEIRO UNIFICADO - MODAL DE LANÇAMENTO
// =========================================================================

// Função para abrir o Modal Financeiro
async function openModalLancamentoFinanceiro() {
  if (!modalLancamentoFinanceiro) return;
  
  // Limpa formulário
  formModalLancamentoFinanceiro.reset();
  
  // Ocultar blocos especiais
  finModalGrupoIndenizacao.style.display = "none";
  finModalGrupoTipoHonorario.style.display = "block";
  finModalGrupoValorPadrao.style.display = "block";
  finModalValor.required = true;
  finModalValorBruto.required = false;
  
  // Resetar Box Matemático
  finModalCotaEscritorio.innerText = "R$ 0,00";
  finModalCotaCliente.innerText = "R$ 0,00";

  // Preencher Select de Clientes
  try {
    finModalClienteId.innerHTML = '<option value="" disabled selected>Selecione o prontuário do cliente...</option>';
    
    const { data: clientsData, error: clientErr } = await supabase
      .from("clientes")
      .select("id, nome")
      .order("nome", { ascending: true });

    if (clientErr) throw clientErr;

    (clientsData || []).forEach(c => {
      const option = document.createElement("option");
      option.value = c.id;
      option.innerText = `👤 ${c.nome}`;
      finModalClienteId.appendChild(option);
    });

    // Se o modal for aberto dentro da ficha de um cliente específico
    if (activeClientId) {
      finModalClienteId.value = activeClientId;
      finModalClienteId.disabled = true; // Trava o cliente
      await handleModalClienteChange(); // Carrega os processos
    } else {
      finModalClienteId.disabled = false; // Permite selecionar
      finModalProcessoId.innerHTML = '<option value="">Geral (Sem vínculo a processo específico)</option>';
    }

    modalLancamentoFinanceiro.style.display = "flex";
  } catch (err) {
    console.error("Erro ao carregar clientes no modal financeiro:", err.message);
    alert("Falha ao abrir central de lançamentos.");
  }
}

// Fechar Modal
function closeModalLancamentoFinanceiro() {
  if (modalLancamentoFinanceiro) {
    modalLancamentoFinanceiro.style.display = "none";
  }
}

// Carregar Processos ao trocar Cliente no Modal
async function handleModalClienteChange() {
  const clienteId = finModalClienteId.value;
  finModalProcessoId.innerHTML = '<option value="">Geral (Sem vínculo a processo específico)</option>';
  
  if (!clienteId) return;

  try {
    const { data: procsData, error: procErr } = await supabase
      .from("processos")
      .select("id, titulo, numero_processo, status")
      .eq("cliente_id", clienteId);

    if (procErr) throw procErr;

    (procsData || []).forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.innerText = `📂 ${p.titulo} (${p.numero_processo || 'N/A'}) [${p.status || 'Ativo'}]`;
      finModalProcessoId.appendChild(option);
    });
  } catch (err) {
    console.error("Erro ao carregar processos no modal financeiro:", err.message);
  }
}

// Recalcular Box Matemático de Retenção
function recalculateModalRetention() {
  const bruto = parseFloat(finModalValorBruto.value) || 0;
  const taxa = parseFloat(finModalTaxaBanca.value) || 20;
  const retencao = bruto * (taxa / 100);
  const repasse = bruto - retencao;

  finModalCotaEscritorio.innerText = retencao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  finModalCotaCliente.innerText = repasse.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Escutadores de Eventos do Modal
if (btnModalLancarTransacao) {
  btnModalLancarTransacao.addEventListener("click", openModalLancamentoFinanceiro);
}
if (btnModalLancarTransacaoClient) {
  btnModalLancarTransacaoClient.addEventListener("click", openModalLancamentoFinanceiro);
}
if (btnCloseModalFinanceiro) {
  btnCloseModalFinanceiro.addEventListener("click", closeModalLancamentoFinanceiro);
}
if (btnCancelarFinanceiro) {
  btnCancelarFinanceiro.addEventListener("click", closeModalLancamentoFinanceiro);
}
if (finModalClienteId) {
  finModalClienteId.addEventListener("change", handleModalClienteChange);
}

// Fechamento de Backdrop Click
if (modalLancamentoFinanceiro) {
  modalLancamentoFinanceiro.addEventListener("click", (e) => {
    if (e.target === modalLancamentoFinanceiro) {
      closeModalLancamentoFinanceiro();
    }
  });
}

// Tratar Categoria Selecionada no Modal
if (finModalCategoria) {
  finModalCategoria.addEventListener("change", () => {
    const val = finModalCategoria.value;
    if (val === "honorario") {
      finModalGrupoIndenizacao.style.display = "none";
      finModalGrupoTipoHonorario.style.display = "block";
      finModalGrupoValorPadrao.style.display = "block";
      finModalValor.required = true;
      finModalValorBruto.required = false;
    } else if (val === "indenizacao") {
      finModalGrupoIndenizacao.style.display = "block";
      finModalGrupoTipoHonorario.style.display = "none";
      finModalGrupoValorPadrao.style.display = "none";
      finModalValor.required = false;
      finModalValorBruto.required = true;
      recalculateModalRetention();
    } else { // Custas
      finModalGrupoIndenizacao.style.display = "none";
      finModalGrupoTipoHonorario.style.display = "none";
      finModalGrupoValorPadrao.style.display = "block";
      finModalValor.required = true;
      finModalValorBruto.required = false;
    }
  });
}

// Alterações nos valores de condenação
if (finModalValorBruto) {
  finModalValorBruto.addEventListener("input", recalculateModalRetention);
}
if (finModalTaxaBanca) {
  finModalTaxaBanca.addEventListener("input", recalculateModalRetention);
}

// Submeter o Lançamento Unificado do Modal
if (formModalLancamentoFinanceiro) {
  formModalLancamentoFinanceiro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const clienteId = finModalClienteId.value;
    const processoId = finModalProcessoId.value || null;
    const categoria = finModalCategoria.value;
    const vencimento = finModalVencimento.value;
    const status = finModalStatus.value;

    if (!clienteId) {
      alert("Por favor, selecione o Prontuário do Cliente.");
      return;
    }
    if (!vencimento) {
      alert("Por favor, selecione a data de vencimento.");
      return;
    }

    let valorFinal = 0;
    let tipoFinal = "fixo";

    if (categoria === "indenizacao") {
      const bruto = parseFloat(finModalValorBruto.value) || 0;
      const taxa = parseFloat(finModalTaxaBanca.value) || 20;
      valorFinal = bruto * (taxa / 100);
      tipoFinal = "êxito";
      
      if (valorFinal <= 0) {
        alert("O valor bruto arbitrado deve ser maior que zero.");
        return;
      }
    } else if (categoria === "honorario") {
      valorFinal = parseFloat(finModalValor.value) || 0;
      tipoFinal = finModalTipoHonorario.value;
      
      if (valorFinal <= 0) {
        alert("O valor cobrado deve ser maior que zero.");
        return;
      }
    } else { // Custas
      valorFinal = parseFloat(finModalValor.value) || 0;
      tipoFinal = "fixo";
      
      if (valorFinal <= 0) {
        alert("O valor das custas deve ser maior que zero.");
        return;
      }
    }

    try {
      setLoadingState(document.getElementById("btn-salvar-financeiro"), true, "Sincronizando...");

      const { error: insertErr } = await supabase
        .from("financeiro")
        .insert({
          cliente_id: clienteId,
          processo_id: processoId,
          valor_total: valorFinal,
          tipo_honorario: tipoFinal.toLowerCase(),
          status_pagamento: status,
          data_vencimento: vencimento
        });

      if (insertErr) throw insertErr;

      // Limpa formulário e fecha modal
      formModalLancamentoFinanceiro.reset();
      closeModalLancamentoFinanceiro();

      // Recarrega todos os dashboards
      if (activeClientId) {
        loadClientFinancialData();
      }
      loadFinanceiroData();
      loadDashboardData();
      
      alert("Lançamento patrimonial integrado com sucesso!");
    } catch (err) {
      console.error("Erro ao sincronizar lançamento financeiro:", err.message);
      alert(`Erro ao sincronizar lançamento: ${err.message}`);
    } finally {
      setLoadingState(document.getElementById("btn-salvar-financeiro"), false, "Confirmar Lançamento");
    }
  });
}


// Manipulador para redirecionar para pendências a partir do banner de alertas
if (btnVerFinanceiroAtrasado) {
  btnVerFinanceiroAtrasado.addEventListener("click", () => {
    switchPrivateView("clientes");
  });
}

// =========================================================================
// ⚡ MÓDULO DE PROCESSOS GLOBAIS & LEITOR DE PROCESSOS COM GEMINI IA
// =========================================================================

let globalProcesses = [];
let parsedAiResult = null;

// Elementos de UI do Módulo Processos
const processosListPanel = document.getElementById("processos-list-panel");
const processosAiPanel = document.getElementById("processos-ai-panel");
const gridListProcessos = document.getElementById("processos-grid-list");
const listEmptyProcessos = document.getElementById("processos-list-empty");

const btnNovoProcessoAiUploader = document.getElementById("btn-novo-processo-ai-uploader");
const btnNovoProcessoGlobal = document.getElementById("btn-novo-processo-global");
const btnProcessosAiVoltar = document.getElementById("btn-processos-ai-voltar");

const processosSearchInput = document.getElementById("processos-search-input");
const processosFilterArea = document.getElementById("processos-filter-area");
const processosFilterStatus = document.getElementById("processos-filter-status");

// Elementos da área do Uploader IA
const dropzone = document.getElementById("processo-dropzone");
const fileInput = document.getElementById("processo-file-input");
const textInput = document.getElementById("processo-text-input");
const selectClienteAi = document.getElementById("processo-ai-select-cliente");
const btnAnalisarIa = document.getElementById("btn-processo-analisar-ia");

const userGeminiKeyInput = document.getElementById("user-gemini-key-input");
const userOpenaiKeyInput = document.getElementById("user-openai-key-input");
const btnSaveUserKeys = document.getElementById("btn-save-user-keys");
const quotaCounter = document.getElementById("processo-ai-quota-counter");
const aiLockCard = document.getElementById("processo-ai-lock-card");

const resultPlaceholder = document.getElementById("processo-ai-result-placeholder");
const loadingIndicator = document.getElementById("processo-ai-loading-indicator");
const loadingStatus = document.getElementById("processo-ai-loading-status");
const resultContent = document.getElementById("processo-ai-result-content");

const btnCopyMinuta = document.getElementById("btn-copy-ai-minuta");
const btnCancelarAi = document.getElementById("btn-processo-ai-cancelar");
const btnConfirmarGravar = document.getElementById("btn-processo-ai-gravar");

// Função controladora de painéis
function showProcessosPanel(panelType) {
  if (panelType === "list") {
    processosListPanel.style.display = "block";
    processosAiPanel.style.display = "none";
    loadGlobalProcessesList();
  } else if (panelType === "ai") {
    processosListPanel.style.display = "none";
    processosAiPanel.style.display = "block";
    resetAiAnalyzerPanel();
    checkLawyerQuotaAndKeys();
  }
}

async function checkLawyerQuotaAndKeys() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: lawyer, error } = await supabase
      .from("advogados")
      .select("consultas_gratuitas_realizadas, limite_gratuito_maximo, user_gemini_key, user_openai_key")
      .eq("id", user.id)
      .single();

    if (error || !lawyer) throw error || new Error("Advogado não localizado.");

    // Populate key inputs
    const geminiInput = document.getElementById("user-gemini-key-input");
    const openaiInput = document.getElementById("user-openai-key-input");
    if (geminiInput) geminiInput.value = lawyer.user_gemini_key || "";
    if (openaiInput) openaiInput.value = lawyer.user_openai_key || "";

    const hasCustomKey = !!(
      (lawyer.user_gemini_key && lawyer.user_gemini_key.trim()) ||
      (lawyer.user_openai_key && lawyer.user_openai_key.trim())
    );

    const realizadas = lawyer.consultas_gratuitas_realizadas || 0;
    const maximo = lawyer.limite_gratuito_maximo || 5;
    const restantes = Math.max(0, maximo - realizadas);
    const pct = Math.min((realizadas / maximo) * 100, 100);

    // Determine color states
    const barColor = hasCustomKey ? "#22c55e" : pct >= 100 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e";
    const badgeBg  = hasCustomKey ? "rgba(34,197,94,0.1)" : pct >= 100 ? "rgba(239,68,68,0.1)" : pct >= 60 ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)";
    const badgeColor = hasCustomKey ? "#22c55e" : pct >= 100 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e";
    const badgeText = hasCustomKey
      ? "✦ Chave API Ativa — Ilimitado"
      : pct >= 100
      ? "🔒 Cota Esgotada"
      : `Você possui ${restantes} de ${maximo} análises gratuitas restantes`;

    if (quotaCounter) {
      quotaCounter.innerHTML = `
        <div style="background:var(--panel-bg);border:1px solid var(--panel-border);border-radius:12px;padding:10px 12px;space-y:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:9.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">Cota de Análises</span>
            <span style="font-size:9.5px;font-weight:700;color:${badgeColor};background:${badgeBg};border:1px solid ${badgeColor}33;padding:2px 8px;border-radius:999px;">${hasCustomKey ? "∞ Ilimitado" : `${realizadas} / ${maximo}`}</span>
          </div>
          <div style="width:100%;height:5px;background:#1e293b;border-radius:999px;overflow:hidden;margin-bottom:7px;">
            <div style="height:100%;width:${pct}%;background:${barColor};border-radius:999px;transition:width .4s ease;"></div>
          </div>
          <p style="font-size:10px;color:${badgeColor};font-weight:600;margin:0;">${badgeText}</p>
        </div>
      `;
    }

    if (!hasCustomKey && restantes === 0) {
      if (btnAnalisarIa) btnAnalisarIa.style.display = "none";
      if (aiLockCard) aiLockCard.style.display = "block";
    } else {
      if (btnAnalisarIa) btnAnalisarIa.style.display = "flex";
      if (aiLockCard) aiLockCard.style.display = "none";
    }
  } catch (err) {
    console.error("Erro ao verificar cota e chaves do advogado:", err.message);
  }
}

if (btnSaveUserKeys) {
  btnSaveUserKeys.addEventListener("click", async () => {
    try {
      setLoadingState(btnSaveUserKeys, true, "Salvando...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const geminiKey = userGeminiKeyInput.value.trim() || null;
      const openaiKey = userOpenaiKeyInput.value.trim() || null;

      const { error } = await supabase
        .from("advogados")
        .update({
          user_gemini_key: geminiKey,
          user_openai_key: openaiKey
        })
        .eq("id", user.id);

      if (error) throw error;

      alert("Credenciais salvas com sucesso! Uso de inteligência artificial liberado.");
      await checkLawyerQuotaAndKeys();
    } catch (err) {
      console.error("Erro ao salvar chaves de API:", err.message);
      alert("Falha ao salvar chaves de API: " + err.message);
    } finally {
      setLoadingState(btnSaveUserKeys, false, "Salvar e Ativar Chaves");
    }
  });
}

// Navegação do painel
if (btnNovoProcessoAiUploader) {
  btnNovoProcessoAiUploader.addEventListener("click", () => showProcessosPanel("ai"));
}
if (btnNovoProcessoGlobal) {
  btnNovoProcessoGlobal.addEventListener("click", () => showProcessosPanel("ai"));
}
if (btnProcessosAiVoltar) {
  btnProcessosAiVoltar.addEventListener("click", () => showProcessosPanel("list"));
}

// Eventos de Busca e Filtros
if (processosSearchInput) {
  processosSearchInput.addEventListener("input", handleProcessFilterSearch);
}
if (processosFilterArea) {
  processosFilterArea.addEventListener("change", handleProcessFilterSearch);
}
if (processosFilterStatus) {
  processosFilterStatus.addEventListener("change", handleProcessFilterSearch);
}

// Carregamento de Processos no Supabase
async function loadGlobalProcessesList() {
  listEmptyProcessos.style.display = "block";
  listEmptyProcessos.innerText = "Carregando processos...";
  gridListProcessos.style.display = "none";
  gridListProcessos.innerHTML = "";

  try {
    const { data: processes, error } = await supabase
      .from("processos")
      .select("*, clientes(nome)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (processes && processes.length > 0) {
      listEmptyProcessos.style.display = "none";
      gridListProcessos.style.display = "grid";
      globalProcesses = processes;
      renderProcessesGrid(processes);
    } else {
      listEmptyProcessos.style.display = "block";
      listEmptyProcessos.innerText = "Nenhum processo cadastrado ainda.";
      gridListProcessos.style.display = "none";
      globalProcesses = [];
    }
  } catch (err) {
    console.error("Erro ao carregar lista global de processos:", err.message);
    listEmptyProcessos.innerText = "Erro ao sincronizar processos do servidor.";
  }
}

// Renderização dos cards de processos
function renderProcessesGrid(processes) {
  gridListProcessos.innerHTML = "";

  processes.forEach(p => {
    const clientName = p.clientes?.nome || "Cliente não vinculado";
    const card = document.createElement("div");
    card.className = "cliente-card";
    card.style.cursor = "default";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justify = "space-between";

    // Extrair estágio e prioridade estimadas
    let estagio = "Fase Inicial";
    let prio = "Média";
    let prioColor = "rgba(197, 168, 92, 0.15)";
    let prioTextColor = "var(--gold)";

    if (p.observacoes_internas) {
      if (p.observacoes_internas.includes("Instrução")) estagio = "Instrução";
      else if (p.observacoes_internas.includes("Sentença")) estagio = "Sentença";
      else if (p.observacoes_internas.includes("Recurso")) estagio = "Recurso";
      else if (p.observacoes_internas.includes("Execução")) estagio = "Execução";

      if (p.observacoes_internas.includes("Urgente")) {
        prio = "Urgente";
        prioColor = "rgba(239, 68, 68, 0.2)";
        prioTextColor = "var(--error-color)";
      } else if (p.observacoes_internas.includes("Alta")) {
        prio = "Alta";
        prioColor = "rgba(239, 68, 68, 0.15)";
        prioTextColor = "var(--error-color)";
      } else if (p.observacoes_internas.includes("Baixa")) {
        prio = "Baixa";
        prioColor = "rgba(16, 185, 129, 0.15)";
        prioTextColor = "var(--success-color)";
      }
    }

    const valorFormatado = p.valor_causa
      ? parseFloat(p.valor_causa).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Não informado";

    card.innerHTML = `
      <div class="cliente-card-header" style="flex-direction: column; align-items: flex-start; gap: 8px;">
        <button type="button" class="btn-load-proc-generator" data-id="${p.id}" style="background: transparent; border: none; color: #3b82f6; text-decoration: underline; font-size: 10px; margin: 0; padding: 0; cursor: pointer; text-align: left; font-family: monospace;">CNJ: ${p.numero_processo || "Não informado"}</button>
        <h3 class="cliente-card-title" title="${p.titulo}" style="font-size: 15px; margin: 4px 0; font-family:'Outfit'; font-weight:600; color:var(--text-primary);">${p.titulo}</h3>
        <span style="font-size: 12px; color: var(--gold); font-weight: 500;">👤 Cliente: <strong>${clientName}</strong></span>
      </div>
      <div class="cliente-card-body" style="padding-top: 8px; border-top: 1px solid var(--panel-border); margin-top: 8px; flex-grow: 1;">
        <div class="cliente-card-item" style="margin-bottom: 6px;">
          <span>Área Jurídica:</span>
          <strong>${p.area_direito || "Não informada"}</strong>
        </div>
        <div class="cliente-card-item" style="margin-bottom: 6px;">
          <span>Estágio Atual:</span>
          <strong style="color: var(--text-primary); font-weight: 600;">${estagio}</strong>
        </div>
        <div class="cliente-card-item" style="margin-bottom: 6px;">
          <span>Valor da Causa:</span>
          <strong>${valorFormatado}</strong>
        </div>
        <div class="cliente-card-item" style="margin-bottom: 6px;">
          <span>Tribunal/Vara:</span>
          <strong>${p.tribunal || "Não informado"} • ${p.vara || "Não cadastrada"}</strong>
        </div>
      </div>
      <div class="cliente-card-meta" style="justify-content: space-between; border-top: 1px solid var(--panel-border); margin-top: 12px; padding-top: 8px; display: flex; align-items: center; margin-bottom: 8px;">
        <span class="badge-tipo" style="background: ${prioColor}; color: ${prioTextColor}; border-color: transparent; margin: 0;">Prioridade: ${prio}</span>
        <span class="badge-tipo" style="background: rgba(255,255,255,0.03); margin: 0; color:var(--text-secondary);">${p.status}</span>
      </div>
      <div style="border-top: 1px dashed var(--panel-border); padding-top: 8px; display: flex; justify-content: flex-end;">
        <button type="button" class="btn-edit-process" data-id="${p.id}" style="background: rgba(197, 168, 92, 0.08); border: 1px solid rgba(197, 168, 92, 0.3); color: var(--gold); padding: 6px 12px; font-size: 11px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600;">
          ✏️ Editar Processo
        </button>
      </div>
    `;

    gridListProcessos.appendChild(card);

    const btnEdit = card.querySelector(".btn-edit-process");
    if (btnEdit) {
      btnEdit.addEventListener("click", (e) => {
        e.preventDefault();
        openEditProcessModal(p);
      });
    }

    const btnLoadGenerator = card.querySelector(".btn-load-proc-generator");
    if (btnLoadGenerator) {
      btnLoadGenerator.addEventListener("click", (e) => {
        e.preventDefault();
        openEditProcessModal(p);
        setTimeout(() => {
          const btnJusIaModal = document.getElementById("btn-gerar-peca-jusia");
          if (btnJusIaModal) btnJusIaModal.click();
        }, 150);
      });
    }
  });
}

// Filtro e Busca em Tempo Real
function handleProcessFilterSearch() {
  const searchQ = processosSearchInput.value.toLowerCase().trim();
  const filterArea = processosFilterArea.value;
  const filterStatus = processosFilterStatus.value;

  const filtered = globalProcesses.filter(p => {
    const matchSearch = !searchQ ||
      (p.titulo && p.titulo.toLowerCase().includes(searchQ)) ||
      (p.numero_processo && p.numero_processo.toLowerCase().includes(searchQ)) ||
      (p.clientes?.nome && p.clientes.nome.toLowerCase().includes(searchQ));

    const matchArea = !filterArea || p.area_direito === filterArea;
    const matchStatus = !filterStatus || p.status === filterStatus;

    return matchSearch && matchArea && matchStatus;
  });

  if (filtered.length > 0) {
    listEmptyProcessos.style.display = "none";
    gridListProcessos.style.display = "grid";
    renderProcessesGrid(filtered);
  } else {
    listEmptyProcessos.style.display = "block";
    listEmptyProcessos.innerText = "Nenhum processo atende aos critérios de pesquisa.";
    gridListProcessos.style.display = "none";
  }
}

// Lógica de Leitura e Arraste de Arquivos
// Configurar PDF.js Worker
const pdfjs = window.pdfjsLib || (typeof pdfjsLib !== "undefined" ? pdfjsLib : null);
if (pdfjs) {
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
}

async function extractTextFromPdf(file) {
  const pdfjs = window.pdfjsLib || (typeof pdfjsLib !== "undefined" ? pdfjsLib : null);
  if (!pdfjs) {
    throw new Error("Biblioteca de leitura de PDF não disponível.");
  }
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const maxPages = pdf.numPages;
  let fullText = "";

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText.trim();
}

// Lógica de Leitura e Arraste de Arquivos
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleSelectedFile(file);
  });
}

if (dropzone) {
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--gold)";
    dropzone.style.background = "rgba(197, 168, 92, 0.05)";
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--gold)";
    dropzone.style.background = "rgba(197, 168, 92, 0.02)";
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--gold)";
    dropzone.style.background = "rgba(197, 168, 92, 0.02)";
    const file = e.dataTransfer.files[0];
    if (file) handleSelectedFile(file);
  });
}

async function handleSelectedFile(file) {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith(".txt")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      textInput.value = e.target.result;
      document.getElementById("dropzone-text-main").innerText = `✓ Arquivo carregado: ${file.name}`;
      document.getElementById("dropzone-text-sub").innerText = `${(file.size / 1024).toFixed(1)} KB - Texto pronto para análise`;
    };
    reader.readAsText(file);
  } else if (fileName.endsWith(".pdf")) {
    try {
      document.getElementById("dropzone-text-main").innerText = `Lendo PDF: ${file.name}...`;
      document.getElementById("dropzone-text-sub").innerText = `Extraindo camada de texto digital...`;
      
      const text = await extractTextFromPdf(file);
      if (!text) {
        throw new Error("EMPTY_TEXT");
      }
      
      textInput.value = text;
      document.getElementById("dropzone-text-main").innerText = `✓ Arquivo carregado: ${file.name}`;
      document.getElementById("dropzone-text-sub").innerText = `${(file.size / 1024 / 1024).toFixed(2)} MB - Texto pronto para análise`;
    } catch (err) {
      console.error("Erro ao extrair PDF:", err);
      
      // Alerta corporativo elegante para a advogada
      alert("Não foi possível extrair o texto digital deste documento (PDF protegido ou digitalizado como imagem). Por favor, anexe um arquivo com camada de texto ou utilize o preenchimento manual.");
      
      document.getElementById("dropzone-text-main").innerText = "Falha ao ler PDF";
      document.getElementById("dropzone-text-sub").innerText = "PDF protegido ou sem camada de texto (imagem).";
      textInput.value = "";
    }
  } else {
    alert("Por favor, envie apenas arquivos de texto (.txt) ou documentos PDF (.pdf).");
  }
}

// Popular dropdown de Clientes no painel IA
async function populateAiClientsSelect() {
  selectClienteAi.innerHTML = '<option value="" disabled selected>Selecione o cliente...</option>';
  try {
    const { data: clients, error } = await supabase
      .from("clientes")
      .select("id, nome")
      .order("nome", { ascending: true });

    if (error) throw error;

    if (clients && clients.length > 0) {
      clients.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.innerText = c.nome;
        selectClienteAi.appendChild(opt);
      });
    } else {
      selectClienteAi.innerHTML = '<option value="" disabled>Nenhum cliente cadastrado ainda.</option>';
    }
  } catch (err) {
    console.error("Erro ao preencher clientes no select de IA:", err.message);
  }
}

// Reset do Workspace de IA
function resetAiAnalyzerPanel() {
  resultPlaceholder.style.display = "block";
  loadingIndicator.style.display = "none";
  resultContent.style.display = "none";
  textInput.value = "";
  document.getElementById("processo-ai-input-numero").value = "";
  document.getElementById("processo-ai-input-valor").value = "";
  document.getElementById("processo-ai-input-tribunal").value = "";
  document.getElementById("processo-ai-input-vara").value = "";
  document.getElementById("dropzone-text-main").innerText = "Arraste e solte os autos do processo (.txt)";
  document.getElementById("dropzone-text-sub").innerText = "Ou clique aqui para selecionar do computador";
  parsedAiResult = null;
  populateAiClientsSelect();
}

// Chamada à API IA do Gemini
if (btnAnalisarIa) {
  btnAnalisarIa.addEventListener("click", handleAnalisarProcessoIa);
}

// Ouvir mudança no motor selecionado para comportamento reativo na interface
const selectMotor = document.getElementById("processo-ai-select-motor");
if (selectMotor && btnAnalisarIa) {
  selectMotor.addEventListener("change", () => {
    const val = selectMotor.value;
    if (val === "gemini") {
      btnAnalisarIa.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-code"><path d="M16 16a6 6 0 1 0-3-3"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.5-1.5"/></svg>
        <span>Analisar com Google Gemini</span>
      `;
    } else if (val === "chatgpt") {
      btnAnalisarIa.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cpu"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 15h3"/><path d="M1 9h3"/><path d="M1 15h3"/></svg>
        <span>Analisar com OpenAI ChatGPT</span>
      `;
    } else if (val === "jusia") {
      btnAnalisarIa.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scale"><path d="m16 16 3-8 3 8c-.87.65-2.24 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-2.24 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>
        <span>Analisar com Jus IA</span>
      `;
    }
  });
}

function parseStoredAnalysis(obsText) {
  if (!obsText || !obsText.includes("RESUMO EXECUTIVO IA:")) return null;
  
  try {
    const resumoMarker = "RESUMO EXECUTIVO IA:\n";
    const teseMarker = "\n\nTESE RECOMENDADA:\n";
    const estagioMarker = "\n\nESTÁGIO ESTIMADO: ";
    const prioridadeMarker = "\nPRIORIDADE IA: ";
    const minutaMarker = "\n\nMINUTA INICIAL GERADA EM ANEXO: \n";
    
    let resumo = "";
    let tese = "";
    let estagio = "Fase Inicial";
    let prioridade = "Média";
    let minuta = "";
    
    const idxResumo = obsText.indexOf(resumoMarker);
    const idxTese = obsText.indexOf(teseMarker);
    const idxEstagio = obsText.indexOf(estagioMarker);
    const idxPrioridade = obsText.indexOf(prioridadeMarker);
    const idxMinuta = obsText.indexOf(minutaMarker);
    
    if (idxResumo !== -1 && idxTese !== -1) {
      resumo = obsText.substring(idxResumo + resumoMarker.length, idxTese).trim();
    }
    
    if (idxTese !== -1 && idxEstagio !== -1) {
      tese = obsText.substring(idxTese + teseMarker.length, idxEstagio).trim();
    }
    
    if (idxEstagio !== -1 && idxPrioridade !== -1) {
      estagio = obsText.substring(idxEstagio + estagioMarker.length, idxPrioridade).trim();
    }
    
    if (idxPrioridade !== -1 && idxMinuta !== -1) {
      prioridade = obsText.substring(idxPrioridade + prioridadeMarker.length, idxMinuta).trim();
    }
    
    if (idxMinuta !== -1) {
      minuta = obsText.substring(idxMinuta + minutaMarker.length).trim();
    }
    
    return {
      resumo_executivo: resumo,
      tese_sugerida: tese,
      minuta_inicial_rascunho: minuta,
      classificacao: {
        estagio: estagio,
        prioridade: prioridade
      }
    };
  } catch (e) {
    console.error("Erro ao analisar observações internas salvas:", e);
    return null;
  }
}

async function handleAnalisarProcessoIa() {
  const textContent = textInput.value.trim();
  const clienteId = selectClienteAi.value;

  if (!textContent) {
    alert("Por favor, faça upload de um arquivo .txt ou .pdf, ou cole o teor do processo no campo de texto.");
    return;
  }
  if (!clienteId) {
    alert("Por favor, selecione um cliente para vincular esta análise processual.");
    return;
  }

  // Captura inteligente do Número de Processo (CNJ)
  const inputNumero = document.getElementById("processo-ai-input-numero");
  let numeroProcesso = inputNumero ? inputNumero.value.trim() : "";
  
  if (!numeroProcesso) {
    // Tenta extrair do texto por regex (Padrão CNJ: 0000000-00.0000.0.00.0000)
    const cnjRegex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
    const match = textContent.match(cnjRegex);
    if (match) {
      numeroProcesso = match[0];
      if (inputNumero) inputNumero.value = numeroProcesso;
    }
  }

  if (numeroProcesso) {
    try {
      // 1. Procurar se já existe um processo com este número e com análise nas observações
      const { data: existingProcess, error: selectErr } = await supabase
        .from("processos")
        .select("*")
        .eq("numero_processo", numeroProcesso)
        .maybeSingle();

      if (!selectErr && existingProcess && existingProcess.observacoes_internas && existingProcess.observacoes_internas.includes("RESUMO EXECUTIVO IA:")) {
        const cachedResult = parseStoredAnalysis(existingProcess.observacoes_internas);
        if (cachedResult) {
          // Preenche os dados da UI diretamente do cache!
          parsedAiResult = cachedResult;

          // Renderizar resultados da análise
          document.getElementById("badge-ai-estagio").innerText = cachedResult.classificacao.estagio;
          document.getElementById("badge-ai-prioridade").innerText = cachedResult.classificacao.prioridade;

          const prioBadge = document.getElementById("badge-ai-prioridade");
          if (cachedResult.classificacao.prioridade === "Urgente" || cachedResult.classificacao.prioridade === "Alta") {
            prioBadge.style.background = "rgba(239, 68, 68, 0.15)";
            prioBadge.style.color = "var(--error-color)";
          } else if (cachedResult.classificacao.prioridade === "Baixa") {
            prioBadge.style.background = "rgba(16, 185, 129, 0.15)";
            prioBadge.style.color = "var(--success-color)";
          } else {
            prioBadge.style.background = "rgba(197, 168, 92, 0.15)";
            prioBadge.style.color = "var(--gold)";
          }

          document.getElementById("ai-result-resumo-text").innerText = cachedResult.resumo_executivo;
          document.getElementById("ai-result-tese-text").innerText = cachedResult.tese_sugerida;
          document.getElementById("ai-result-minuta-text").value = cachedResult.minuta_inicial_rascunho;

          // Popular inputs se cadastrados
          if (existingProcess.valor_causa) {
            document.getElementById("processo-ai-input-valor").value = existingProcess.valor_causa;
          }
          if (existingProcess.tribunal) {
            document.getElementById("processo-ai-input-tribunal").value = existingProcess.tribunal;
          }
          if (existingProcess.vara) {
            document.getElementById("processo-ai-input-vara").value = existingProcess.vara;
          }

          // Ativar aba resumo por padrão
          document.querySelectorAll("#processo-ai-result-content .ia-strategy-tab-btn").forEach(b => {
            if (b.getAttribute("data-result-tab") === "resumo") b.classList.add("active");
            else b.classList.remove("active");
          });
          document.getElementById("ai-result-resumo-pane").style.display = "block";
          document.getElementById("ai-result-tese-pane").style.display = "none";
          document.getElementById("ai-result-minuta-pane").style.display = "none";

          resultPlaceholder.style.display = "none";
          loadingIndicator.style.display = "none";
          resultContent.style.display = "block";

          alert("⚡ Análise carregada instantaneamente do cache histórico do Supabase (Economia de tokens e tempo)!");
          return; // Interrompe para evitar chamar a IA redundante
        }
      }
    } catch (cacheErr) {
      console.warn("Erro ao ler dados do histórico do Supabase (cache de IA):", cacheErr);
    }
  }

  resultPlaceholder.style.display = "none";
  resultContent.style.display = "none";
  loadingIndicator.style.display = "block";

  const motor = selectMotor ? selectMotor.value : "gemini";
  let motorNome = "Gemini";
  let route = "/api/analisar-processo";
  if (motor === "chatgpt") {
    route = "/api/analisar-chatgpt";
    motorNome = "ChatGPT";
  } else if (motor === "jusia") {
    route = "/api/analisar-jusia";
    motorNome = "Jus IA";
  }

  const loadingMessages = [
    "Lendo os autos do processo...",
    `Consultando jurisprudência e fundamentos legais com ${motorNome}...`,
    "Estruturando teses jurídicas robustas...",
    `Estruturando o Parecer Técnico de Admissibilidade (${motorNome}) com rigor técnico...`,
    "Quase pronto! Organizando a análise jurídica analítica..."
  ];
  let msgIdx = 0;
  loadingStatus.innerText = loadingMessages[0];
  const msgTimer = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    loadingStatus.innerText = loadingMessages[msgIdx];
  }, 2500);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Advogado não autenticado.");

    const response = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textoDocumento: textContent, userId: user.id })
    });

    clearInterval(msgTimer);

    if (!response.ok) {
      const err = await response.json();
      if (err.error === "LIMITE_EXCEDIDO") {
        alert("O seu limite de consultas gratuitas de processamento cortesia foi atingido. Para continuar, por favor ative a sua chave pessoal de API.");
        await checkLawyerQuotaAndKeys(); // Atualiza cotas e exibe a trava
        loadingIndicator.style.display = "none";
        resultPlaceholder.style.display = "block";
        return;
      }
      throw new Error(err.error || "Erro desconhecido na análise.");
    }

    const result = await response.json();
    parsedAiResult = result;

    // Renderizar resultados da análise
    document.getElementById("badge-ai-estagio").innerText = result.classificacao.estagio;
    document.getElementById("badge-ai-prioridade").innerText = result.classificacao.prioridade;

    const prioBadge = document.getElementById("badge-ai-prioridade");
    if (result.classificacao.prioridade === "Urgente" || result.classificacao.prioridade === "Alta") {
      prioBadge.style.background = "rgba(239, 68, 68, 0.15)";
      prioBadge.style.color = "var(--error-color)";
    } else if (result.classificacao.prioridade === "Baixa") {
      prioBadge.style.background = "rgba(16, 185, 129, 0.15)";
      prioBadge.style.color = "var(--success-color)";
    } else {
      prioBadge.style.background = "rgba(197, 168, 92, 0.15)";
      prioBadge.style.color = "var(--gold)";
    }

    document.getElementById("ai-result-resumo-text").innerText = result.resumo_executivo;
    document.getElementById("ai-result-tese-text").innerText = result.tese_sugerida;
    document.getElementById("ai-result-minuta-text").value = result.minuta_inicial_rascunho;

    // Ativar aba resumo por padrão
    document.querySelectorAll("#processo-ai-result-content .ia-strategy-tab-btn").forEach(b => {
      if (b.getAttribute("data-result-tab") === "resumo") b.classList.add("active");
      else b.classList.remove("active");
    });
    document.getElementById("ai-result-resumo-pane").style.display = "block";
    document.getElementById("ai-result-tese-pane").style.display = "none";
    document.getElementById("ai-result-minuta-pane").style.display = "none";

    loadingIndicator.style.display = "none";
    resultContent.style.display = "block";
  } catch (err) {
    clearInterval(msgTimer);
    console.error("Erro na chamada de análise da IA:", err.message);
    alert(`Falha na análise analítica da IA: ${err.message}`);
    loadingIndicator.style.display = "none";
    resultPlaceholder.style.display = "block";
  }
}

// Abas de visualização de resultados de IA
document.querySelectorAll("#processo-ai-result-content .ia-strategy-tab-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll("#processo-ai-result-content .ia-strategy-tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.getAttribute("data-result-tab");
    document.getElementById("ai-result-resumo-pane").style.display = target === "resumo" ? "block" : "none";
    document.getElementById("ai-result-tese-pane").style.display = target === "tese" ? "block" : "none";
    document.getElementById("ai-result-minuta-pane").style.display = target === "minuta" ? "block" : "none";
  });
});

// Ação de copiar minuta
if (btnCopyMinuta) {
  btnCopyMinuta.addEventListener("click", () => {
    const textarea = document.getElementById("ai-result-minuta-text");
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    btnCopyMinuta.innerText = "✓ Copiado!";
    setTimeout(() => {
      btnCopyMinuta.innerText = "Copiar Parecer Técnico (IA)";
    }, 2000);
  });
}

// Cancelar/limpar IA
if (btnCancelarAi) {
  btnCancelarAi.addEventListener("click", () => resetAiAnalyzerPanel());
}

// Salvar processo IA no banco de dados
if (btnConfirmarGravar) {
  btnConfirmarGravar.addEventListener("click", handleConfirmarGravarProcessoIa);
}

async function handleConfirmarGravarProcessoIa() {
  if (!parsedAiResult) return;

  const clienteId = selectClienteAi.value;
  const numero = document.getElementById("processo-ai-input-numero").value.trim() || null;
  const valor = document.getElementById("processo-ai-input-valor").value.trim() || null;
  const tribunal = document.getElementById("processo-ai-input-tribunal").value.trim() || null;
  const vara = document.getElementById("processo-ai-input-vara").value.trim() || null;

  if (!clienteId) {
    alert("Por favor, selecione um cliente.");
    return;
  }

  try {
    setLoadingState(btnConfirmarGravar, true, "Processando...");

    // Estimar título e área com base no resumo/tese
    let area = "Civil";
    const resumoLower = parsedAiResult.resumo_executivo.toLowerCase();
    const teseLower = parsedAiResult.tese_sugerida.toLowerCase();
    
    if (resumoLower.includes("trabalho") || teseLower.includes("clt") || teseLower.includes("trabalhista")) {
      area = "Trabalhista";
    } else if (resumoLower.includes("inss") || teseLower.includes("aposentadoria") || teseLower.includes("previdenciário")) {
      area = "Previdenciário";
    } else if (resumoLower.includes("divórcio") || teseLower.includes("pensão") || teseLower.includes("guarda") || teseLower.includes("família")) {
      area = "Família";
    } else if (resumoLower.includes("relação de consumo") || teseLower.includes("cdc") || teseLower.includes("consumidor")) {
      area = "Consumidor";
    } else if (resumoLower.includes("societário") || teseLower.includes("empresa") || teseLower.includes("empresarial")) {
      area = "Empresarial";
    }

    const titulo = `Ação IA - Estágio: ${parsedAiResult.classificacao.estagio}`;

    const { error } = await supabase
      .from("processos")
      .insert({
        cliente_id: clienteId,
        numero_processo: numero,
        titulo: titulo,
        area_direito: area,
        status: "Ativo",
        tribunal: tribunal,
        vara: vara,
        valor_causa: valor ? parseFloat(valor) : null,
        observacoes_internas: `RESUMO EXECUTIVO IA:\n${parsedAiResult.resumo_executivo}\n\nTESE RECOMENDADA:\n${parsedAiResult.tese_sugerida}\n\nESTÁGIO ESTIMADO: ${parsedAiResult.classificacao.estagio}\nPRIORIDADE IA: ${parsedAiResult.classificacao.prioridade}\n\nMINUTA INICIAL GERADA EM ANEXO: \n${parsedAiResult.minuta_inicial_rascunho}`,
        historico_andamentos: [
          {
            data: new Date().toLocaleDateString("pt-BR"),
            titulo: "Análise Analítica IA Concluída",
            descricao: "Fatos, tese recomendada e minuta formal de petição gerados com Gemini-2.5-Flash."
          }
        ]
      });

    if (error) throw error;

    alert("Processo judicial com inteligência jurídica estruturada gravado com sucesso na base do Supabase!");
    showProcessosPanel("list");
  } catch (err) {
    console.error("Erro ao persistir processo IA na base de dados:", err.message);
    alert(`Erro ao gravar processo IA: ${err.message}`);
  } finally {
    setLoadingState(btnConfirmarGravar, false, "💾 Confirmar e Gravar Processo");
  }
}

// Variable to store the process currently being edited
let currentEditingProcessId = null;
let currentEditingProcess = null;

// Modal elements
const modalEditarProcesso = document.getElementById("modal-editar-processo");
const formEditarProcesso = document.getElementById("form-modal-editar-processo");
const btnCloseModalEditar = document.getElementById("btn-close-modal-editar-processo");
const btnCancelarEditar = document.getElementById("btn-cancelar-editar-processo");
const btnSalvarEditar = document.getElementById("btn-salvar-editar-processo");

// Form inputs (using the global declarations from line 317)
const editProcFatos = document.getElementById("edit-proc-fatos");

// Function to open the edit modal
function openEditProcessModal(process) {
  currentEditingProcessId = process.id;
  currentEditingProcess = process;

  if (editProcTituloPremium) editProcTituloPremium.value = process.titulo || "";
  if (editProcNumeroPremium) editProcNumeroPremium.value = process.numero_processo || "";
  if (editProcValorPremium) editProcValorPremium.value = process.valor_causa || "";
  if (editProcAreaPremium) editProcAreaPremium.value = process.area_direito || "Civil";
  if (editProcStatusPremium) editProcStatusPremium.value = process.status || "Ativo";
  if (editProcTribunalPremium) editProcTribunalPremium.value = process.tribunal || "";
  if (editProcVaraPremium) editProcVaraPremium.value = process.vara || "";
  
  let cleanFatos = process.observacoes_internas || "";
  if (editProcFatos) editProcFatos.value = cleanFatos;

  if (modalEditarProcesso) modalEditarProcesso.style.display = "flex";
}

// Function to close the edit modal
function closeEditProcessModal() {
  currentEditingProcessId = null;
  currentEditingProcess = null;
  if (modalEditarProcesso) modalEditarProcesso.style.display = "none";
}

// Event Listeners for closing modal
if (btnCloseModalEditar) btnCloseModalEditar.addEventListener("click", closeEditProcessModal);
if (btnCancelarEditar) btnCancelarEditar.addEventListener("click", closeEditProcessModal);

// Submit form edit handler
if (formEditarProcesso) {
  formEditarProcesso.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentEditingProcessId) return;

    try {
      setLoadingState(btnSalvarEditar, true, "Salvando...");

      const titulo = editProcTituloPremium.value.trim();
      const numero = editProcNumeroPremium.value.trim() || null;
      const valor = editProcValorPremium.value ? parseFloat(editProcValorPremium.value) : null;
      const area = editProcAreaPremium.value;
      const status = editProcStatusPremium.value;
      const tribunal = editProcTribunalPremium.value.trim() || null;
      const vara = editProcVaraPremium.value.trim() || null;
      const fatos = editProcFatos.value.trim();

      const { error } = await supabase
        .from("processos")
        .update({
          titulo: titulo,
          numero_processo: numero,
          valor_causa: valor,
          area_direito: area,
          status: status,
          tribunal: tribunal,
          vara: vara,
          observacoes_internas: fatos
        })
        .eq("id", currentEditingProcessId);

      if (error) throw error;

      alert("Processo judicial atualizado com sucesso no Supabase!");
      closeEditProcessModal();
      await loadGlobalProcessesList();
    } catch (err) {
      console.error("Erro ao salvar edições do processo:", err.message);
      alert("Falha ao atualizar processo: " + err.message);
    } finally {
      setLoadingState(btnSalvarEditar, false, "Confirmar Alterações");
    }
  });
}

// Upload de Documentos no Modal de Edição de Processo
const editProcUpload = document.getElementById("edit-proc-upload");
if (editProcUpload) {
  editProcUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    try {
      if (fileName.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          const currentText = editProcFatos.value || "";
          editProcFatos.value = currentText ? `${currentText}\n\n[CONTEÚDO DO ARQUIVO ANEXADO - ${file.name}]:\n${text}` : text;
          alert("✅ Arquivo de texto importado com sucesso!");
        };
        reader.readAsText(file);
      } else if (fileName.endsWith(".pdf")) {
        const pdfjs = window.pdfjsLib || null;
        if (!pdfjs) {
          alert("⚠️ Biblioteca de leitura de PDF não disponível.");
          return;
        }
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const maxPages = pdf.numPages;
        let fullText = "";

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          fullText += pageText + "\n";
        }

        const text = fullText.trim();
        const currentText = editProcFatos.value || "";
        editProcFatos.value = currentText ? `${currentText}\n\n[CONTEÚDO DO ARQUIVO ANEXADO - ${file.name}]:\n${text}` : text;
        alert("✅ Arquivo PDF importado e processado com sucesso!");
      } else {
        alert("⚠️ Por favor, envie apenas arquivos em formato PDF ou TXT.");
      }
    } catch (err) {
      console.error("Erro ao processar arquivo no modal de edição:", err);
      alert("Erro ao processar arquivo: " + err.message);
    }
  });
}

// Gatilho Inteligente Jus IA combinando Fatos do Cliente + Fatos do Processo
const btnGerarPecaJusia = document.getElementById("btn-gerar-peca-jusia");
if (btnGerarPecaJusia) {
  btnGerarPecaJusia.addEventListener("click", async () => {
    if (!currentEditingProcess) {
      alert("Selecione um processo sob edição primeiro.");
      return;
    }

    try {
      setLoadingState(btnGerarPecaJusia, true, "Processando fatos...");
      
      const clienteId = currentEditingProcess.cliente_id;
      const fatosProcesso = editProcFatos ? editProcFatos.value.trim() : (currentEditingProcess.observacoes_internas || "");
      const tribunal = editProcTribunal ? editProcTribunal.value.trim() : (currentEditingProcess.tribunal || "");
      const vara = editProcVara ? editProcVara.value.trim() : (currentEditingProcess.vara || "");
      const area = editProcArea ? editProcArea.value : (currentEditingProcess.area_direito || "");

      // 1. Buscar observações (fatos narrados) do cliente no Supabase
      const { data: cliente, error } = await supabase
        .from("clientes")
        .select("nome, observacoes")
        .eq("id", clienteId)
        .single();

      if (error) throw error;

      const clienteObservacoes = cliente ? cliente.observacoes : "";
      const clienteNome = cliente ? cliente.nome : "Cliente não vinculado";

      // 2. Combinar fatos do processo com fatos narrados do cliente usando o prompt estruturado de Direito Médico da Jus IA
      const fatosProntuario = clienteObservacoes || "Nenhum fato clínico relatado no prontuário.";
      const teorProcesso = fatosProcesso || "Nenhum fato ou teor do processo cadastrado.";

      const textPayload = `Atue como um especialista sênior em Direito Médico. Analise os fatos clínicos do prontuário: ${fatosProntuario} em conjunto com o Teor do Processo/Fatos do Caso: ${teorProcesso}. Com base na natureza deste processo, gere IMEDIATAMENTE uma peça jurídica inicial na estrutura padrão do contencioso de saúde: 1) Dos Fatos, 2) Dos Fundamentos Jurídicos Técnicos (citando responsabilidade civil médica/resoluções CFM aplicáveis) e 3) Dos Pedidos. Retorne o documento pronto para revisão.`;

      // 3. Injetar na entrada de dados do analisador IA
      if (textInput) textInput.value = textPayload;

      // 4. Preencher dados adicionais no analisador IA
      const cnjInput = document.getElementById("processo-ai-input-numero");
      if (cnjInput) cnjInput.value = (editProcNumero ? editProcNumero.value.trim() : currentEditingProcess.numero_processo) || "";

      const valorInput = document.getElementById("processo-ai-input-valor");
      if (valorInput) valorInput.value = (editProcValor ? editProcValor.value : currentEditingProcess.valor_causa) || "";

      const tribInput = document.getElementById("processo-ai-input-tribunal");
      if (tribInput) tribInput.value = tribunal;

      const varaInput = document.getElementById("processo-ai-input-vara");
      if (varaInput) varaInput.value = vara;

      // 5. Vincular o cliente no selectClienteAi
      if (selectClienteAi) {
        // Garantir que carregou a lista antes de marcar ou tentar preencher
        selectClienteAi.value = clienteId;
      }

      // 6. Definir implicitamente o motor de IA para Jus IA
      const selectMotor = document.getElementById("processo-ai-select-motor");
      if (selectMotor) {
        selectMotor.value = "jusia";
        const event = new Event('change');
        selectMotor.dispatchEvent(event);
      }

      // 7. Fechar modal silenciosamente
      closeEditProcessModal();

      // 8. Transicionar para a view de IA
      showProcessosPanel("ai");

      // 9. Acionar a análise de IA automaticamente
      await handleAnalisarProcessoIa();

    } catch (err) {
      console.error("Erro ao integrar Jus IA com fatos do cliente:", err.message);
      alert("Erro ao acionar a Jus IA: " + err.message);
    } finally {
      setLoadingState(btnGerarPecaJusia, false, "🤖 Gerar Peça/Tese via Jus IA");
    }
  });
}

// Lógica de Impressão de Minutas Processuais
const btnProcessoImprimirMinuta = document.getElementById("btn-processo-imprimir-minuta");
const processosPrintArea = document.getElementById("processos-print-area");
const processosPrintPre = document.getElementById("processos-print-pre");
const processosPrintClientName = document.getElementById("processos-print-client-name");
const processosPrintCnj = document.getElementById("processos-print-cnj");
const processosPrintDate = document.getElementById("processos-print-date");

if (btnProcessoImprimirMinuta) {
  btnProcessoImprimirMinuta.addEventListener("click", () => {
    const text = document.getElementById("ai-result-minuta-text").value;
    if (!text) {
      alert("Gere uma minuta ou parecer antes de tentar imprimir.");
      return;
    }

    // Preencher a área de impressão
    if (processosPrintPre) processosPrintPre.textContent = text;

    // Buscar informações adicionais
    let cnjText = "Geral / Sem processo";
    const cnjInput = document.getElementById("processo-ai-input-numero");
    if (cnjInput && cnjInput.value.trim()) {
      cnjText = cnjInput.value.trim();
    }

    let clientText = "Geral";
    if (selectClienteAi && selectClienteAi.selectedIndex !== -1) {
      clientText = selectClienteAi.options[selectClienteAi.selectedIndex].text;
    }

    if (processosPrintClientName) processosPrintClientName.textContent = clientText;
    if (processosPrintCnj) processosPrintCnj.textContent = cnjText;
    if (processosPrintDate) {
      const now = new Date();
      processosPrintDate.textContent = now.toLocaleDateString("pt-BR") + " às " + now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    }

    // Chamar a impressão do navegador
    window.print();
  });
}

// =========================================================================
// 📅 MÓDULO DA AGENDA AVANÇADA (CALENDÁRIO & KANBAN)
// =========================================================================
let agendaCompromissos = [];
let currentAgendaView = "calendar";
let currentAgendaTab = "month";
let currentAgendaDate = new Date();
let currentAgendaFilter = "todos";

// Elementos da Interface Agenda
const btnAgendaViewCalendar = document.getElementById("btn-agenda-view-calendar");
const btnAgendaViewKanban = document.getElementById("btn-agenda-view-kanban");
const agendaCalendarControls = document.getElementById("agenda-calendar-controls");
const btnAgendaToday = document.getElementById("btn-agenda-today");
const btnAgendaPrev = document.getElementById("btn-agenda-prev");
const btnAgendaNext = document.getElementById("btn-agenda-next");
const agendaCalendarTitle = document.getElementById("agenda-calendar-title");
const btnAgendaTabMonth = document.getElementById("btn-agenda-tab-month");
const btnAgendaTabWeek = document.getElementById("btn-agenda-tab-week");
const agendaCalendarView = document.getElementById("agenda-calendar-view");
const agendaKanbanView = document.getElementById("agenda-kanban-view");
const agendaCalendarRender = document.getElementById("agenda-calendar-render");
const agendaTypeFilter = document.getElementById("agenda-type-filter");
const kanbanListPendente = document.getElementById("kanban-list-pendente");
const kanbanListHoje = document.getElementById("kanban-list-hoje");
const kanbanListConcluido = document.getElementById("kanban-list-concluido");
const kanbanCountPendente = document.getElementById("kanban-count-pendente");
const kanbanCountHoje = document.getElementById("kanban-count-hoje");
const kanbanCountConcluido = document.getElementById("kanban-count-concluido");

// Alternar entre Calendário e Kanban
if (btnAgendaViewCalendar) {
  btnAgendaViewCalendar.addEventListener("click", () => {
    currentAgendaView = "calendar";
    btnAgendaViewCalendar.classList.add("active");
    btnAgendaViewCalendar.style.background = "var(--gold)";
    btnAgendaViewCalendar.style.color = "var(--navy)";
    btnAgendaViewKanban.classList.remove("active");
    btnAgendaViewKanban.style.background = "none";
    btnAgendaViewKanban.style.color = "var(--text-secondary)";
    
    agendaCalendarControls.style.display = "flex";
    agendaCalendarView.classList.remove("hidden");
    agendaKanbanView.classList.add("hidden");
    renderAgenda();
  });
}

if (btnAgendaViewKanban) {
  btnAgendaViewKanban.addEventListener("click", () => {
    currentAgendaView = "kanban";
    btnAgendaViewKanban.classList.add("active");
    btnAgendaViewKanban.style.background = "var(--gold)";
    btnAgendaViewKanban.style.color = "var(--navy)";
    btnAgendaViewCalendar.classList.remove("active");
    btnAgendaViewCalendar.style.background = "none";
    btnAgendaViewCalendar.style.color = "var(--text-secondary)";
    
    agendaCalendarControls.style.display = "none";
    agendaCalendarView.classList.add("hidden");
    agendaKanbanView.classList.remove("hidden");
    renderAgenda();
  });
}

// Sub-tabs (Mensal / Semanal)
if (btnAgendaTabMonth) {
  btnAgendaTabMonth.addEventListener("click", () => {
    currentAgendaTab = "month";
    btnAgendaTabMonth.classList.add("active");
    btnAgendaTabMonth.style.background = "var(--navy-light)";
    btnAgendaTabMonth.style.color = "var(--text-primary)";
    btnAgendaTabWeek.classList.remove("active");
    btnAgendaTabWeek.style.background = "none";
    btnAgendaTabWeek.style.color = "var(--text-secondary)";
    renderAgenda();
  });
}

if (btnAgendaTabWeek) {
  btnAgendaTabWeek.addEventListener("click", () => {
    currentAgendaTab = "week";
    btnAgendaTabWeek.classList.add("active");
    btnAgendaTabWeek.style.background = "var(--navy-light)";
    btnAgendaTabWeek.style.color = "var(--text-primary)";
    btnAgendaTabMonth.classList.remove("active");
    btnAgendaTabMonth.style.background = "none";
    btnAgendaTabMonth.style.color = "var(--text-secondary)";
    renderAgenda();
  });
}

// Filtro de Categoria
if (agendaTypeFilter) {
  agendaTypeFilter.addEventListener("change", (e) => {
    currentAgendaFilter = e.target.value;
    renderAgenda();
  });
}

// Controles de Navegação das Datas
if (btnAgendaToday) {
  btnAgendaToday.addEventListener("click", () => {
    currentAgendaDate = new Date();
    renderAgenda();
  });
}

if (btnAgendaPrev) {
  btnAgendaPrev.addEventListener("click", () => {
    if (currentAgendaTab === "month") {
      currentAgendaDate.setMonth(currentAgendaDate.getMonth() - 1);
    } else {
      currentAgendaDate.setDate(currentAgendaDate.getDate() - 7);
    }
    renderAgenda();
  });
}

if (btnAgendaNext) {
  btnAgendaNext.addEventListener("click", () => {
    if (currentAgendaTab === "month") {
      currentAgendaDate.setMonth(currentAgendaDate.getMonth() + 1);
    } else {
      currentAgendaDate.setDate(currentAgendaDate.getDate() + 7);
    }
    renderAgenda();
  });
}

// Sincronizar e buscar dados Supabase de agenda
async function loadAgendaData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar com RLS ativo na tabela
    const { data, error } = await supabase
      .from("compromissos")
      .select(`
        *,
        clientes ( nome, whatsapp ),
        processos ( numero_processo, titulo )
      `)
      .order("data_hora", { ascending: true });

    if (error) throw error;
    
    // Type-cast e sanitização de dados aninhados
    agendaCompromissos = (data || []).map(item => {
      const clientesObj = Array.isArray(item.clientes) ? item.clientes[0] : item.clientes;
      const processosObj = Array.isArray(item.processos) ? item.processos[0] : item.processos;
      return {
        ...item,
        clientes: clientesObj || null,
        processos: processosObj || null
      };
    });

    renderAgenda();
  } catch (err) {
    console.error("Erro ao carregar dados do painel de agenda:", err.message);
  }
}

// Obter estilo dinâmico por categoria
function getAgendaStyle(tipo) {
  const t = tipo ? tipo.toLowerCase() : "";
  if (t.includes("audiência") || t.includes("audiencia")) {
    return {
      borderClass: "border-l-4 border-red-500",
      bgClass: "var(--input-bg)",
      hoverClass: "rgba(239, 68, 68, 0.1)",
      textClass: "#ef4444",
      badge: "🔴 Audiência"
    };
  } else if (t.includes("prazo")) {
    return {
      borderClass: "border-l-4 border-[#d4af37]",
      bgClass: "var(--input-bg)",
      hoverClass: "rgba(212, 175, 55, 0.1)",
      textClass: "var(--gold)",
      badge: "⚜️ Prazo Processual"
    };
  } else {
    return {
      borderClass: "border-l-4 border-blue-500",
      bgClass: "var(--input-bg)",
      hoverClass: "rgba(59, 130, 246, 0.1)",
      textClass: "#3b82f6",
      badge: "🔵 Reunião / Atendimento"
    };
  }
}

// Filtro rápido de compromissos
function getFilteredAgendaCompromissos() {
  if (currentAgendaFilter === "todos") return agendaCompromissos;
  return agendaCompromissos.filter(c => {
    const style = getAgendaStyle(c.tipo);
    if (currentAgendaFilter === "audiencia") return style.badge.includes("Audiência");
    if (currentAgendaFilter === "prazo") return style.badge.includes("Prazo");
    if (currentAgendaFilter === "reuniao") return style.badge.includes("Reunião");
    return true;
  });
}

// Chavear renderização
function renderAgenda() {
  if (currentAgendaView === "calendar") {
    renderCalendar();
  } else {
    renderKanban();
  }
}

// Renderizar Calendário
function renderCalendar() {
  const filtered = getFilteredAgendaCompromissos();
  const year = currentAgendaDate.getFullYear();
  const month = currentAgendaDate.getMonth();

  if (currentAgendaTab === "month") {
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    agendaCalendarTitle.innerText = `${monthNames[month]} ${year}`.toUpperCase();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();
    
    let gridHtml = `
      <div style="min-width: 700px;">
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); border-b: 1px solid var(--panel-border); background: var(--input-bg);">
          ${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => `
            <div style="padding: 10px 0; text-align: center; font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">${day}</div>
          `).join("")}
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(100px, auto); background: var(--panel-border); gap: 1px;">
    `;

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevLastDay - i;
      const cellDate = new Date(year, month - 1, dayNum);
      gridHtml += renderCalendarCell(dayNum, false, cellDate, filtered);
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDay; i++) {
      const cellDate = new Date(year, month, i);
      const isToday = new Date().toDateString() === cellDate.toDateString();
      gridHtml += renderCalendarCell(i, true, cellDate, filtered, isToday);
    }

    // Dias do próximo mês
    const totalCells = firstDayIndex + lastDay;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      const cellDate = new Date(year, month + 1, i);
      gridHtml += renderCalendarCell(i, false, cellDate, filtered);
    }

    gridHtml += `
        </div>
      </div>
    `;
    agendaCalendarRender.innerHTML = gridHtml;

  } else {
    // Grade Semanal
    const startOfWeek = new Date(currentAgendaDate);
    startOfWeek.setDate(currentAgendaDate.getDate() - currentAgendaDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatTitle = `${startOfWeek.getDate()}/${startOfWeek.getMonth()+1} a ${endOfWeek.getDate()}/${endOfWeek.getMonth()+1} - ${year}`;
    agendaCalendarTitle.innerText = formatTitle.toUpperCase();

    let gridHtml = `
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--panel-border); min-width: 750px;">
    `;

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const isToday = new Date().toDateString() === day.toDateString();
      const diaNome = day.toLocaleDateString("pt-BR", { weekday: "short" });
      const dayComps = filtered.filter(c => {
        const cDate = new Date(c.data_hora);
        return cDate.toDateString() === day.toDateString();
      });

      gridHtml += `
        <div style="padding: 16px; min-height: 400px; background: ${isToday ? "var(--gold-light)" : "var(--input-bg)"}; display: flex; flex-direction: column; gap: 12px;">
          <div style="border-bottom: 1px solid var(--panel-border); padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">${diaNome}</span>
              <span style="font-size: 14px; font-weight: 800; color: ${isToday ? "var(--gold)" : "var(--text-primary)"};">${day.getDate()} / ${day.getMonth()+1}</span>
            </div>
            ${dayComps.length > 0 ? `<span style="font-size: 9px; font-weight: 700; background: var(--panel-bg); border: 1px solid var(--panel-border); padding: 2px 6px; border-radius: 20px; color: var(--text-secondary);">${dayComps.length}</span>` : ""}
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; max-height: 350px;">
            ${dayComps.length === 0 ? `
              <div style="text-align: center; padding: 20px 0; font-size: 10px; color: var(--text-secondary); font-style: italic;">Sem compromissos</div>
            ` : dayComps.map(c => {
              const style = getAgendaStyle(c.tipo);
              const isOnline = c.tipo === "Reunião Online" || (c.local_link && (c.local_link.includes("meet.google.com") || c.local_link.includes("teams.microsoft.com")));
              const dTime = new Date(c.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              return `
                <div class="agenda-mini-card btn-edit-comp-trigger" data-id="${c.id}" style="padding: 10px; border-radius: 8px; border-left: 3px solid ${style.textClass}; background: var(--panel-bg); border: 1px solid var(--panel-border); border-left-width: 3px; display: flex; flex-direction: column; gap: 6px; cursor: pointer; transition: all 0.2s;">
                  <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; color: var(--text-secondary);">
                    <span>⏱️ ${dTime}</span>
                    <span style="color: ${style.textClass};">${c.status}</span>
                  </div>
                  <h4 style="font-size: 11px; font-weight: 700; margin: 0; color: var(--text-primary); line-clamp: 2;" class="truncate-2-lines">
                    ${isOnline ? "🎥 " : ""}${c.titulo}
                  </h4>
                  ${c.clientes ? `<span style="font-size: 9px; color: var(--text-secondary);">👤 ${c.clientes.nome}</span>` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    gridHtml += `</div>`;
    agendaCalendarRender.innerHTML = gridHtml;
  }
}

// Renderizar Célula Mensal
function renderCalendarCell(dayNum, isCurrentMonth, cellDate, commitmentsList, isToday = false) {
  const dayComps = commitmentsList.filter(c => {
    const cDate = new Date(c.data_hora);
    return cDate.toDateString() === cellDate.toDateString();
  });

  let cellStyle = `padding: 10px; display: flex; flex-direction: column; gap: 6px; min-height: 110px; position: relative; background: var(--input-bg); color: var(--text-primary);`;
  if (!isCurrentMonth) cellStyle += ` background: rgba(0,0,0,0.05); opacity: 0.5;`;
  if (isToday) cellStyle += ` background: var(--gold-light);`;

  let cellHtml = `
    <div style="${cellStyle}">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 700; font-family: 'Outfit'; color: ${isToday ? "var(--navy)" : "var(--text-secondary)"}; background: ${isToday ? "var(--gold)" : "none"}; padding: 2px 6px; border-radius: 4px;">${dayNum}</span>
        ${dayComps.length > 0 ? `<span style="font-size: 8px; font-weight: 700; background: var(--panel-bg); border: 1px solid var(--panel-border); color: var(--text-secondary); padding: 1px 4px; border-radius: 20px;">${dayComps.length}</span>` : ""}
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex-grow: 1; overflow: hidden;">
  `;

  dayComps.slice(0, 3).forEach(c => {
    const style = getAgendaStyle(c.tipo);
    const dTime = new Date(c.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const isOnline = c.tipo === "Reunião Online" || (c.local_link && (c.local_link.includes("meet.google.com") || c.local_link.includes("teams.microsoft.com")));
    cellHtml += `
      <div class="btn-edit-comp-trigger" data-id="${c.id}" style="padding: 2px 6px; font-size: 9px; font-weight: 600; border-left: 2px solid ${style.textClass}; background: var(--panel-bg); border: 1px solid var(--panel-border); border-left-width: 2px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;" title="${c.titulo} - ${dTime}">
        <span class="truncate" style="flex-grow: 1; text-align: left; color: var(--text-primary);">${isOnline ? "🎥 " : ""}${c.titulo}</span>
        <span style="font-size: 7px; color: var(--text-secondary); font-family: monospace; margin-left: 4px; shrink-0;">${dTime}</span>
      </div>
    `;
  });

  if (dayComps.length > 3) {
    cellHtml += `
      <div style="font-size: 8px; font-weight: 700; color: var(--gold); text-align: center; margin-top: 2px;">
        + ${dayComps.length - 3} mais
      </div>
    `;
  }

  cellHtml += `
      </div>
    </div>
  `;
  return cellHtml;
}

// Renderizar Quadro Kanban
function renderKanban() {
  const filtered = getFilteredAgendaCompromissos();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const pendentes = [];
  const emAndamento = [];
  const concluidos = [];

  filtered.forEach(c => {
    if (c.status === "Realizado" || c.status === "Cancelado") {
      concluidos.push(c);
    } else {
      const cDate = new Date(c.data_hora);
      const cDateZero = new Date(cDate);
      cDateZero.setHours(0, 0, 0, 0);

      if (cDateZero.getTime() === hoje.getTime()) {
        emAndamento.push(c);
      } else {
        pendentes.push(c);
      }
    }
  });

  // Atualizar contadores
  kanbanCountPendente.innerText = pendentes.length;
  kanbanCountHoje.innerText = emAndamento.length;
  kanbanCountConcluido.innerText = concluidos.length;

  // Renderizar listas
  kanbanListPendente.innerHTML = pendentes.length === 0 ? `<div style="text-align: center; padding: 40px 0; font-size: 12px; color: var(--text-secondary); font-style: italic;">Sem compromissos pendentes</div>` : pendentes.map(c => renderKanbanCard(c)).join("");
  kanbanListHoje.innerHTML = emAndamento.length === 0 ? `<div style="text-align: center; padding: 40px 0; font-size: 12px; color: var(--text-secondary); font-style: italic;">Nenhum compromisso agendado para hoje</div>` : emAndamento.map(c => renderKanbanCard(c)).join("");
  kanbanListConcluido.innerHTML = concluidos.length === 0 ? `<div style="text-align: center; padding: 40px 0; font-size: 12px; color: var(--text-secondary); font-style: italic;">Nenhum compromisso finalizado</div>` : concluidos.map(c => renderKanbanCard(c)).join("");
}

// Renderizar Card do Kanban
function renderKanbanCard(c) {
  const style = getAgendaStyle(c.tipo);
  const isOnline = c.tipo === "Reunião Online" || (c.local_link && (c.local_link.includes("meet.google.com") || c.local_link.includes("teams.microsoft.com")));
  const dTime = new Date(c.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dDate = new Date(c.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  let actionHtml = "";
  if (c.status === "Agendado") {
    actionHtml = `
      <div style="display: flex; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--panel-border);" class="kanban-card-actions">
        <button type="button" class="btn-kanban-complete" data-id="${c.id}" style="background: none; border: none; color: #10b981; font-size: 10px; font-weight: 700; cursor: pointer; padding: 0;">✓ Cumprir</button>
        <button type="button" class="btn-kanban-cancel" data-id="${c.id}" style="background: none; border: none; color: #ef4444; font-size: 10px; font-weight: 700; cursor: pointer; padding: 0;">✕ Cancelar</button>
      </div>
    `;
  }

  let joinLinkHtml = "";
  if (isOnline && c.local_link) {
    joinLinkHtml = `
      <div style="margin-top: 6px; padding: 6px 10px; background: var(--input-bg); border: 1px solid var(--panel-border); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
        <span style="color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 170px;" class="font-mono text-[10px]">🔗 ${c.local_link}</span>
        <a href="${c.local_link}" target="_blank" style="color: var(--gold); font-weight: 700; text-decoration: none; font-size: 10px;">Entrar ↗</a>
      </div>
    `;
  } else if (c.local_link) {
    joinLinkHtml = `
      <div style="margin-top: 6px; padding: 6px 10px; background: var(--input-bg); border: 1px solid var(--panel-border); border-radius: 6px; font-size: 10px; color: var(--text-secondary);" class="truncate">
        📍 Local: <strong style="color: var(--text-primary);">${c.local_link}</strong>
      </div>
    `;
  }

  return `
    <div class="agenda-kanban-card btn-edit-comp-trigger" data-id="${c.id}" style="background: var(--input-bg); border-left: 4px solid ${style.textClass}; border: 1px solid var(--panel-border); border-left-width: 4px; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; position: relative; transition: all 0.25s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 8px; font-weight: 700; color: ${style.textClass}; text-transform: uppercase; background: var(--panel-bg); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--panel-border);">${style.badge}</span>
        <span style="font-size: 9px; font-weight: 700; color: var(--text-secondary); background: var(--input-bg); border: 1px solid var(--panel-border); padding: 1px 6px; border-radius: 4px;">⏱️ ${dDate} às ${dTime}</span>
      </div>
      
      <h4 style="font-size: 13px; font-weight: 700; margin: 4px 0 0 0; color: var(--text-primary);">${isOnline ? "🎥 " : ""}${c.titulo}</h4>
      
      ${joinLinkHtml}

      <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px; font-size: 10px; color: var(--text-secondary);">
        ${c.clientes ? `<div>👤 Cliente: <strong style="color: var(--text-primary);">${c.clientes.nome}</strong></div>` : ""}
        ${c.processos ? `<div>⚖️ Proc: <strong style="color: var(--text-primary);" class="font-mono text-[9px]">${c.processos.numero_processo}</strong></div>` : ""}
      </div>

      ${actionHtml}
    </div>
  `;
}

// Vincular ações rápidas dentro da agenda (Kanban e Calendário)
const viewAgendaSection = document.getElementById("view-agenda");
if (viewAgendaSection) {
  viewAgendaSection.addEventListener("click", async (e) => {
    const card = e.target.closest(".btn-edit-comp-trigger");
    const isActionButton = e.target.closest(".btn-kanban-complete") || e.target.closest(".btn-kanban-cancel") || e.target.closest("a");
    
    if (card && !isActionButton) {
      const id = card.getAttribute("data-id");
      openEditCompromisso(id);
      return;
    }

    const btnComplete = e.target.closest(".btn-kanban-complete");
    if (btnComplete) {
      e.stopPropagation();
      const id = btnComplete.getAttribute("data-id");
      try {
        const { error } = await supabase
          .from("compromissos")
          .update({ status: "Realizado" })
          .eq("id", id);
        
        if (error) throw error;
        loadAgendaData();
        loadDashboardData();
      } catch (err) {
        console.error("Erro ao cumprir compromisso:", err.message);
      }
      return;
    }

    const btnCancel = e.target.closest(".btn-kanban-cancel");
    if (btnCancel) {
      e.stopPropagation();
      if (!window.confirm("Deseja realmente cancelar este compromisso?")) return;
      const id = btnCancel.getAttribute("data-id");
      try {
        const { error } = await supabase
          .from("compromissos")
          .update({ status: "Cancelado" })
          .eq("id", id);
        
        if (error) throw error;
        loadAgendaData();
        loadDashboardData();
      } catch (err) {
        console.error("Erro ao cancelar compromisso:", err.message);
      }
      return;
    }
  });
}

// =========================================================================
// MÓDULO FINANCEIRO CENTRAL - GESTÃO DE HONORÁRIOS E CAIXA UNIFICADO
// =========================================================================
let financeiroDataCache = [];
let financeiroOffset = 0;
const financeiroLimit = 50;
let hasMoreFinanceiro = true;

async function loadFinanceiroData(append = false) {
  const tableLoading = document.getElementById("financeiro-table-loading");
  const tableContainer = document.getElementById("financeiro-table-container");
  const tableEmpty = document.getElementById("financeiro-table-empty");
  const launchesCount = document.getElementById("financeiro-launches-count");
  const loadMoreContainer = document.getElementById("financeiro-load-more-container");
  const btnLoadMore = document.getElementById("btn-financeiro-load-more");

  const totalRecebidoEl = document.getElementById("financeiro-total-recebido");
  const totalInadimplenciaEl = document.getElementById("financeiro-total-inadimplencia");
  const totalProjecaoEl = document.getElementById("financeiro-total-projecao");

  try {
    if (!append) {
      financeiroOffset = 0;
      financeiroDataCache = [];
      hasMoreFinanceiro = true;
      if (tableLoading) tableLoading.style.display = "flex";
      if (tableContainer) tableContainer.style.display = "none";
      if (tableEmpty) tableEmpty.style.display = "none";
      if (loadMoreContainer) loadMoreContainer.style.display = "none";
    } else {
      if (btnLoadMore) setLoadingState(btnLoadMore, true, "Carregando...");
    }

    const { data: finData, error: finError } = await supabase
      .from("financeiro")
      .select("*, clientes(id, nome, whatsapp), processos(id, titulo, numero_processo, status)")
      .order("data_vencimento", { ascending: false })
      .range(financeiroOffset, financeiroOffset + financeiroLimit - 1);

    if (finError) throw finError;

    const mappedData = (finData || []).map(item => {
      const clientObj = Array.isArray(item.clientes) ? item.clientes[0] : item.clientes;
      const processObj = Array.isArray(item.processos) ? item.processos[0] : item.processos;
      return {
        ...item,
        clientes: clientObj || null,
        processos: processObj || null
      };
    });

    if (append) {
      financeiroDataCache = [...financeiroDataCache, ...mappedData];
      if (btnLoadMore) setLoadingState(btnLoadMore, false, "🔄 Carregar mais lançamentos...");
    } else {
      financeiroDataCache = mappedData;
    }

    // Se o número de itens retornados for menor que o limite, chegamos ao final
    if (mappedData.length < financeiroLimit) {
      hasMoreFinanceiro = false;
      if (loadMoreContainer) loadMoreContainer.style.display = "none";
    } else {
      hasMoreFinanceiro = true;
      if (loadMoreContainer) loadMoreContainer.style.display = "block";
    }

    // 1. Calcular Métricas Financeiras Consolidadas em Tempo Real
    const metrics = calculateFinanceiroMetrics(financeiroDataCache);
    if (totalRecebidoEl) totalRecebidoEl.innerText = formatBrl(metrics.totalRecebido);
    if (totalInadimplenciaEl) totalInadimplenciaEl.innerText = formatBrl(metrics.totalInadimplencia);
    if (totalProjecaoEl) totalProjecaoEl.innerText = formatBrl(metrics.totalProjecao);

    // 2. Renderizar a Tabela com Filtros
    renderFinanceiroTable();

    // 3. Sincronizar em Tempo Real os Indicadores com o Dashboard
    syncDashboardWithCache(metrics, financeiroDataCache);

  } catch (err) {
    console.error("Erro ao carregar faturamento geral:", err.message);
    if (!append) {
      if (tableLoading) tableLoading.style.display = "none";
      if (tableEmpty) {
        tableEmpty.style.display = "block";
        tableEmpty.innerText = "Erro ao sincronizar lançamentos financeiros: " + err.message;
      }
    } else {
      if (btnLoadMore) setLoadingState(btnLoadMore, false, "🔄 Carregar mais lançamentos...");
      alert("Falha ao carregar mais lançamentos: " + err.message);
    }
  }
}


function calculateFinanceiroMetrics(list) {
  const agora = new Date();
  const anoCorrente = agora.getFullYear();
  const mesCorrente = agora.getMonth(); // 0-indexed

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().split("T")[0];

  const proximo30Dias = new Date();
  proximo30Dias.setDate(proximo30Dias.getDate() + 30);
  proximo30Dias.setHours(23, 59, 59, 999);
  const proximo30DiasStr = proximo30Dias.toISOString().split("T")[0];

  let totalRecebido = 0;
  let totalInadimplencia = 0;
  let totalProjecao = 0;

  list.forEach(item => {
    const valor = parseFloat(item.valor_total) || 0;
    const status = (item.status_pagamento || "").toLowerCase();
    
    const date = new Date(item.data_vencimento);
    const dataVencAno = date.getUTCFullYear();
    const dataVencMes = date.getUTCMonth();

    // Total Recebido no Mês Corrente
    if (status === "pago" && dataVencAno === anoCorrente && dataVencMes === mesCorrente) {
      totalRecebido += valor;
    }

    // Inadimplência
    if (status !== "pago" && item.data_vencimento < hojeStr) {
      totalInadimplencia += valor;
    }

    // Previsão de Entrada (próximos 30 dias)
    if (status !== "pago" && item.data_vencimento >= hojeStr && item.data_vencimento <= proximo30DiasStr) {
      totalProjecao += valor;
    }
  });

  return { totalRecebido, totalInadimplencia, totalProjecao };
}

function syncDashboardWithCache(metrics, list) {
  const finTotalRecebidoDashboard = document.getElementById("fin-total-recebido-dashboard");
  if (!finTotalRecebidoDashboard) return;

  let totalPagoHistorico = 0;
  let sumFixo = 0;
  let sumMensal = 0;
  let sumExito = 0;
  let overdueCount = 0;
  const todayStr = new Date().toISOString().split("T")[0];

  list.forEach(item => {
    const val = parseFloat(item.valor_total) || 0;
    const status = (item.status_pagamento || "").toLowerCase();
    const tipo = (item.tipo_honorario || "").toLowerCase();

    if (status === "pago") {
      totalPagoHistorico += val;
    }

    if (tipo === "fixo") {
      sumFixo += val;
    } else if (tipo === "mensal") {
      sumMensal += val;
    } else if (tipo === "êxito" || tipo === "exito") {
      sumExito += val;
    }

    if (status !== "pago" && item.data_vencimento < todayStr) {
      overdueCount++;
    }
  });

  finTotalRecebidoDashboard.innerText = formatBrl(totalPagoHistorico);

  const chartValFixo = document.getElementById("chart-val-fixo");
  const chartValMensal = document.getElementById("chart-val-mensal");
  const chartValExito = document.getElementById("chart-val-exito");
  if (chartValFixo) chartValFixo.innerText = formatBrl(sumFixo);
  if (chartValMensal) chartValMensal.innerText = formatBrl(sumMensal);
  if (chartValExito) chartValExito.innerText = formatBrl(sumExito);

  const chartBarFixo = document.getElementById("chart-bar-fixo");
  const chartBarMensal = document.getElementById("chart-bar-mensal");
  const chartBarExito = document.getElementById("chart-bar-exito");

  const maxVal = Math.max(sumFixo, sumMensal, sumExito, 1);
  const pctFixo = Math.round((sumFixo / maxVal) * 100);
  const pctMensal = Math.round((sumMensal / maxVal) * 100);
  const pctExito = Math.round((sumExito / maxVal) * 100);

  if (chartBarFixo) chartBarFixo.style.width = `${pctFixo}%`;
  if (chartBarMensal) chartBarMensal.style.width = `${pctMensal}%`;
  if (chartBarExito) chartBarExito.style.width = `${pctExito}%`;

  const financialOverdueAlert = document.getElementById("financial-overdue-alert");
  if (financialOverdueAlert) {
    financialOverdueAlert.style.display = overdueCount > 0 ? "flex" : "none";
  }
}

function renderFinanceiroTable() {
  const tableLoading = document.getElementById("financeiro-table-loading");
  const tableContainer = document.getElementById("financeiro-table-container");
  const tableEmpty = document.getElementById("financeiro-table-empty");
  const tableBody = document.getElementById("financeiro-table-body");
  const launchesCount = document.getElementById("financeiro-launches-count");

  if (!tableBody) return;

  const searchInput = document.getElementById("financeiro-search-input");
  const statusSelect = document.getElementById("financeiro-filter-status");
  const monthSelect = document.getElementById("financeiro-filter-month");

  const searchQuery = searchInput ? (searchInput.value || "").toLowerCase() : "";
  const statusFilter = statusSelect ? statusSelect.value : "todos";
  const monthFilter = monthSelect ? monthSelect.value : "todos";

  const filtered = financeiroDataCache.filter(item => {
    const nomeCliente = (item.clientes?.nome || "").toLowerCase();
    const tituloProcesso = (item.processos?.titulo || "").toLowerCase();
    const numProcesso = (item.processos?.numero_processo || "").toLowerCase();

    const matchSearch = nomeCliente.includes(searchQuery) || tituloProcesso.includes(searchQuery) || numProcesso.includes(searchQuery);
    const matchStatus = statusFilter === "todos" || (item.status_pagamento || "").toLowerCase() === statusFilter.toLowerCase();

    let matchMonth = true;
    if (monthFilter !== "todos") {
      const d = new Date(item.data_vencimento);
      const mesIndex = d.getUTCMonth() + 1;
      matchMonth = mesIndex.toString() === monthFilter;
    }

    return matchSearch && matchStatus && matchMonth;
  });

  if (tableLoading) tableLoading.style.display = "none";
  if (launchesCount) launchesCount.innerText = `${filtered.length} lançamentos`;

  if (filtered.length === 0) {
    if (tableContainer) tableContainer.style.display = "none";
    if (tableEmpty) tableEmpty.style.display = "block";
    return;
  }

  if (tableEmpty) tableEmpty.style.display = "none";
  if (tableContainer) tableContainer.style.display = "block";
  tableBody.innerHTML = "";

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid var(--input-border)";
    tr.style.transition = "background-color 0.2s";
    tr.className = "finance-table-row";

    // 1. Cliente Clicável
    const tdCliente = document.createElement("td");
    tdCliente.style.padding = "12px 16px";
    const btnCliente = document.createElement("button");
    btnCliente.type = "button";
    btnCliente.innerText = item.clientes?.nome || "Cliente Removido";
    btnCliente.style.background = "none";
    btnCliente.style.border = "none";
    btnCliente.style.padding = "0";
    btnCliente.style.color = "var(--gold)";
    btnCliente.style.fontWeight = "bold";
    btnCliente.style.cursor = "pointer";
    btnCliente.style.fontFamily = "'Outfit', sans-serif";
    btnCliente.style.fontSize = "13px";
    btnCliente.style.textDecoration = "underline";
    btnCliente.addEventListener("click", () => {
      redirectToClienteFinanceiro(item.cliente_id);
    });
    tdCliente.appendChild(btnCliente);

    // 2. Processo Vinculado
    const tdProcesso = document.createElement("td");
    tdProcesso.style.padding = "12px 16px";
    tdProcesso.style.color = "var(--text-secondary)";
    if (item.processos) {
      tdProcesso.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="color: var(--text-primary); font-weight: 600;">${item.processos.titulo}</span>
          <span style="font-family: monospace; font-size: 10.5px; color: var(--text-secondary); opacity: 0.8;">${item.processos.numero_processo}</span>
        </div>
      `;
    } else {
      tdProcesso.innerHTML = `<span style="font-style: italic; opacity: 0.5;">Sem vínculo</span>`;
    }

    // 3. Tipo + Alerta Cobrável
    const tdTipo = document.createElement("td");
    tdTipo.style.padding = "12px 16px";
    tdTipo.style.fontWeight = "500";
    tdTipo.style.textTransform = "capitalize";

    const isExito = (item.tipo_honorario || "").toLowerCase() === "êxito" || (item.tipo_honorario || "").toLowerCase() === "exito";
    const procStatus = (item.processos?.status || "").toLowerCase();
    const isCobravel = isExito && (procStatus === "arquivado" || procStatus === "em acordo" || procStatus === "suspenso");

    if (isCobravel) {
      tdTipo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${item.tipo_honorario}</span>
          <span class="badge-exito-cobravel animate-pulse" style="background: rgba(197, 168, 92, 0.15); border: 1px solid var(--gold); color: var(--gold); padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;" title="Processo concluído! O valor de êxito já está liberado para cobrança.">
            💰 Êxito Cobrável!
          </span>
        </div>
      `;
    } else {
      tdTipo.innerText = item.tipo_honorario;
    }

    // 4. Valor
    const tdValor = document.createElement("td");
    tdValor.style.padding = "12px 16px";
    tdValor.style.fontFamily = "monospace";
    tdValor.style.fontWeight = "bold";
    tdValor.innerText = formatBrl(parseFloat(item.valor_total) || 0);

    // 5. Vencimento
    const tdVenc = document.createElement("td");
    tdVenc.style.padding = "12px 16px";
    tdVenc.style.fontFamily = "monospace";
    tdVenc.innerText = formatDataBr(item.data_vencimento);

    // 6. Status
    const tdStatus = document.createElement("td");
    tdStatus.style.padding = "12px 16px";
    tdStatus.style.textAlign = "center";
    
    const status = (item.status_pagamento || "").toLowerCase();
    let statusColor = "var(--gold)";
    let statusBg = "rgba(197, 168, 92, 0.1)";

    if (status === "pago") {
      statusColor = "var(--success-color)";
      statusBg = "rgba(16, 185, 129, 0.1)";
    } else if (status === "atrasado") {
      statusColor = "var(--error-color)";
      statusBg = "rgba(239, 68, 68, 0.1)";
    }

    tdStatus.innerHTML = `
      <span style="display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${statusColor}33;">
        ● ${status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    `;

    // 7. Ações
    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "12px 16px";
    tdAcoes.style.textAlign = "right";

    const actionsContainer = document.createElement("div");
    actionsContainer.style.display = "inline-flex";
    actionsContainer.style.alignItems = "center";
    actionsContainer.style.gap = "10px";

    if (status !== "pago") {
      const btnMarkPaid = document.createElement("button");
      btnMarkPaid.type = "button";
      btnMarkPaid.innerText = "✓ Recebido";
      btnMarkPaid.style.background = "none";
      btnMarkPaid.style.border = "none";
      btnMarkPaid.style.color = "var(--success-color)";
      btnMarkPaid.style.fontWeight = "bold";
      btnMarkPaid.style.cursor = "pointer";
      btnMarkPaid.style.fontSize = "12px";
      btnMarkPaid.addEventListener("click", async () => {
        try {
          setLoadingState(btnMarkPaid, true, "Processando...");
          const { error } = await supabase
            .from("financeiro")
            .update({ status_pagamento: "pago" })
            .eq("id", item.id);

          if (error) throw error;
          await loadFinanceiroData();
          await loadDashboardData();
        } catch (err) {
          alert("Erro ao faturar honorário: " + err.message);
          setLoadingState(btnMarkPaid, false, "✓ Recebido");
        }
      });
      actionsContainer.appendChild(btnMarkPaid);
    }

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.innerText = "✕";
    btnDelete.style.background = "none";
    btnDelete.style.border = "none";
    btnDelete.style.color = "var(--error-color)";
    btnDelete.style.fontWeight = "bold";
    btnDelete.style.cursor = "pointer";
    btnDelete.style.fontSize = "13px";
    btnDelete.style.opacity = "0.5";
    btnDelete.style.transition = "opacity 0.2s";
    btnDelete.addEventListener("mouseover", () => btnDelete.style.opacity = "1");
    btnDelete.addEventListener("mouseout", () => btnDelete.style.opacity = "0.5");
    btnDelete.addEventListener("click", async () => {
      if (!window.confirm("Deseja realmente excluir este lançamento permanentemente?")) return;
      try {
        setLoadingState(btnDelete, true, "...");
        const { error } = await supabase
          .from("financeiro")
          .delete()
          .eq("id", item.id);

        if (error) throw error;
        await loadFinanceiroData();
        await loadDashboardData();
      } catch (err) {
        alert("Erro ao excluir lançamento: " + err.message);
        setLoadingState(btnDelete, false, "✕");
      }
    });
    actionsContainer.appendChild(btnDelete);

    tdAcoes.appendChild(actionsContainer);

    tr.appendChild(tdCliente);
    tr.appendChild(tdProcesso);
    tr.appendChild(tdTipo);
    tr.appendChild(tdValor);
    tr.appendChild(tdVenc);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAcoes);

    tableBody.appendChild(tr);
  });
}

function redirectToClienteFinanceiro(clientId) {
  switchPrivateView("clientes");
  openClientDetailsById(clientId, "financeiro");
}

function formatBrl(num) {
  return parseFloat(num || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDataBr(dataStr) {
  if (!dataStr) return "";
  const partes = dataStr.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR");
}

// Inicializar Filtros do Painel Financeiro
function initFinanceiroFilters() {
  const searchInput = document.getElementById("financeiro-search-input");
  const statusSelect = document.getElementById("financeiro-filter-status");
  const monthSelect = document.getElementById("financeiro-filter-month");

  if (searchInput) searchInput.addEventListener("input", renderFinanceiroTable);
  if (statusSelect) statusSelect.addEventListener("change", renderFinanceiroTable);
  if (monthSelect) monthSelect.addEventListener("change", renderFinanceiroTable);
  
  const btnVerFinanceiroAtrasado = document.getElementById("btn-ver-financeiro-atrasado");
  if (btnVerFinanceiroAtrasado) {
    btnVerFinanceiroAtrasado.addEventListener("click", () => {
      switchPrivateView("financeiro");
    });
  }

  const cardFinanceiroDashboard = document.getElementById("card-financeiro-dashboard");
  if (cardFinanceiroDashboard) {
    cardFinanceiroDashboard.addEventListener("click", () => {
      switchPrivateView("financeiro");
    });
  }

  const btnLoadMore = document.getElementById("btn-financeiro-load-more");
  if (btnLoadMore) {
    btnLoadMore.addEventListener("click", async () => {
      financeiroOffset += financeiroLimit;
      await loadFinanceiroData(true);
    });
  }
}

// =========================================================================
// 📜 MÓDULO DE GESTÃO DE CONTRATOS & IA MINUTAS
// =========================================================================
let contratosClientesList = [];
let activeLawyerProfile = null;
let contratosSelectedClienteId = "";
let contratosActiveMotor = "gemini";
let contratosActiveTab = "minuta";
let contratosActivePlano = "mensal";
let signaturePadIsDrawing = false;
let signaturePadHasDrawing = false;
let contratosSignatureDataUrl = null;
let activeMensalidadeSelecionada = null;
let contratosMensalidadesList = [];

function resizeContractsCanvas() {
  if (contratosCanvasPad) {
    contratosCanvasPad.width = contratosCanvasPad.parentElement.clientWidth;
    contratosCanvasPad.height = 160;
    const ctx = contratosCanvasPad.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = document.documentElement.getAttribute("data-theme") === "dark" ? "#d4af37" : "#0f1e36";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
    }
  }
}

async function loadContratosData() {
  if (!contratosClientSelect) return;
  
  contratosClientSelect.innerHTML = '<option value="" disabled selected>Carregando clientes...</option>';
  
  try {
    // 1. Carregar lista de clientes
    const { data: clients, error } = await supabase
      .from("clientes")
      .select("id, nome, tipo_pessoa, cpf_cnpj, observacoes, areas_interesse")
      .order("nome", { ascending: true });
      
    if (error) throw error;
    
    contratosClientesList = clients || [];
    
    contratosClientSelect.innerHTML = '<option value="" disabled selected>Selecione um cliente...</option>';
    contratosClientesList.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `👤 ${c.nome} (${c.tipo_pessoa === "PF" ? "Física" : "Jurídica"})`;
      contratosClientSelect.appendChild(opt);
    });
    
    // 2. Carregar dados do advogado logado (perfil) para o contrato e assinatura
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: lawyerData } = await supabase
        .from("advogados")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (lawyerData) {
        activeLawyerProfile = {
          id: user.id,
          email: user.email || "",
          nome: lawyerData.nome || user.user_metadata?.nome || "Dra. Janaina Tarabauca",
          oab: lawyerData.oab || user.user_metadata?.oab || "123.456",
          tratamento: lawyerData.tratamento || user.user_metadata?.tratamento || "Dra.",
          telefone: lawyerData.telefone || "",
          assinatura_digital_url: lawyerData.assinatura_digital_url || user.user_metadata?.assinatura_digital_url || null,
          cpf_cnpj: lawyerData.cpf_cnpj || "12.345.678/0001-90",
          endereco_profissional: lawyerData.endereco_profissional || "Av. Paulista, 1000, 16º andar, São Paulo/SP",
        };
      } else {
        activeLawyerProfile = {
          id: user.id,
          email: user.email || "",
          nome: user.user_metadata?.nome || "Dra. Janaina Tarabauca",
          oab: user.user_metadata?.oab || "123.456",
          tratamento: user.user_metadata?.tratamento || "Dra.",
          telefone: user.user_metadata?.telefone || "",
          assinatura_digital_url: user.user_metadata?.assinatura_digital_url || null,
          cpf_cnpj: "12.345.678/0001-90",
          endereco_profissional: "Av. Paulista, 1000, 16º andar, São Paulo/SP",
        };
      }

      if (activeLawyerProfile.nome && contratosPrintLawyerNameLabel) {
        contratosPrintLawyerNameLabel.textContent = `${activeLawyerProfile.tratamento || "Dr."} ${activeLawyerProfile.nome}`.toUpperCase();
      }

      if (activeLawyerProfile.assinatura_digital_url) {
        if (contratosPrintLawyerSigImg) {
          contratosPrintLawyerSigImg.src = activeLawyerProfile.assinatura_digital_url;
          contratosPrintLawyerSigImg.style.display = "block";
        }
        if (contratosPrintLawyerSigFallback) {
          contratosPrintLawyerSigFallback.style.display = "none";
        }
      } else {
        if (contratosPrintLawyerSigImg) {
          contratosPrintLawyerSigImg.style.display = "none";
        }
        if (contratosPrintLawyerSigFallback) {
          contratosPrintLawyerSigFallback.style.display = "block";
          contratosPrintLawyerSigFallback.textContent = "(Assinatura Pendente de Cadastro)";
        }
      }
    }
    
    if (contratosSelectedClienteId) {
      contratosClientSelect.value = contratosSelectedClienteId;
      triggerContratoClientSelected();
    } else {
      resetContratosPreview();
    }
  } catch (err) {
    console.error("Erro ao carregar clientes para contratos:", err);
    contratosClientSelect.innerHTML = '<option value="" disabled>Erro ao carregar clientes</option>';
  }
}

// --- LOGICA DE COBRANÇA RECORRENTE E MODAIS DE PAGAMENTO ---
function renderBoletoBarcode(container) {
  if (!container) return;
  container.innerHTML = "";
  const pattern = [3,1,2,4,1,3,2,1,4,2,3,1,2,1,4,3,2,1,4,1,3,2,1,4,2,3,1,2,1,4,3,2,1,4,1,3,2,1,4,2,3,1,2,1,4,3,2,1];
  pattern.forEach((w, i) => {
    const bar = document.createElement("div");
    bar.style.backgroundColor = "#000";
    bar.style.width = `${w}px`;
    bar.style.marginRight = `${(i % 3 === 0) ? w : 1}px`;
    container.appendChild(bar);
  });
}

async function loadContratosMensalidades(clienteId) {
  if (!clienteId) return;

  const client = contratosClientesList.find(c => c.id === clienteId);
  if (!client) return;

  // Mostra loading
  if (contratosBillingNoClient) contratosBillingNoClient.style.display = "none";
  if (contratosBillingEmpty) contratosBillingEmpty.style.display = "none";
  if (contratosBillingTableContainer) contratosBillingTableContainer.style.display = "none";
  if (contratosBillingLoading) contratosBillingLoading.style.display = "block";
  if (btnContratosRecarregarMensalidades) btnContratosRecarregarMensalidades.style.display = "inline-block";

  try {
    const { data, error } = await supabase
      .from("financeiro")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("data_vencimento", { ascending: false });

    if (error) throw error;

    const filtered = (data || [])
      .filter(item => item.tipo_honorario === "mensal")
      .map(item => {
        const date = new Date(item.data_vencimento + "T00:00:00");
        const mesStr = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        const competencia = mesStr.charAt(0).toUpperCase() + mesStr.slice(1);
        
        let status = item.status_pagamento;
        if (status === "pendente") {
          const venc = new Date(item.data_vencimento + "T00:00:00");
          const hoje = new Date();
          venc.setHours(0,0,0,0);
          hoje.setHours(0,0,0,0);
          if (venc < hoje) {
            status = "atrasado";
          }
        }

        return {
          competencia,
          valor: parseFloat(item.valor_total) || 0,
          vencimento: new Date(item.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR"),
          status: status,
          id_financeiro: item.id
        };
      });

    contratosMensalidadesList = filtered;

    if (contratosMensalidadesList.length === 0) {
      // Mock das mensalidades igual ao React
      const valorPadrao = client.valor_mensalidade || (contratosActivePlano === "mensal" ? 1500 : 15000);
      const diaPadrao = client.dia_vencimento || 5;

      contratosMensalidadesList = [
        {
          competencia: "Maio de 2026",
          valor: Number(valorPadrao),
          vencimento: `${diaPadrao.toString().padStart(2, "0")}/05/2026`,
          status: "pago"
        },
        {
          competencia: "Junho de 2026",
          valor: Number(valorPadrao),
          vencimento: `${diaPadrao.toString().padStart(2, "0")}/06/2026`,
          status: "pendente"
        },
        {
          competencia: "Julho de 2026",
          valor: Number(valorPadrao),
          vencimento: `${diaPadrao.toString().padStart(2, "0")}/07/2026`,
          status: "pendente"
        }
      ];
    }

    renderContratosMensalidadesTable(client);

  } catch (err) {
    console.error("Erro ao carregar mensalidades de contratos:", err);
  } finally {
    if (contratosBillingLoading) contratosBillingLoading.style.display = "none";
  }
}

function renderContratosMensalidadesTable(client) {
  if (!contratosBillingTableBody) return;
  contratosBillingTableBody.innerHTML = "";

  if (contratosMensalidadesList.length === 0) {
    if (contratosBillingEmpty) contratosBillingEmpty.style.display = "block";
    if (contratosBillingTableContainer) contratosBillingTableContainer.style.display = "none";
    return;
  }

  if (contratosBillingEmpty) contratosBillingEmpty.style.display = "none";
  if (contratosBillingTableContainer) contratosBillingTableContainer.style.display = "block";

  contratosMensalidadesList.forEach(m => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid var(--panel-border)";
    tr.style.transition = "background-color 0.2s";

    const tdComp = document.createElement("td");
    tdComp.style.padding = "10px 12px";
    tdComp.innerHTML = `
      <strong>${m.competencia}</strong>
      <span style="display: block; font-size: 8px; color: var(--text-secondary); margin-top: 2px;">Venc. ${m.vencimento}</span>
    `;

    const tdValor = document.createElement("td");
    tdValor.style.padding = "10px 12px";
    tdValor.style.textAlign = "right";
    tdValor.style.fontFamily = "monospace";
    tdValor.style.fontWeight = "bold";
    tdValor.innerText = m.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const tdStatus = document.createElement("td");
    tdStatus.style.padding = "10px 12px";
    tdStatus.style.textAlign = "center";
    
    let statusColor = "";
    let statusBg = "";

    if (m.status === "pago") {
      statusColor = "#10b981";
      statusBg = "rgba(16, 185, 129, 0.1)";
    } else if (m.status === "atrasado") {
      statusColor = "#ef4444";
      statusBg = "rgba(239, 68, 68, 0.1)";
    } else {
      statusColor = "#f59e0b";
      statusBg = "rgba(245, 158, 11, 0.1)";
    }

    tdStatus.innerHTML = `
      <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 8px; font-weight: 800; text-transform: uppercase; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${statusColor}22;">
        ${m.status === "pago" ? "Pago" : m.status === "atrasado" ? "Atrasado" : "Pendente"}
      </span>
    `;

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "10px 12px";
    tdAcoes.style.textAlign = "center";

    const actionsDiv = document.createElement("div");
    actionsDiv.style.display = "flex";
    actionsDiv.style.alignItems = "center";
    actionsDiv.style.justifyContent = "center";
    actionsDiv.style.gap = "6px";

    const btnBoleto = document.createElement("button");
    btnBoleto.type = "button";
    btnBoleto.innerText = "💵 Boleto";
    btnBoleto.style.background = "var(--input-bg)";
    btnBoleto.style.border = "1px solid var(--panel-border)";
    btnBoleto.style.color = "var(--text-primary)";
    btnBoleto.style.padding = "4px 8px";
    btnBoleto.style.borderRadius = "4px";
    btnBoleto.style.fontSize = "8px";
    btnBoleto.style.fontWeight = "bold";
    btnBoleto.style.textTransform = "uppercase";
    btnBoleto.style.cursor = "pointer";
    btnBoleto.addEventListener("click", () => {
      openBoletoModal(m, client);
    });

    const btnPix = document.createElement("button");
    btnPix.type = "button";
    btnPix.innerText = "⚡ PIX";
    btnPix.style.background = "rgba(197, 168, 92, 0.15)";
    btnPix.style.border = "1px solid var(--gold)";
    btnPix.style.color = "var(--gold)";
    btnPix.style.padding = "4px 8px";
    btnPix.style.borderRadius = "4px";
    btnPix.style.fontSize = "8px";
    btnPix.style.fontWeight = "bold";
    btnPix.style.textTransform = "uppercase";
    btnPix.style.cursor = "pointer";
    btnPix.addEventListener("click", () => {
      openPixModal(m);
    });

    actionsDiv.appendChild(btnBoleto);
    actionsDiv.appendChild(btnPix);
    tdAcoes.appendChild(actionsDiv);

    tr.appendChild(tdComp);
    tr.appendChild(tdValor);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAcoes);
    contratosBillingTableBody.appendChild(tr);
  });
}

function openBoletoModal(mensalidade, client) {
  activeMensalidadeSelecionada = mensalidade;
  if (!modalContratosBoleto) return;

  document.body.classList.add("printing-boleto");

  const dateParts = mensalidade.vencimento.split("/").reverse().join("-");
  const baseTime = new Date(dateParts).getTime().toString().slice(-4);
  const valorCentavos = mensalidade.valor.toFixed(2).replace(".", "");
  const linhaDigitavel = `34191.79001 01245.690008 12345.678901 9 ${baseTime}0000${valorCentavos}`;

  document.getElementById("boleto-linha-digitavel").textContent = linhaDigitavel;
  document.getElementById("boleto-preview-vencimento").textContent = mensalidade.vencimento;
  document.getElementById("boleto-preview-data-doc").textContent = new Date().toLocaleDateString("pt-BR");
  document.getElementById("boleto-preview-num-doc").textContent = `M-${mensalidade.competencia.replace(/ /g, "").replace("de", "")}`;
  document.getElementById("boleto-preview-valor-doc").textContent = mensalidade.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  document.getElementById("boleto-preview-valor-cobrado").textContent = mensalidade.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("boleto-preview-pagador-nome").textContent = client.nome;
  document.getElementById("boleto-preview-pagador-documento").textContent = `CPF/CNPJ: ${client.cpf_cnpj || "Não cadastrado"} — CEP: 01311-100`;
  document.getElementById("boleto-preview-pagador-endereco").textContent = `Endereço: ${client.endereco_completo || "Cadastrado no prontuário do cliente"}`;

  const barcodeContainer = document.getElementById("boleto-barcode-lines");
  renderBoletoBarcode(barcodeContainer);

  modalContratosBoleto.style.display = "flex";
}

function openPixModal(mensalidade) {
  activeMensalidadeSelecionada = mensalidade;
  if (!modalContratosPix) return;

  const code = `00020101021126580014br.gov.pix.0136nainaja@hotmail.com5204000053039865407${mensalidade.valor.toFixed(2)}5802BR5925JANAINA TARABAUCA ADVOGADOS6009SAO PAULO62070503***6304E8A3`;
  
  if (pixCopiaColaInput) pixCopiaColaInput.value = code;
  if (pixQrCodeImg) {
    pixQrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(code)}`;
  }

  modalContratosPix.style.display = "flex";
}

function triggerContratoClientSelected() {
  const cId = contratosClientSelect.value;
  contratosSelectedClienteId = cId;
  const client = contratosClientesList.find(c => c.id === cId);
  
  if (client) {
    contratosPreviewNome.textContent = client.nome;
    contratosPreviewDoc.textContent = client.cpf_cnpj || "Não cadastrado";
    contratosPreviewFatos.textContent = client.observacoes || "Nenhum relato de fatos cadastrado no prontuário.";
    contratosClientPreview.style.display = "block";
    
    btnContratosEsbocar.removeAttribute("disabled");
    btnContratosAtivarPlano.removeAttribute("disabled");
    if (btnContratosAtualizarValores) btnContratosAtualizarValores.removeAttribute("disabled");
    
    // Auto-preenche parâmetros do plano se o cliente já possui valores configurados
    if (client.valor_mensalidade) {
      contratosPlanoValor.value = parseFloat(client.valor_mensalidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    } else {
      contratosPlanoValor.value = contratosActivePlano === "mensal" ? "1.500,00" : "15.000,00";
    }
    if (client.dia_vencimento) {
      contratosPlanoRenovacao.value = client.dia_vencimento;
    } else {
      contratosPlanoRenovacao.value = "5";
    }

    // Carrega histórico de cobranças recorrentes
    loadContratosMensalidades(cId);

    // Limpa o rascunho anterior, botões de PDF e canvas de assinatura
    if (contratosMinutaTextarea) contratosMinutaTextarea.value = "";
    if (btnContratosPrintPreview) btnContratosPrintPreview.style.display = "none";
    if (btnContratosPrintSigned) btnContratosPrintSigned.style.display = "none";
    contratosSignatureDataUrl = null;
    
    if (contratosAssinaturaContainer) contratosAssinaturaContainer.style.display = "none";
    if (contratosCanvasSuccess) contratosCanvasSuccess.style.display = "none";
    if (contratosCanvasPad) {
      const ctx = contratosCanvasPad.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, contratosCanvasPad.width, contratosCanvasPad.height);
    }
    signaturePadHasDrawing = false;
  } else {
    resetContratosPreview();
  }
}

function resetContratosPreview() {
  contratosClientPreview.style.display = "none";
  btnContratosEsbocar.setAttribute("disabled", "true");
  btnContratosAtivarPlano.setAttribute("disabled", "true");
  if (btnContratosAtualizarValores) btnContratosAtualizarValores.setAttribute("disabled", "true");
  
  if (contratosBillingNoClient) contratosBillingNoClient.style.display = "block";
  if (contratosBillingEmpty) contratosBillingEmpty.style.display = "none";
  if (contratosBillingLoading) contratosBillingLoading.style.display = "none";
  if (contratosBillingTableContainer) contratosBillingTableContainer.style.display = "none";
  if (btnContratosRecarregarMensalidades) btnContratosRecarregarMensalidades.style.display = "none";

  if (btnContratosPrintPreview) btnContratosPrintPreview.style.display = "none";
  if (btnContratosPrintSigned) btnContratosPrintSigned.style.display = "none";
  contratosSignatureDataUrl = null;
  if (contratosMinutaTextarea) contratosMinutaTextarea.value = "";
  
  if (contratosAssinaturaContainer) contratosAssinaturaContainer.style.display = "none";
  if (contratosCanvasSuccess) contratosCanvasSuccess.style.display = "none";
  if (contratosCanvasPad) {
    const ctx = contratosCanvasPad.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, contratosCanvasPad.width, contratosCanvasPad.height);
  }
  signaturePadHasDrawing = false;
}

function generateContratosPromptText(client) {
  if (!client) return "";
  const fatos = client.observacoes || "Nenhum relato de fatos cadastrado no prontuário.";
  const area = client.areas_interesse || "Direito Médico / Geral";
  const docTipo = client.tipo_pessoa === "PJ"
    ? "Contrato de Assessoria Médica Preventiva e Auditoria Corporativa"
    : "Contrato de Prestação de Serviços de Defesa Médica Contenciosa";
  const nomeAdv = activeLawyerProfile?.nome || "Dra. Janaina Tarabauca";
  return `Você é o JUS IA, um assistente jurídico sênior e parecerista altamente qualificado.
Esboce um ${docTipo} personalizado com base nas informações do cliente a seguir:

DADOS CONTRATUAIS DE SUPORTE:
- Advogado Responsável: ${nomeAdv}
- Nome do Cliente: ${client.nome}
- Documento: ${client.cpf_cnpj || "Não cadastrado"}
- Área de Foco: ${area}

RELATO DE FATOS E NECESSIDADES DO PRONTUÁRIO:
"${fatos}"

DIRETRIZES DE REDAÇÃO CONTRATUAL:
1. Comece com um cabeçalho profissional e qualificação completa das partes.
2. Defina o Objeto do Contrato de forma clara, focando na defesa e conformidade exigida nos fatos.
3. Estabeleça Obrigações da Contratada (${nomeAdv}) e Obrigações do Contratante de acordo com o padrão ético da OAB.
4. Escreva uma cláusula de confidencialidade estrita (segredo de justiça e sigilo médico).
5. Defina o Foro de eleição competente para solucionar eventuais litígios.

Responda redigindo a estrutura completa do contrato em prosa jurídica formal e legível.`;
}

async function executeEsbocarContrato() {
  if (!contratosSelectedClienteId) return;
  const client = contratosClientesList.find(c => c.id === contratosSelectedClienteId);
  if (!client) return;
  
  try {
    btnContratosEsbocar.setAttribute("disabled", "true");
    contratosMinutaTextarea.style.display = "none";
    contratosMinutaLoading.style.display = "flex";
    btnContratosCopiar.style.display = "none";
    
    contratosMinutaLoadingStatus.textContent = `O motor ${contratosActiveMotor.toUpperCase()} está estruturando as qualificações e cláusulas contratuais...`;
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dataHoje = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    
    const docValor = contratosPlanoValor.value || "1.500,00";
    const docRenovacao = contratosPlanoRenovacao.value || "5";
    
    let minutaGerada = "";
    
    const area = (client.areas_interesse || "civil").toLowerCase();
    const fatosParte = client.observacoes || "Nenhum relato de fatos registrado no prontuário.";
    const nomeCliente = client.nome;
    const cnpjCpf = client.cpf_cnpj || "000.000.000-00";

    // 1. MAPEAMENTO DE TEMPLATES (Dicionário de Escopos)
    let tituloContrato = "";
    let qualificacaoContratante = "";
    let clausulaObjeto = "";
    let clausulaEspecifica = "";

    if (area.includes("trabalhista") || area.includes("trabalho")) {
      tituloContrato = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E CONSULTORIA TRABALHISTA";
      qualificacaoContratante = "trabalhador(a) / reclamante";
      clausulaObjeto = `O presente instrumento tem como objeto o patrocínio, representação judicial e defesa dos direitos trabalhistas da parte Contratante em face de seus antigos empregadores, incluindo reclamações trabalhistas e pedidos de verbas rescisórias, fundamentando-se especialmente nos fatos a seguir: ${fatosParte}`;
      
      // Extrair salário/valores e verbas dinamicamente sem usar valores fixos
      const matchSalario = fatosParte.match(/(salário|salario|R\$)\s*(\d+[\d\.,]*)/i);
      const matchVerbas = fatosParte.match(/(décimo|ferias|rescisórias|rescisao|fgts|horas extras)/i);
      const salario = matchSalario ? `com remuneração baseada em ${matchSalario[0]} ${matchSalario[2]}` : "com remuneração acordada na ficha funcional";
      const verbas = matchVerbas ? `abrangendo direitos de ${matchVerbas[0]}` : "abrangendo as verbas rescisórias e trabalhistas legais cabíveis";
      clausulaEspecifica = `\n\nCLÁUSULA ADICIONAL - DOS DIREITOS LABORAIS AVALIADOS:\nA contratada prestará assessoria técnica minuciosa para o cálculo e homologação das verbas contratuais informadas pelo cliente, ${salario}, ${verbas}, conforme os fatos narrados no cadastro.`;
    } else if (area.includes("empresarial") || area.includes("societário") || area.includes("societario")) {
      tituloContrato = "CONTRATO DE ASSESSORIA JURÍDICA E CONSULTORIA EMPRESARIAL";
      qualificacaoContratante = "sociedade empresária / contratante";
      clausulaObjeto = `O presente instrumento tem como objeto a prestação de serviços de consultoria jurídica empresarial, elaboração de contratos societários, proteção patrimonial e governança corporativa, baseando-se nos seguintes fatos: ${fatosParte}`;
      
      // Extrair sócios e cotas dinamicamente sem usar valores fixos (hardcoded)
      const matchSocios = fatosParte.match(/sócio[s]?\s+([^,\.\n]+)/i);
      const matchCotas = fatosParte.match(/(\d+[\d\.,]*%|\d+\s+cotas)/i);
      const socios = matchSocios ? matchSocios[1] : "qualificados em anexo";
      const cotas = matchCotas ? matchCotas[1] : "conforme participação societária";
      clausulaEspecifica = `\n\nCLÁUSULA ADICIONAL - DA ESTRUTURA SOCIETÁRIA:\nAs partes pactuam que o planejamento empresarial levará em conta a divisão de cotas no percentual aproximado de ${cotas}, sob responsabilidade e gestão dos sócios definidos como ${socios}, conforme delineado no contexto fático informado.`;
    } else if (area.includes("administrativo")) {
      tituloContrato = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS EM DIREITO ADMINISTRATIVO";
      qualificacaoContratante = "Contratante";
      clausulaObjeto = `O presente instrumento tem como objeto a prestação de serviços de assessoria em Direito Administrativo, com foco em análise jurídica de editais de licitação, recursos e impugnações administrativas, e defesa técnica baseada nos fatos descritos: ${fatosParte}`;
    } else if (area.includes("médico") || area.includes("medico") || area.includes("saúde") || area.includes("saude")) {
      tituloContrato = client.tipo_pessoa === "PJ"
        ? "CONTRATO DE ASSESSORIA JURÍDICA PREVENTIVA EM DIREITO MÉDICO"
        : "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS DE DEFESA MÉDICA";
      qualificacaoContratante = client.tipo_pessoa === "PJ" ? "Contratante" : "profissional da saúde";
      clausulaObjeto = client.tipo_pessoa === "PJ"
        ? `O presente instrumento tem como objeto a prestação de serviços de consultoria preventiva e auditoria em Direito Médico, abrangendo especificamente: auditoria de prontuários, relatórios de compliance regulatório com base no CFM e ANVISA, treinamento de corpo clínico e análise de riscos baseada nos fatos: ${fatosParte}`
        : `O presente instrumento tem como objeto o patrocínio e representação judicial da parte Contratante em ações de indenização por erro médico e processos administrativo-disciplinares junto ao CRM, fundamentando-se nos fatos: ${fatosParte}`;
    } else {
      // Civil / Padrão
      tituloContrato = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS";
      qualificacaoContratante = "Contratante";
      clausulaObjeto = `O presente instrumento tem como objeto a prestação de serviços advocatícios para representação e patrocínio dos interesses civis da parte Contratante, judicial ou extrajudicialmente, baseando-se nos fatos narrados: ${fatosParte}`;
    }

    const nomeAdv = activeLawyerProfile?.nome || "Janaina Tarabauca";
    const oabAdv = activeLawyerProfile?.oab || "123.456";
    const tratamentoAdv = activeLawyerProfile?.tratamento || "Dra.";
    const enderecoAdv = activeLawyerProfile?.endereco_profissional || "no escritório JT Advocacia";

    const definicaoContratante = `CONTRATANTE: ${nomeCliente.toUpperCase()}, na qualidade de ${qualificacaoContratante}, portador(a) do CPF/CNPJ sob o nº ${cnpjCpf}, residente, domiciliado(a) ou sediado(a) no endereço cadastrado.`;
    const definicaoContratada = `CONTRATADA: ${nomeAdv.toUpperCase()}, inscrita na OAB sob o nº ${oabAdv}, com endereço profissional ${enderecoAdv.startsWith("em ") || enderecoAdv.startsWith("no ") ? "" : "em "}${enderecoAdv}.`;

    minutaGerada = `${tituloContrato}

${definicaoContratante}

${definicaoContratada}

CLÁUSULA PRIMEIRA - DO OBJETO:
${clausulaObjeto}${clausulaEspecifica}

CLÁUSULA SEGUNDA - DA CONFIDENCIALIDADE:
As partes se comprometem a manter sigilo absoluto sobre todas as informações comerciais, operacionais ou técnicas de que venham a ter conhecimento em virtude deste contrato, sob pena de responsabilização civil e contratual.

CLÁUSULA TERCEIRA - DA VIGÊNCIA E RESCISÃO:
O contrato terá vigência de 12 (doze) meses a contar da data de início acordada, com renovação automática. A rescisão imotivada exigirá aviso prévio por escrito de 30 dias.

CLÁUSULA QUARTA - DOS HONORÁRIOS:
Pelos serviços preventivos contratados, o CONTRATANTE pagará à CONTRATADA o valor de R$ ${docValor} em caráter recorrente, via boleto bancário ou transferência, com vencimento todo dia ${docRenovacao} de cada mês.

Foro de Eleição: Fica eleito o foro da Comarca de São Paulo/SP para dirimir eventuais dúvidas.

São Paulo, ${dataHoje}.

__________________________________
${nomeCliente} (Contratante)

__________________________________
${tratamentoAdv} ${nomeAdv} (Contratada)`;
    
    contratosMinutaTextarea.value = minutaGerada;
    contratosMinutaTextarea.style.display = "block";
    btnContratosCopiar.style.display = "inline-block";
    
    // Exibir botões de impressão condicionalmente
    if (btnContratosPrintPreview) btnContratosPrintPreview.style.display = "inline-block";
    if (btnContratosPrintSigned) btnContratosPrintSigned.style.display = "none";
    contratosSignatureDataUrl = null;
    
    if (contratosAssinaturaContainer) contratosAssinaturaContainer.style.display = "flex";
    if (contratosCanvasSuccess) contratosCanvasSuccess.style.display = "none";
    if (contratosCanvasPad) {
      const ctx = contratosCanvasPad.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, contratosCanvasPad.width, contratosCanvasPad.height);
    }
    signaturePadHasDrawing = false;
    setTimeout(resizeContractsCanvas, 100);
  } catch (err) {
    console.error("Erro ao gerar minuta:", err);
    alert("Erro ao esboçar minuta com a IA: " + err.message);
  } finally {
    contratosMinutaLoading.style.display = "none";
    btnContratosEsbocar.removeAttribute("disabled");
  }
}

async function executeAtivarAssinatura() {
  if (!contratosSelectedClienteId) {
    alert("Selecione um cliente antes de ativar o plano.");
    return;
  }
  
  const client = contratosClientesList.find(c => c.id === contratosSelectedClienteId);
  if (!client) return;
  
  const valorStr = contratosPlanoValor.value.replace(/\./g, "").replace(",", ".");
  const valorFinal = parseFloat(valorStr);
  
  if (isNaN(valorFinal) || valorFinal <= 0) {
    alert("O valor da recorrência deve ser um número positivo.");
    return;
  }
  
  const inicioVigencia = contratosPlanoInicio.value;
  if (!inicioVigencia) {
    alert("Selecione a data de início da vigência do plano.");
    return;
  }
  
  const originalBtnText = btnContratosAtivarPlano.textContent;
  try {
    btnContratosAtivarPlano.setAttribute("disabled", "true");
    btnContratosAtivarPlano.textContent = "Ativando Plano...";
    
    const { error } = await supabase
      .from("financeiro")
      .insert({
        cliente_id: contratosSelectedClienteId,
        valor_total: valorFinal,
        tipo_honorario: "mensal",
        status_pagamento: "pendente",
        data_vencimento: inicioVigencia
      });
      
    if (error) throw error;
    
    const nomePlano = contratosActivePlano === "mensal" 
      ? "Assessoria Prontuário Médico (Mensal)" 
      : "Defesa Integral + Auditoria (Anual Premium)";
      
    alert(`✅ Assinatura "${nomePlano}" ativada para o cliente com sucesso!\n\nLançamento financeiro recorrente gerado automaticamente no valor de R$ ${valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} para vencimento em ${formatDataBr(inicioVigencia)}.`);
    
    if (typeof loadDashboardData === "function") loadDashboardData();
    if (typeof loadFinanceiroData === "function") loadFinanceiroData();
    loadContratosMensalidades(contratosSelectedClienteId);
  } catch (err) {
    console.error("Erro ao ativar plano de recorrência:", err);
    alert("Erro ao salvar assinatura recorrente: " + err.message);
  } finally {
    btnContratosAtivarPlano.removeAttribute("disabled");
    btnContratosAtivarPlano.textContent = originalBtnText;
  }
}

async function executeAtualizarValores() {
  if (!contratosSelectedClienteId) {
    alert("Selecione um cliente antes de atualizar os valores.");
    return;
  }
  const client = contratosClientesList.find(c => c.id === contratosSelectedClienteId);
  if (!client) return;

  const valorStr = contratosPlanoValor.value.replace(/\./g, "").replace(",", ".");
  const valorFinal = parseFloat(valorStr);
  const diaFinal = parseInt(contratosPlanoRenovacao.value);

  if (isNaN(valorFinal) || valorFinal <= 0) {
    alert("O valor da recorrência deve ser um número positivo.");
    return;
  }
  if (isNaN(diaFinal) || diaFinal < 1 || diaFinal > 31) {
    alert("O dia do vencimento deve ser entre 1 e 31.");
    return;
  }

  try {
    if (btnContratosAtualizarValores) {
      btnContratosAtualizarValores.setAttribute("disabled", "true");
      btnContratosAtualizarValores.textContent = "Salvando...";
    }

    const { error } = await supabase
      .from("clientes")
      .update({
        valor_mensalidade: valorFinal,
        dia_vencimento: diaFinal
      })
      .eq("id", contratosSelectedClienteId);

    if (error) throw error;

    // Atualiza localmente no cache de clientes
    client.valor_mensalidade = valorFinal;
    client.dia_vencimento = diaFinal;

    await loadContratosMensalidades(contratosSelectedClienteId);
    alert("✅ Parâmetros do plano atualizados com sucesso!");
  } catch (err) {
    console.error("Erro ao atualizar parâmetros:", err);
    alert("Erro ao salvar parâmetros: " + err.message);
  } finally {
    if (btnContratosAtualizarValores) {
      btnContratosAtualizarValores.removeAttribute("disabled");
      btnContratosAtualizarValores.textContent = "💾 Atualizar Valores";
    }
  }
}

function initContratosModule() {
  if (!viewContratos) return;
  
  if (contratosPlanoInicio) {
    contratosPlanoInicio.value = new Date().toISOString().split("T")[0];
  }
  
  if (btnContratosTabMinuta && btnContratosTabPlanos) {
    btnContratosTabMinuta.addEventListener("click", () => {
      contratosActiveTab = "minuta";
      btnContratosTabMinuta.classList.add("active");
      btnContratosTabMinuta.style.background = "var(--panel-bg)";
      btnContratosTabMinuta.style.color = "var(--text-primary)";
      
      btnContratosTabPlanos.classList.remove("active");
      btnContratosTabPlanos.style.background = "none";
      btnContratosTabPlanos.style.color = "var(--text-secondary)";
      
      contratosViewMinuta.style.display = "flex";
      contratosViewPlanos.style.display = "none";
    });
    
    btnContratosTabPlanos.addEventListener("click", () => {
      contratosActiveTab = "planos";
      btnContratosTabPlanos.classList.add("active");
      btnContratosTabPlanos.style.background = "var(--panel-bg)";
      btnContratosTabPlanos.style.color = "var(--text-primary)";
      
      btnContratosTabMinuta.classList.remove("active");
      btnContratosTabMinuta.style.background = "none";
      btnContratosTabMinuta.style.color = "var(--text-secondary)";
      
      contratosViewMinuta.style.display = "none";
      contratosViewPlanos.style.display = "flex";
    });
  }
  
  const btnMotors = document.querySelectorAll(".btn-motor");
  btnMotors.forEach(btn => {
    btn.addEventListener("click", () => {
      btnMotors.forEach(b => {
        b.classList.remove("active");
        b.style.background = "none";
        b.style.color = "var(--text-secondary)";
      });
      btn.classList.add("active");
      btn.style.background = "var(--gold)";
      btn.style.color = "var(--navy)";
      contratosActiveMotor = btn.getAttribute("data-motor");
    });
  });
  
  if (contratosClientSelect) {
    contratosClientSelect.addEventListener("change", triggerContratoClientSelected);
  }
  

  
  if (btnContratosEsbocar) {
    btnContratosEsbocar.addEventListener("click", executeEsbocarContrato);
  }
  
  if (btnContratosCopiar) {
    btnContratosCopiar.addEventListener("click", () => {
      const text = contratosMinutaTextarea.value;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        alert("📋 Minuta copiada para a área de transferência!");
      }).catch(err => {
        console.error("Erro ao copiar:", err);
      });
    });
  }
  
  if (btnPlanoMensal && btnPlanoAnual) {
    btnPlanoMensal.addEventListener("click", () => {
      contratosActivePlano = "mensal";
      btnPlanoMensal.classList.add("active");
      btnPlanoMensal.style.background = "rgba(197, 168, 92, 0.08)";
      btnPlanoMensal.style.borderColor = "var(--gold)";
      btnPlanoMensal.style.color = "var(--gold)";
      
      btnPlanoAnual.classList.remove("active");
      btnPlanoAnual.style.background = "rgba(0, 0, 0, 0.1)";
      btnPlanoAnual.style.borderColor = "var(--panel-border)";
      btnPlanoAnual.style.color = "var(--text-secondary)";
      
      contratosPlanoValor.value = "1.500,00";
      contratosPlanoRenovacao.value = "5";
    });
    
    btnPlanoAnual.addEventListener("click", () => {
      contratosActivePlano = "anual";
      btnPlanoAnual.classList.add("active");
      btnPlanoAnual.style.background = "rgba(197, 168, 92, 0.08)";
      btnPlanoAnual.style.borderColor = "var(--gold)";
      btnPlanoAnual.style.color = "var(--gold)";
      
      btnPlanoMensal.classList.remove("active");
      btnPlanoMensal.style.background = "rgba(0, 0, 0, 0.1)";
      btnPlanoMensal.style.borderColor = "var(--panel-border)";
      btnPlanoMensal.style.color = "var(--text-secondary)";
      
      contratosPlanoValor.value = "15.000,00";
      contratosPlanoRenovacao.value = "5";
    });
  }
  
  if (btnContratosAtivarPlano) {
    btnContratosAtivarPlano.addEventListener("click", executeAtivarAssinatura);
  }

  // Configurações do Quadro de Assinatura Eletrônica (Canvas)
  if (contratosCanvasPad) {
    const signaturePadCtx = contratosCanvasPad.getContext("2d");

    const getCoordinates = (e) => {
      const rect = contratosCanvasPad.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      signaturePadIsDrawing = true;
      signaturePadHasDrawing = true;
      const coords = getCoordinates(e);
      if (signaturePadCtx) {
        signaturePadCtx.strokeStyle = document.documentElement.getAttribute("data-theme") === "dark" ? "#d4af37" : "#0f1e36";
        signaturePadCtx.lineWidth = 3;
        signaturePadCtx.lineCap = "round";
        signaturePadCtx.beginPath();
        signaturePadCtx.moveTo(coords.x, coords.y);
      }
    };

    const drawLine = (e) => {
      if (!signaturePadIsDrawing) return;
      e.preventDefault();
      const coords = getCoordinates(e);
      if (signaturePadCtx) {
        signaturePadCtx.strokeStyle = document.documentElement.getAttribute("data-theme") === "dark" ? "#d4af37" : "#0f1e36";
        signaturePadCtx.lineTo(coords.x, coords.y);
        signaturePadCtx.stroke();
      }
    };

    const endDraw = () => {
      signaturePadIsDrawing = false;
    };

    contratosCanvasPad.addEventListener("mousedown", startDraw);
    contratosCanvasPad.addEventListener("mousemove", drawLine);
    contratosCanvasPad.addEventListener("mouseup", endDraw);
    contratosCanvasPad.addEventListener("mouseleave", endDraw);

    contratosCanvasPad.addEventListener("touchstart", startDraw);
    contratosCanvasPad.addEventListener("touchmove", drawLine);
    contratosCanvasPad.addEventListener("touchend", endDraw);
  }

  if (btnContratosLimpar) {
    btnContratosLimpar.addEventListener("click", () => {
      if (contratosCanvasPad) {
        const ctx = contratosCanvasPad.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, contratosCanvasPad.width, contratosCanvasPad.height);
      }
      signaturePadHasDrawing = false;
      contratosSignatureDataUrl = null;
      if (btnContratosPrintSigned) btnContratosPrintSigned.style.display = "none";
      if (contratosCanvasSuccess) contratosCanvasSuccess.style.display = "none";
    });
  }

  if (btnContratosConfirmar) {
    btnContratosConfirmar.addEventListener("click", () => {
      if (!signaturePadHasDrawing) {
        alert("Por favor, faça sua assinatura no quadro antes de confirmar.");
        return;
      }
      
      if (contratosCanvasPad) {
        contratosSignatureDataUrl = contratosCanvasPad.toDataURL("image/png");
      }
      
      if (btnContratosPrintSigned) btnContratosPrintSigned.style.display = "inline-block";
      if (contratosCanvasSuccess) contratosCanvasSuccess.style.display = "flex";
      alert("✅ Assinatura vinculada ao contrato com sucesso!");
    });
  }

  // Eventos de Impressão (Prévia e Assinado)
  if (btnContratosPrintPreview) {
    btnContratosPrintPreview.addEventListener("click", () => {
      const text = contratosMinutaTextarea.value;
      if (!text) return;
      
      if (contratosPrintPre) contratosPrintPre.textContent = text;
      
      if (contratosPrintWatermark && contratosPrintWatermarkText) {
        contratosPrintWatermark.style.display = "block";
        contratosPrintWatermark.style.borderColor = "var(--gold)";
        contratosPrintWatermark.style.background = "rgba(197, 168, 92, 0.03)";
        contratosPrintWatermarkText.textContent = "RASCUNHO / PRÉVIA DE MINUTA DE CONTRATO";
        contratosPrintWatermarkText.style.color = "var(--gold)";
      }
      
      if (contratosPrintSigImgContainer) contratosPrintSigImgContainer.style.display = "none";
      if (contratosPrintSigBlank) contratosPrintSigBlank.style.display = "block";
      if (contratosPrintSigTimestamp) contratosPrintSigTimestamp.style.display = "none";
      
      if (contratosPrintClientName) {
        const client = contratosClientesList.find(c => c.id === contratosSelectedClienteId);
        contratosPrintClientName.textContent = client ? client.nome : "CONTRATANTE";
      }
      
      window.print();
    });
  }

  if (btnContratosPrintSigned) {
    btnContratosPrintSigned.addEventListener("click", () => {
      const text = contratosMinutaTextarea.value;
      if (!text) return;
      
      if (contratosPrintPre) contratosPrintPre.textContent = text;
      
      if (contratosPrintWatermark && contratosPrintWatermarkText) {
        contratosPrintWatermark.style.display = "block";
        contratosPrintWatermark.style.borderColor = "var(--success-color)";
        contratosPrintWatermark.style.background = "rgba(16, 185, 129, 0.05)";
        contratosPrintWatermarkText.textContent = "CONTRATO ASSINADO ELETRONICAMENTE VIA PORTAL JT ADVOCACIA";
        contratosPrintWatermarkText.style.color = "var(--success-color)";
      }
      
      if (contratosPrintSigImgContainer) contratosPrintSigImgContainer.style.display = "flex";
      if (contratosPrintSigImg && contratosSignatureDataUrl) {
        contratosPrintSigImg.src = contratosSignatureDataUrl;
      }
      if (contratosPrintSigBlank) contratosPrintSigBlank.style.display = "none";
      
      if (contratosPrintSigTimestamp) {
        const now = new Date();
        const formatTime = now.toLocaleDateString("pt-BR") + " às " + now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
        contratosPrintSigTimestamp.textContent = `ASSINADO ELETRONICAMENTE EM ${formatTime} IP: 186.220.12.92 (HASH SHA256)`;
        contratosPrintSigTimestamp.style.display = "block";
      }
      
      if (contratosPrintClientName) {
        const client = contratosClientesList.find(c => c.id === contratosSelectedClienteId);
        contratosPrintClientName.textContent = client ? client.nome : "CONTRATANTE";
      }
      
      window.print();
    });
  }

  // EVENTOS DE COBRANÇA RECORRENTE E MODAIS
  if (btnContratosAtualizarValores) {
    btnContratosAtualizarValores.addEventListener("click", executeAtualizarValores);
  }

  if (btnContratosRecarregarMensalidades) {
    btnContratosRecarregarMensalidades.addEventListener("click", () => {
      loadContratosMensalidades(contratosSelectedClienteId);
    });
  }

  // Modais de Boleto
  if (btnCloseModalBoleto) {
    btnCloseModalBoleto.addEventListener("click", () => {
      document.body.classList.remove("printing-boleto");
      if (modalContratosBoleto) modalContratosBoleto.style.display = "none";
    });
  }
  if (btnCloseBoleto) {
    btnCloseBoleto.addEventListener("click", () => {
      document.body.classList.remove("printing-boleto");
      if (modalContratosBoleto) modalContratosBoleto.style.display = "none";
    });
  }
  if (btnPrintBoleto) {
    btnPrintBoleto.addEventListener("click", () => {
      window.print();
    });
  }

  // Modais de Pix
  if (btnCloseModalPix) {
    btnCloseModalPix.addEventListener("click", () => {
      if (modalContratosPix) modalContratosPix.style.display = "none";
    });
  }
  if (btnClosePix) {
    btnClosePix.addEventListener("click", () => {
      if (modalContratosPix) modalContratosPix.style.display = "none";
    });
  }
  if (btnPixCopiar && pixCopiaColaInput) {
    btnPixCopiar.addEventListener("click", () => {
      navigator.clipboard.writeText(pixCopiaColaInput.value).then(() => {
        alert("📋 Código PIX copiado com sucesso!");
      }).catch(err => {
        console.error("Erro ao copiar PIX:", err);
      });
    });
  }
}

// =========================================================================
// 📖 MÓDULO DE DOCUMENTAÇÃO E MANUAL DO ECOSSISTEMA
// =========================================================================
function initDocumentacaoModule() {
  const filterBtns = document.querySelectorAll(".doc-filter-btn");
  const tabBtns = document.querySelectorAll(".doc-tab-btn");
  const docSections = document.querySelectorAll(".doc-section");
  const docModulePanels = document.querySelectorAll(".doc-module-panel");

  // Filtros de Seção Superior
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Atualiza estado ativo nos botões
      filterBtns.forEach(b => {
        b.classList.remove("active");
        b.style.color = "var(--text-secondary)";
      });
      btn.classList.add("active");
      btn.style.color = "var(--text-primary)";

      // Filtra as seções
      const sec = btn.getAttribute("data-sec");
      docSections.forEach(section => {
        if (sec === "todos" || section.id === `doc-sec-${sec}`) {
          section.style.display = "block";
        } else {
          section.style.display = "none";
        }
      });
    });
  });

  // Sub-abas do Manual Operacional
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Atualiza estado ativo nos botões
      tabBtns.forEach(b => {
        b.classList.remove("active");
        b.style.borderBottomColor = "transparent";
        b.style.color = "var(--text-secondary)";
      });
      btn.classList.add("active");
      btn.style.borderBottomColor = "var(--gold)";
      btn.style.color = "var(--gold)";

      // Alterna os painéis
      const mod = btn.getAttribute("data-mod");
      docModulePanels.forEach(panel => {
        if (panel.id === `doc-mod-${mod}`) {
          panel.style.display = "grid";
        } else {
          panel.style.display = "none";
        }
      });
    });
  });
}

// =========================================================================
// INICIALIZAÇÃO DA CENTRAL DE CONHECIMENTO & BIBLIOTECA
// =========================================================================
function initBibliotecaModule() {
  const searchInput = document.getElementById("lib-search-input");
  const filterBtns = document.querySelectorAll(".lib-filter-btn");
  const libCards = document.querySelectorAll("#view-biblioteca .lib-card");
  const downloadBtns = document.querySelectorAll(".btn-download-lib");
  const printBtn = document.getElementById("btn-print-biblioteca");

  if (!libCards.length) return;

  let activeCat = "todos";
  let searchVal = "";

  function filterItems() {
    libCards.forEach(card => {
      const cat = card.getAttribute("data-category");
      const text = card.textContent.toLowerCase();
      const matchesCat = (activeCat === "todos" || cat === activeCat);
      const matchesSearch = text.includes(searchVal.toLowerCase());

      if (matchesCat && matchesSearch) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  // Evento de Busca
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchVal = e.target.value;
      filterItems();
    });
  }

  // Evento de Filtro de Categoria
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => {
        b.classList.remove("active");
        b.style.background = "transparent";
        b.style.color = "var(--text-secondary)";
        b.style.borderColor = "var(--panel-border)";
      });
      btn.classList.add("active");
      btn.style.background = "var(--panel-border)";
      btn.style.color = "var(--gold)";
      btn.style.borderColor = "transparent";

      activeCat = btn.getAttribute("data-category");
      filterItems();
    });
  });

  // Simulação de Download
  downloadBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const docTitle = btn.getAttribute("data-title");

      btn.textContent = "✓ Baixado";
      btn.style.background = "#10b981";
      btn.style.color = "#ffffff";
      btn.style.borderColor = "transparent";

      setTimeout(() => {
        btn.textContent = "⬇️ Download";
        btn.style.background = "var(--panel-bg)";
        btn.style.color = "var(--gold)";
        btn.style.borderColor = "rgba(212,175,55,0.3)";
      }, 2500);

      // Gera arquivo de simulação de download
      const docText = `DOCUMENTO JURÍDICO - JT ADVOGADOS ASSOCIADOS\n\nTEMPLATE: ${docTitle.toUpperCase()}\n\nEste modelo foi gerado em ambiente restrito para uso do escritório Janaina Tarabauca Advogados.`;
      const blob = new Blob([docText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });

  // Botão de Impressão
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }
}

// Chamar a inicialização ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  initFinanceiroFilters();
  initContratosModule();
  initLawyerSignatureCanvas();
  initDocumentacaoModule();
  initBibliotecaModule();
});
// Caso o DOMContentLoaded já tenha disparado, rodamos imediatamente
if (document.readyState === "complete" || document.readyState === "interactive") {
  initFinanceiroFilters();
  initContratosModule();
  initLawyerSignatureCanvas();
  initDocumentacaoModule();
  initBibliotecaModule();
}
