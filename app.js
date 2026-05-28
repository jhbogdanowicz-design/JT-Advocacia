// =========================================================================
// CONFIGURAÇÕES E INICIALIZAÇÃO DO SUPABASE
// =========================================================================
const SUPABASE_URL = "https://cuvhkusitvhygnqbdcyb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dmhrdXNpdHZoeWducWJkY3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTgwNzQsImV4cCI6MjA5NTQ5NDA3NH0.lAJDZpOBwIyqJWV3e96Xf0ntrctv0TWQLGtjEbPa9ao";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================================
// VARIÁVEIS DE ESTADO GLOBAL (SPA STATE)
// =========================================================================
let activeClientId = null; // Guarda o ID do cliente visualizado no momento

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

// Caixas de Feedback
const loginMessage = document.getElementById("login-message");
const signupMessage = document.getElementById("signup-message");

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

// Novos Modais e Elementos de Edição
const btnEditLawyerProfile = document.getElementById("btn-edit-lawyer-profile");
const modalEditLawyer = document.getElementById("modal-edit-lawyer");
const btnCloseModalLawyer = document.getElementById("btn-close-modal-lawyer");
const editLawyerForm = document.getElementById("edit-lawyer-form");
const editLawyerTreatment = document.getElementById("edit-lawyer-treatment");
const editLawyerName = document.getElementById("edit-lawyer-name");
const editLawyerOab = document.getElementById("edit-lawyer-oab");

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
// 🚀 ROTEAMENTO DE VISUALIZAÇÕES (SPA ROUTING)
// =========================================================================
function switchPublicView(viewName) {
  hideMessage(loginMessage);
  hideMessage(signupMessage);

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
  } else if (viewName === "signup") {
    landingContainer.style.display = "none";
    authContainer.style.display = "block";
    appLayout.style.display = "none";
    viewLogin.classList.remove("active");
    viewSignup.classList.add("active");
  }
}

function switchPrivateView(viewId) {
  if (viewId === "clientes") {
    showClientesPanel("list");
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
  localStorage.setItem("jt-theme", theme);
  
  const sunAuth = document.getElementById("theme-sun-auth");
  const moonAuth = document.getElementById("theme-moon-auth");
  const textAuth = document.getElementById("theme-text-auth");

  const sunInner = document.getElementById("theme-sun-inner");
  const moonInner = document.getElementById("theme-moon-inner");
  const textInner = document.getElementById("theme-text-inner");

  if (theme === "light") {
    if (sunAuth) sunAuth.style.display = "none";
    if (moonAuth) moonAuth.style.display = "block";
    if (textAuth) textAuth.innerText = "Modo Escuro";

    if (sunInner) sunInner.style.display = "none";
    if (moonInner) moonInner.style.display = "block";
    if (textInner) textInner.innerText = "Modo Escuro";
  } else {
    if (sunAuth) sunAuth.style.display = "block";
    if (moonAuth) moonAuth.style.display = "none";
    if (textAuth) textAuth.innerText = "Modo Claro";

    if (sunInner) sunInner.style.display = "block";
    if (moonInner) moonInner.style.display = "none";
    if (textInner) textInner.innerText = "Modo Claro";
  }
}

const savedTheme = localStorage.getItem("jt-theme") || "dark";
setTheme(savedTheme);

document.getElementById("theme-toggle-auth").addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

document.getElementById("theme-toggle-inner").addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

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
// 📝 CONTROLADOR: CADASTRO (REGISTRAR)
// =========================================================================
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage(signupMessage);

  const nome = signupName.value.trim();
  const tratamento = signupTreatment.value;
  const email = signupEmail.value.trim();
  const oab = signupOab.value.trim() || "Não Informado";
  const password = signupPassword.value;
  const passwordConfirm = signupPasswordConfirm.value;

  if (password.length < 6) {
    showMessage(signupMessage, "A senha deve ter no mínimo 6 caracteres.", "error");
    return;
  }

  if (password !== passwordConfirm) {
    showMessage(signupMessage, "A confirmação de senha não coincide com a senha digitada.", "error");
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
        }, 1500);
      } else {
        showMessage(signupMessage, "Conta pré-criada! Por favor, verifique seu e-mail para confirmar o cadastro.", "success");
        signupForm.reset();
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
btnLogout.addEventListener("click", async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erro ao deslogar:", error.message);
  } catch (err) {
    console.error("Erro inesperado no logout:", err);
  }
});

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
      .select("id")
      .gte("data_hora", monday.toISOString())
      .lte("data_hora", sunday.toISOString());

    if (commitmentsError) throw commitmentsError;
    const weeklyCommitmentsCount = commitments ? commitments.length : 0;
    metricEventsCount.innerText = weeklyCommitmentsCount;

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
  const faturamento = inRenda.value ? parseFloat(inRenda.value) : null;
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
async function loadClientesList(searchQuery = "") {
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
    if (error) throw error;

    if (clients && clients.length > 0) {
      listEmptyClientes.style.display = "none";
      gridListClientes.style.display = "grid";

      for (const c of clients) {
        const lastInteractionDate = await fetchLastInteractionDate(c.id);

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
  });
});

async function openClientDetailsById(clientId) {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) throw error;
    if (data) {
      openClientDetails(data);
    }
  } catch (err) {
    console.error(err);
    alert("Falha ao abrir ficha de perfil do cliente.");
  }
}

function openClientDetails(c) {
  showClientesPanel("detail");
  activeClientId = c.id; // Vincula o ID do cliente globalmente

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
  editInRenda.value = c.renda_faturamento || "";
  editInObservacoes.value = c.observacoes || "";

  // 3. Carregar Compromissos e Status (Seção 2)
  loadClientCommitmentsList();

  // 4. Carregar Processos Vinculados (Seção 3)
  loadClientProcessesList();
  
  // Reseta visualização de abas para a aba de Identificação
  profileTabButtons[0].click();
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
  const faturamento = editInRenda.value ? parseFloat(editInRenda.value) : null;
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
// Abertura do Modal de Novo Compromisso
btnNovoCompromisso.addEventListener("click", () => {
  modalCompromisso.style.display = "flex";
  compromissoForm.reset();
  
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
  const localLink = document.getElementById("comp-local-link").value.trim();
  const status = document.getElementById("comp-status").value;
  const anotacoes = document.getElementById("comp-anotacoes").value.trim();

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
          else if (item.tipo === "Reunião") reunioes++;
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
        else if (item.tipo === "Reunião") typeClass = "meeting";

        div.className = `timeline-item ${typeClass}`;

        const dt = new Date(item.data_hora);
        const formattedDate = dt.toLocaleDateString("pt-BR") + " às " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

        div.innerHTML = `
          <div class="timeline-dot"></div>
          <span class="timeline-time">${formattedDate}</span>
          <span class="timeline-title">${item.titulo}</span>
          <div class="timeline-meta">
            <span>Tipo: <strong>${item.tipo}</strong></span> | 
            <span>Local: <strong>${item.local_link || 'Não informado'}</strong></span> | 
            <span>Status: <strong style="color: ${item.status === 'Realizado' ? 'var(--success-color)' : (item.status === 'Cancelado' ? 'var(--error-color)' : 'var(--gold)')}">${item.status}</strong></span> | 
            <button type="button" class="btn-edit-comp-trigger" data-id="${item.id}" style="background: none; border: none; color: var(--gold); font-size: 11px; cursor: pointer; text-decoration: underline; font-weight: 600; padding: 0; vertical-align: middle; transition: color 0.2s;">Editar</button>
          </div>
          ${item.anotacoes_pos_evento ? `<p class="timeline-desc">${item.anotacoes_pos_evento}</p>` : ''}
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
  alert("O módulo completo de criação e vinculação de processos será implementado na próxima etapa!");
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

  } catch (err) {
    console.error("Erro ao buscar processos do cliente:", err.message);
  }
}

// Expansão do Modal do Processo com Timeline de Andamentos (JSONB)
function openProcessModalDetails(p) {
  activeProcessId = p.id;
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
    
    const userEmail = user.email;
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
btnEditLawyerProfile.addEventListener("click", async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Advogado não está autenticado.");

    editLawyerName.value = user.user_metadata?.nome || "";
    editLawyerOab.value = user.user_metadata?.oab || "";
    editLawyerTreatment.value = user.user_metadata?.tratamento || "Dr.";
    
    modalEditLawyer.style.display = "flex";
  } catch (err) {
    console.error("Erro ao carregar dados do advogado:", err.message);
    alert("Erro ao abrir formulário de edição de perfil.");
  }
});

editLawyerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const treatment = editLawyerTreatment.value;
  const name = editLawyerName.value.trim();
  const oab = editLawyerOab.value.trim();

  if (!name) {
    alert("O Nome é obrigatório.");
    return;
  }

  try {
    setLoadingState(document.getElementById("btn-save-lawyer-profile"), true, "Processando...");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sessão inválida.");

    // 1. Atualizar Supabase Auth
    const { error: authErr } = await supabase.auth.updateUser({
      data: { nome: name, oab: oab, tratamento: treatment }
    });
    if (authErr) throw authErr;

    // 2. Atualizar tabela public.advogados
    const { error: dbErr } = await supabase
      .from("advogados")
      .update({ nome: name, oab: oab, tratamento: treatment })
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
      editCompTipo.value = comp.tipo || "Reunião";
      
      if (comp.data_hora) {
        const dateObj = new Date(comp.data_hora);
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        editCompDataHora.value = dateObj.toISOString().slice(0, 16);
      } else {
        editCompDataHora.value = "";
      }

      editCompLocalLink.value = comp.local_link || "";
      editCompStatus.value = comp.status || "Agendado";
      editCompAnotacoes.value = comp.anotacoes_pos_evento || "";

      modalEditCompromisso.style.display = "flex";
    }
  } catch (err) {
    console.error("Erro ao buscar compromisso para edição:", err.message);
    alert("Não foi possível carregar os dados do compromisso.");
  }
});

editCompromissoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeCompromissoId) return;

  const titulo = editCompTitulo.value.trim();
  const tipo = editCompTipo.value;
  const dataHora = editCompDataHora.value;
  const localLink = editCompLocalLink.value.trim();
  const status = editCompStatus.value;
  const anotacoes = editCompAnotacoes.value.trim();

  if (!titulo || !dataHora) {
    alert("O Título e a Data/Hora são obrigatórios.");
    return;
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

btnHeroLogin.addEventListener("click", () => {
  switchPublicView("login");
});

linksGoLanding.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchPublicView("landing");
  });
});
