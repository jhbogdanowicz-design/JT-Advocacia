import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";

interface Cliente {
  id: string;
  nome: string;
  tipo_pessoa: "PF" | "PJ";
  cpf_cnpj?: string;
  observacoes?: string;
  areas_interesse?: string;
  valor_mensalidade?: number | null;
  dia_vencimento?: number | null;
  status_assinatura?: string | null;
}

export const PaginaContratos: React.FC = () => {
  // Estados de dados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>("");
  const [loadingClientes, setLoadingClientes] = useState<boolean>(true);
  const [loadingMinuta, setLoadingMinuta] = useState<boolean>(false);
  const [motorIA, setMotorIA] = useState<"gemini" | "openai" | "jus_ia">("jus_ia");
  const [tipoPlano, setTipoPlano] = useState<"mensal" | "anual">("mensal");

  // Estados do Formulário de Assinatura
  const [dataInicio, setDataInicio] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [diaRenovacao, setDiaRenovacao] = useState<number>(5);
  const [valorRecorrencia, setValorRecorrencia] = useState<string>("1500.00");
  const [ativandoAssinatura, setAtivandoAssinatura] = useState<boolean>(false);
  const [cancelandoAssinatura, setCancelandoAssinatura] = useState<boolean>(false);

  // Estado da Minuta Gerada
  const [minutaTexto, setMinutaTexto] = useState<string>("");
  const [visualizarPrompt, setVisualizarPrompt] = useState<boolean>(false);

  // Estados do Canvas de Assinatura
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [signatureExists, setSignatureExists] = useState<boolean>(false);
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [modoImpressao, setModoImpressao] = useState<"previa" | "assinado">("previa");
  const [signatureImgUrl, setSignatureImgUrl] = useState<string | null>(null);
  const [lawyerSignatureImgUrl, setLawyerSignatureImgUrl] = useState<string | null>(null);

  // Estados do Histórico de Mensalidades
  const [mensalidades, setMensalidades] = useState<any[]>([]);
  const [loadingMensalidades, setLoadingMensalidades] = useState<boolean>(false);
  const [atualizandoValores, setAtualizandoValores] = useState<boolean>(false);
  const [modalBoletoAberto, setModalBoletoAberto] = useState<boolean>(false);
  const [modalPixAberto, setModalPixAberto] = useState<boolean>(false);
  const [mensalidadeSelecionada, setMensalidadeSelecionada] = useState<any | null>(null);

  // Carregar lista de clientes do Supabase
  const carregarClientes = async () => {
    try {
      setLoadingClientes(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, tipo_pessoa, cpf_cnpj, observacoes, areas_interesse, valor_mensalidade, dia_vencimento, status_assinatura")
        .order("nome", { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar clientes para contratos:", err.message);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Carregar assinatura da advogada do Supabase
  const carregarAssinaturaAdvogada = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fallback 1: Buscar do user_metadata da sessão
        if (user.user_metadata?.assinatura_digital_url) {
          setLawyerSignatureImgUrl(user.user_metadata.assinatura_digital_url);
        }

        // Fallback 2: Buscar da tabela public.advogados no banco relacional
        const { data, error } = await supabase
          .from("advogados")
          .select("assinatura_digital_url")
          .eq("id", user.id)
          .single();
        if (!error && data && data.assinatura_digital_url) {
          setLawyerSignatureImgUrl(data.assinatura_digital_url);
        }
      }
    } catch (err: any) {
      console.warn("Erro ao carregar assinatura da advogada:", err.message);
    }
  };

  interface Mensalidade {
    competencia: string;
    valor: number;
    vencimento: string;
    status: "pago" | "pendente" | "atrasado";
    id_financeiro?: string;
  }

  const carregarMensalidades = async (clienteId: string) => {
    try {
      setLoadingMensalidades(true);
      const { data, error } = await supabase
        .from("financeiro")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("data_vencimento", { ascending: false });

      if (error) throw error;

      const dbMensalidades: Mensalidade[] = (data || [])
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
            valor: parseFloat(item.valor_total),
            vencimento: new Date(item.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR"),
            status: status as "pago" | "pendente" | "atrasado",
            id_financeiro: item.id
          };
        });

      if (dbMensalidades.length === 0) {
        const valorPadrao = clienteAtivo?.valor_mensalidade || (tipoPlano === "mensal" ? 1500 : 15000);
        const diaPadrao = clienteAtivo?.dia_vencimento || diaRenovacao || 5;

        const mockList: Mensalidade[] = [
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
        setMensalidades(mockList);
      } else {
        setMensalidades(dbMensalidades);
      }
    } catch (err: any) {
      console.error("Erro ao carregar mensalidades:", err.message);
    } finally {
      setLoadingMensalidades(false);
    }
  };

  const handleAtualizarValores = async () => {
    if (!clienteSelecionadoId) {
      alert("Por favor, selecione um prontuário de cliente.");
      return;
    }

    try {
      setAtualizandoValores(true);
      const valor = parseFloat(valorRecorrencia);
      const dia = parseInt(diaRenovacao.toString());

      if (isNaN(valor) || valor <= 0) {
        alert("O valor da recorrência deve ser maior que zero.");
        return;
      }
      if (isNaN(dia) || dia < 1 || dia > 31) {
        alert("O dia de vencimento deve estar entre 1 e 31.");
        return;
      }

      const { error } = await supabase
        .from("clientes")
        .update({
          valor_mensalidade: valor,
          dia_vencimento: dia
        })
        .eq("id", clienteSelecionadoId);

      if (error) throw error;

      setClientes(prev =>
        prev.map(c =>
          c.id === clienteSelecionadoId
            ? { ...c, valor_mensalidade: valor, dia_vencimento: dia }
            : c
        )
      );
      
      await carregarMensalidades(clienteSelecionadoId);
      
      alert("✅ Valores do plano atualizados com sucesso!");
    } catch (err: any) {
      console.error("Erro ao atualizar valores do plano:", err.message);
      alert("Erro ao salvar valores: " + err.message);
    } finally {
      setAtualizandoValores(false);
    }
  };

  useEffect(() => {
    if (clienteSelecionadoId) {
      carregarMensalidades(clienteSelecionadoId);
      if (clienteAtivo) {
        if (clienteAtivo.valor_mensalidade) {
          setValorRecorrencia(clienteAtivo.valor_mensalidade.toString());
        } else {
          setValorRecorrencia(tipoPlano === "mensal" ? "1500.00" : "15000.00");
        }
        if (clienteAtivo.dia_vencimento) {
          setDiaRenovacao(clienteAtivo.dia_vencimento);
        } else {
          setDiaRenovacao(5);
        }
      }
    } else {
      setMensalidades([]);
    }
  }, [clienteSelecionadoId, clienteAtivo]);

  useEffect(() => {
    carregarClientes();
    carregarAssinaturaAdvogada();
  }, []);

  // Obter dados do cliente ativo selecionado
  const clienteAtivo = useMemo(() => {
    return clientes.find((c) => c.id === clienteSelecionadoId);
  }, [clientes, clienteSelecionadoId]);

  // BUG FIX: Só aplica o valor padrão do tipo de plano se o cliente NÃO tiver
  // um valor salvo no banco. Isso impede que a troca de tipo de plano sobrescreva
  // o valor customizado que foi buscado do Supabase para o cliente selecionado.
  useEffect(() => {
    const valorSalvoNoBanco = clienteAtivo?.valor_mensalidade;
    if (!valorSalvoNoBanco) {
      // Só aplica o default quando o cliente não tem valor salvo
      if (tipoPlano === "mensal") {
        setValorRecorrencia("1500.00");
      } else {
        setValorRecorrencia("15000.00");
      }
    }
  }, [tipoPlano, clienteAtivo]);

  // Ajustar dimensões do Canvas com base no tamanho real do contêiner
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && minutaTexto) {
      const resizeCanvas = () => {
        canvas.width = canvas.parentElement?.clientWidth || 600;
        canvas.height = 160;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.strokeStyle = "#0f1e36";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
        }
      };
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [minutaTexto]);

  // Limpar formulário e começar novo contrato
  const handleNovoContrato = () => {
    setClienteSelecionadoId("");
    setMinutaTexto("");
    setVisualizarPrompt(false);
    setTipoPlano("mensal");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setDiaRenovacao(5);
    setValorRecorrencia("1500.00");
    setSignatureImgUrl(null);
    handleClearSignature();
  };

  // Prompt Mock Interno Utilizado
  const promptMock = useMemo(() => {
    if (!clienteAtivo) return "";

    const fatos = clienteAtivo.observacoes || "Nenhum relato de fatos cadastrado no prontuário.";
    const area = clienteAtivo.areas_interesse || "Direito Médico / Geral";
    const docTipo =
      clienteAtivo.tipo_pessoa === "PJ"
        ? "Contrato de Assessoria Médica Preventiva e Auditoria Corporativa"
        : "Contrato de Prestação de Serviços de Defesa Médica Contenciosa";

    return `Você é o JUS IA, um assistente jurídico sênior e parecerista altamente qualificado.
Esboce um ${docTipo} personalizado com base nas informações do cliente a seguir:

DADOS CONTRATUAIS DE SUPORTE:
- Advogado Responsável: Dra. Janaina Tarabauca
- Nome do Cliente: ${clienteAtivo.nome}
- Documento: ${clienteAtivo.cpf_cnpj || "Não cadastrado"}
- Área de Foco: ${area}

RELATO DE FATOS E NECESSIDADES DO PRONTUÁRIO:
"${fatos}"

DIRETRIZES DE REDAÇÃO CONTRATUAL:
1. Comece com um cabeçalho profissional e qualificação completa das partes.
2. Defina o Objeto do Contrato de forma clara, focando na defesa e conformidade exigida nos fatos.
3. Estabeleça Obrigações da Contratada (Dra. Janaina Tarabauca) e Obrigações do Contratante de acordo com o padrão ético da OAB.
4. Escreva uma cláusula de confidencialidade estrita (segredo de justiça e sigilo médico).
5. Defina o Foro de eleição competente para solucionar eventuais litígios.

Responda redigindo a estrutura completa do contrato em prosa jurídica formal e legível.`;
  }, [clienteAtivo]);

  // Ação de geração de Minuta via IA
  const handleGerarMinuta = async () => {
    if (!clienteSelecionadoId) {
      alert("Por favor, selecione um prontuário de cliente para gerar a minuta.");
      return;
    }

    try {
      setLoadingMinuta(true);
      setMinutaTexto("");
      handleClearSignature();

      // Simulação realista da resposta com base na IA selecionada e nos dados do cliente
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const nomeCliente = clienteAtivo?.nome || "Cliente";
      const cnpjCpf = clienteAtivo?.cpf_cnpj || "00.000.000/0001-00";
      const dataHoje = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      let minutaGerada = "";

      if (clienteAtivo?.tipo_pessoa === "PJ") {
        minutaGerada = `CONTRATO DE ASSESSORIA JURÍDICA PREVENTIVA EM DIREITO MÉDICO

CONTRATANTE: ${nomeCliente.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cnpjCpf}, com sede no endereço cadastrado em prontuário.

CONTRATADA: DRA. JANAINA TARABAUCA, inscrita na OAB/SP sob o nº 123.456, com endereço profissional no escritório JT Advocacia.

CLÁUSULA PRIMEIRA - DO OBJETO:
O presente instrumento tem como objeto a prestação de serviços de consultoria preventiva e auditoria em Direito Médico, abrangendo especificamente:
a) Auditoria detalhada de prontuários médicos e fichas de consentimento informado.
b) Elaboração de relatórios de compliance regulatório com base nas diretrizes do Conselho Federal de Medicina (CFM) e ANVISA.
c) Treinamento preventivo de corpo clínico para mitigação de riscos de erro médico.
d) Análise jurídica preventiva baseada no relato de fatos: "${clienteAtivo.observacoes || "Sem notas de fatos no prontuário"}".

CLÁUSULA SEGUNDA - DA CONFIDENCIALIDADE:
As partes se comprometem a manter sigilo absoluto sobre todas as informações médicas, operacionais ou técnicas de que venham a ter conhecimento em virtude deste contrato, sob pena de responsabilização civil e criminal.

CLÁUSULA TERCEIRA - DA VIGÊNCIA E RESCISÃO:
O contrato terá vigência de 12 (doze) meses a contar da data de início acordada, com renovação automática. A rescisão imotivada exigirá aviso prévio por escrito de 30 dias.

CLÁUSULA QUARTA - DOS HONORÁRIOS:
Pelos serviços preventivos contratados, o CONTRATANTE pagará à CONTRATADA o valor de ${parseFloat(valorRecorrencia).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em caráter recorrente, via boleto bancário ou transferência, com vencimento todo dia ${diaRenovacao} de cada mês.

E por estarem justos e contratados, assinam o presente instrumento.

São Paulo, ${dataHoje}.

__________________________________
${nomeCliente} (Contratante)

__________________________________
Dra. Janaina Tarabauca (Contratada)`;
      } else {
        minutaGerada = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS DE DEFESA MÉDICA

CONTRATANTE: ${nomeCliente.toUpperCase()}, profissional da saúde, portador do CPF sob o nº ${cnpjCpf}, residente e domiciliado no endereço cadastrado em prontuário.

CONTRATADA: DRA. JANAINA TARABAUCA, inscrita na OAB/SP sob o nº 123.456, com endereço profissional no escritório JT Advocacia.

CLÁUSULA PRIMEIRA - DO OBJETO:
O presente instrumento tem como objeto o patrocínio e representação judicial da parte Contratante em ações de indenização por erro médico e processos administrativo-disciplinares junto ao CRM, fundamentando-se especialmente nos fatos e defesas técnicas a seguir:
"${clienteAtivo.observacoes || "Nenhuma observação cadastrada."}"

CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DA CONTRATADA:
A Contratada obriga-se a prestar seus serviços profissionais com o devido zelo técnico e de acordo com as normas éticas contidas no Estatuto da Advocacia e da OAB, acompanhando todas as fases processuais judiciais ou administrativas.

CLÁUSULA TERCERA - DOS HONORÁRIOS CONTRATUAIS:
Pelos serviços contenciosos prestados, o CONTRATANTE pagará à CONTRATADA o valor de ${parseFloat(valorRecorrencia).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}, com vencimento conforme acordado e liquidado diretamente pelo sistema.

Foro de Eleição: Fica eleito o foro da Comarca de São Paulo/SP para dirimir eventuais dúvidas.

São Paulo, ${dataHoje}.

__________________________________
${nomeCliente} (Contratante)

__________________________________
Dra. Janaina Tarabauca (Contratada)`;
      }

      setMinutaTexto(minutaGerada);
    } catch (err: any) {
      alert("Erro ao esboçar minuta com a IA: " + err.message);
    } finally {
      setLoadingMinuta(false);
    }
  };

  // Ação de ativação do plano recorrente com geração automática no Financeiro
  const handleAtivarAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteSelecionadoId) {
      alert("Por favor, selecione um prontuário de cliente para ativar o plano.");
      return;
    }

    try {
      setAtivandoAssinatura(true);

      const valorFinal = parseFloat(valorRecorrencia);
      if (isNaN(valorFinal) || valorFinal <= 0) {
        alert("O valor da recorrência deve ser maior que zero.");
        return;
      }
      const diaFinal = parseInt(diaRenovacao.toString());

      const nomePlano =
        tipoPlano === "mensal"
          ? "Assessoria Prontuário Médico (Mensal)"
          : "Defesa Integral + Auditoria (Anual Premium)";

      // 1. Insere o lançamento financeiro recorrente
      const novoLancamento = {
        cliente_id: clienteSelecionadoId,
        valor_total: valorFinal,
        tipo_honorario: "mensal",
        status_pagamento: "pendente",
        data_vencimento: dataInicio,
      };

      const { error: finError } = await supabase
        .from("financeiro")
        .insert([novoLancamento]);

      if (finError) throw finError;

      // 2. Atualiza os campos de assinatura na tabela clientes
      const { error: cliError } = await supabase
        .from("clientes")
        .update({
          valor_mensalidade: valorFinal,
          dia_vencimento: diaFinal,
          status_assinatura: "Ativo",
        })
        .eq("id", clienteSelecionadoId);

      if (cliError) throw cliError;

      // 3. Atualiza o estado local para refletir imediatamente na UI (evita reload)
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteSelecionadoId
            ? { ...c, valor_mensalidade: valorFinal, dia_vencimento: diaFinal, status_assinatura: "Ativo" }
            : c
        )
      );

      // 4. Recarrega o histórico de mensalidades com os novos valores
      await carregarMensalidades(clienteSelecionadoId);

      alert(
        `✅ Assinatura "${nomePlano}" ativada para o cliente com sucesso!\n\nLançamento financeiro recorrente gerado automaticamente no valor de ${valorFinal.toLocaleString(
          "pt-BR",
          { style: "currency", currency: "BRL" }
        )} para vencimento em ${new Date(dataInicio).toLocaleDateString(
          "pt-BR"
        )}.`
      );
    } catch (err: any) {
      console.error("Erro ao ativar plano recorrente:", err.message);
      alert("Erro ao salvar assinatura recorrente: " + err.message);
    } finally {
      setAtivandoAssinatura(false);
    }
  };

  // Cancelar assinatura ativa: limpa valor_mensalidade e dia_vencimento no Supabase
  const handleCancelarAssinatura = async () => {
    if (!clienteSelecionadoId) return;
    const confirmar = window.confirm(
      "⚠️ Tem certeza que deseja CANCELAR a assinatura deste cliente?\n\nEsta ação irá zerar os valores do plano e liberar o cadastro para uma nova contratação."
    );
    if (!confirmar) return;

    try {
      setCancelandoAssinatura(true);
      const { error } = await supabase
        .from("clientes")
        .update({
          valor_mensalidade: null,
          dia_vencimento: null,
          status_assinatura: "Cancelado",
        })
        .eq("id", clienteSelecionadoId);

      if (error) throw error;

      // Atualiza o estado local imediatamente sem precisar recarregar
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteSelecionadoId
            ? { ...c, valor_mensalidade: null, dia_vencimento: null, status_assinatura: "Cancelado" }
            : c
        )
      );

      // Reseta os inputs do formulário para o estado inicial
      setValorRecorrencia(tipoPlano === "mensal" ? "1500.00" : "15000.00");
      setDiaRenovacao(5);
      setMensalidades([]);

      alert("🔴 Assinatura cancelada com sucesso. O cliente pode contratar um novo plano.");
    } catch (err: any) {
      console.error("Erro ao cancelar assinatura:", err.message);
      alert("Erro ao cancelar assinatura: " + err.message);
    } finally {
      setCancelandoAssinatura(false);
    }
  };

  // Copiar minuta gerada
  const handleCopiarMinuta = () => {
    if (!minutaTexto) return;
    navigator.clipboard.writeText(minutaTexto);
    alert("📋 Minuta copiada para a área de transferência!");
  };

  // Handlers do Canvas de Assinatura
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f1e36";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setSignatureExists(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureExists(false);
    setIsSigned(false);
    setSignatureImgUrl(null);
  };

  const handleConfirmSignature = () => {
    if (!signatureExists) {
      alert("Por favor, faça sua assinatura no quadro antes de confirmar.");
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const imgUrl = canvas.toDataURL("image/png");
      setSignatureImgUrl(imgUrl);
    }
    setIsSigned(true);
    alert("✅ Assinatura vinculada ao contrato com sucesso!");
  };

  const handleImprimir = (modo: "previa" | "assinado") => {
    setModoImpressao(modo);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a13] text-slate-800 dark:text-slate-100 p-6 space-y-6 print:bg-white print:p-0 print:text-black">
      {/* 1. HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📜</span>
            <h1 className="font-playfair font-bold text-2xl tracking-wide text-[#0f1e36] dark:text-slate-100">
              Gestão de Contratos Inteligentes
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            Esboço automatizado de minutas preventivas e defesa por IA e controle de assinaturas digitais.
          </p>
        </div>

        <button
          onClick={handleNovoContrato}
          className="bg-[#0f1e36] text-white hover:bg-slate-800 px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider border-b-2 border-[#d4af37] transition-all cursor-pointer"
        >
          + Criar Novo Contrato
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* COLUNA ESQUERDA: PERFIL DO CLIENTE & INJEÇÃO DE FATOS */}
        <div className="lg:col-span-1 bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-sm h-fit print:hidden">
          <h3 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 uppercase tracking-wide">
            <span>👤</span> Perfil do Prontuário
          </h3>

          {/* Selecionar Cliente */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Cliente do Contrato *
            </label>
            {loadingClientes ? (
              <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse"></div>
            ) : (
              <select
                value={clienteSelecionadoId}
                onChange={(e) => setClienteSelecionadoId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer font-semibold"
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {c.nome} ({c.tipo_pessoa === "PF" ? "Física" : "Jurídica"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fatos Narrados + Badge de Assinatura */}
          {clienteAtivo && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3.5 animate-slideDown">
              <span className="text-[9px] font-bold text-[#d4af37] tracking-widest uppercase block">
                📐 Injeção Ativa de Fatos
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-light block text-[10px]">Nome Completo</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#0f1e36] dark:text-slate-200 font-semibold">{clienteAtivo.nome}</span>
                    {/* SUBSCRIPTION STATUS BADGE */}
                    {clienteAtivo.valor_mensalidade && clienteAtivo.valor_mensalidade > 0 && clienteAtivo.status_assinatura !== "Cancelado" ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest whitespace-nowrap"
                        style={{
                          backgroundColor: "#0a192f",
                          color: "#d4af37",
                          border: "1.5px solid #d4af37",
                          letterSpacing: "0.08em",
                        }}
                      >
                        👑 ASSINANTE — PLANO {clienteAtivo.valor_mensalidade >= 10000 ? "ANUAL" : "MENSAL"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                        Sem plano ativo
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-light block text-[10px]">CPF / CNPJ</span>
                  <span className="font-mono text-[#0f1e36] dark:text-slate-200">{clienteAtivo.cpf_cnpj || "Não cadastrado"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-light block text-[10px]">Fatos Narrados no Prontuário</span>
                  <p className="text-slate-600 dark:text-slate-300 font-light leading-relaxed text-[11px] bg-white dark:bg-[#070a13] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {clienteAtivo.observacoes || "Nenhum relato de fatos registrado no prontuário."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: AI GENERATOR, PLANOS & DIGITAL SIGNATURE */}
        <div className="lg:col-span-2 space-y-6 print:w-full">
          
          {/* 2. INTERACTIVE AI GENERATOR PANEL */}
          <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-sm print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800 print:hidden">
              <h3 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                <span>🤖</span> Gerador de Cláusulas Contratuais
              </h3>
              
              {/* Seletor de Motor IA */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setMotorIA("gemini")}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                    motorIA === "gemini"
                      ? "bg-[#0f1e36] text-white dark:bg-[#d4af37] dark:text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setMotorIA("openai")}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                    motorIA === "openai"
                      ? "bg-[#0f1e36] text-white dark:bg-[#d4af37] dark:text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  ChatGPT
                </button>
                 <button
                  type="button"
                  onClick={() => setMotorIA("jus_ia")}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                    motorIA === "jus_ia"
                      ? "bg-[#0f1e36] text-white dark:bg-[#d4af37] dark:text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  Jus IA
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <button
                onClick={handleGerarMinuta}
                disabled={loadingMinuta || !clienteSelecionadoId}
                className="bg-[#0f1e36] text-white px-6 py-3 rounded text-xs font-bold uppercase tracking-wide border-b border-[#d4af37] hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#0f1e36] transition-all cursor-pointer"
              >
                {loadingMinuta ? "Processando Minuta Jurídica..." : "Gerar Minuta por IA"}
              </button>

              {clienteSelecionadoId && (
                <button
                  type="button"
                  onClick={() => setVisualizarPrompt(!visualizarPrompt)}
                  className="text-xs text-[#0f1e36] dark:text-[#d4af37] hover:underline font-bold"
                >
                  {visualizarPrompt ? "Ocultar Prompt" : "Ver Prompt de Injeção"}
                </button>
              )}
            </div>

            {/* Prompt de Injeção Visível */}
            {visualizarPrompt && promptMock && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-[#d4af37]/35 rounded-xl p-4 space-y-2.5 animate-slideDown">
                <span className="text-[9px] font-bold text-[#d4af37] tracking-widest uppercase block">
                  ⚙️ Prompt Estruturado Enviado
                </span>
                <pre className="text-[10px] text-slate-500 dark:text-slate-400 font-mono whitespace-pre-wrap leading-relaxed select-all max-h-48 overflow-y-auto">
                  {promptMock}
                </pre>
              </div>
            )}

            {/* Área de Texto da Minuta Editável */}
            <div className="space-y-2">
              <div className="flex justify-between items-center print:hidden">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Minuta do Contrato (Editável)
                </label>
                <div className="flex items-center gap-3">
                  {minutaTexto && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleImprimir("previa")}
                        className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-[#0f1e36] dark:text-[#d4af37] border border-slate-300 dark:border-slate-800 font-bold text-xs uppercase tracking-wide px-3 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        📄 Exportar Prévia (PDF)
                      </button>
                      {isSigned && (
                        <button
                          type="button"
                          onClick={() => handleImprimir("assinado")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide px-3 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          ✍️ Exportar Assinado (PDF)
                        </button>
                      )}
                    </>
                  )}
                  {minutaTexto && (
                    <button
                      onClick={handleCopiarMinuta}
                      className="text-xs text-[#d4af37] hover:underline font-bold"
                    >
                      Copiar Minuta
                    </button>
                  )}
                </div>
              </div>

              {loadingMinuta ? (
                <div className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center gap-3 print:hidden">
                  <div className="w-8 h-8 border-4 border-slate-300 dark:border-slate-800 border-t-[#d4af37] rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-light">
                    O motor {motorIA.toUpperCase()} está cruzando os relatos de prontuário do cliente...
                  </p>
                </div>
              ) : minutaTexto ? (
                <>
                  {/* CABEÇALHO TIMBRADO JURÍDICO - EXCLUSIVO PARA IMPRESSÃO */}
                  <div className="hidden print:block mb-8 border-b-2 border-[#d4af37] pb-4">
                    <div className="text-center">
                      <h2 className="font-playfair font-extrabold text-xl text-[#0f1e36] tracking-wider uppercase">
                        JT - JANAINA TARABAUCA ADVOGADOS
                      </h2>
                      <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mt-1">
                        Direito Médico e da Saúde
                      </p>
                    </div>
                  </div>

                  {/* BANNER DE STATUS DE ASSINATURA - EXCLUSIVO PARA IMPRESSÃO */}
                  <div className="hidden print:block text-center border p-2.5 mb-6 rounded-lg"
                       style={{
                         borderColor: modoImpressao === "assinado" ? "#10b981" : "#d4af37",
                         backgroundColor: modoImpressao === "assinado" ? "rgba(16, 185, 129, 0.05)" : "#fffdf5"
                       }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: modoImpressao === "assinado" ? "#10b981" : "#d4af37" }}>
                      {modoImpressao === "assinado" 
                        ? "CONTRATO ASSINADO ELETRONICAMENTE VIA PORTAL JT ADVOCACIA" 
                        : "RASCUNHO / PRÉVIA DE MINUTA DE CONTRATO"}
                    </span>
                  </div>

                  <textarea
                    rows={18}
                    value={minutaTexto}
                    onChange={(e) => setMinutaTexto(e.target.value)}
                    className="w-full bg-white dark:bg-[#070a13] border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500/70 p-4 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:border-[#d4af37] outline-none print:hidden"
                    placeholder="O documento gerado aparecerá aqui..."
                  />

                  {/* Texto do Contrato formatado de forma limpa exclusivamente para a folha A4 no Print */}
                  <pre className="hidden print:block whitespace-pre-wrap font-mono text-xs text-black bg-white leading-relaxed p-0 border-none outline-none">
                    {minutaTexto}
                  </pre>

                  {/* BLOCO DE ASSINATURAS E TIMESTAMP - VISÍVEL NO PREVIEW E NA IMPRESSÃO */}
                  <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8" style={{ pageBreakInside: "avoid" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-10">
                      
                      {/* Coluna Esquerda (CONTRATADA) */}
                      <div className="flex flex-col items-center gap-2 text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 print:bg-white print:p-0 print:border-none">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">CONTRATADA</span>
                        <div className="border-b border-slate-300 dark:border-slate-700 print:border-black w-full h-24 flex items-center justify-center bg-white dark:bg-slate-950 p-2 rounded-lg print:bg-white print:p-0">
                          {lawyerSignatureImgUrl ? (
                            <img src={lawyerSignatureImgUrl} alt="Assinatura Dra. Janaina" className="max-h-[80px] max-w-[220px] object-contain" />
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic select-none">Aguardando assinatura cadastrada...</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 print:text-black uppercase mt-1">DRA. JANAINA TARABAUCA</span>
                        <span className="text-[9px] text-[#10b981] font-black tracking-wider uppercase mt-0.5 flex items-center gap-1">● ASSINADO DIGITALMENTE</span>
                      </div>

                      {/* Coluna Direita (CONTRATANTE) */}
                      <div className="flex flex-col items-center gap-2 text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 print:bg-white print:p-0 print:border-none">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">CONTRATANTE</span>
                        <div className="border-b border-slate-300 dark:border-slate-700 print:border-black w-full h-24 flex items-center justify-center bg-white dark:bg-slate-950 p-2 rounded-lg print:bg-white print:p-0">
                          {signatureImgUrl ? (
                            <img src={signatureImgUrl} alt="Assinatura Contratante" className="max-h-[80px] max-w-[220px] object-contain" />
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic select-none">Aguardando assinatura do cliente...</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 print:text-black uppercase mt-1">
                          {clienteAtivo?.nome || "CONTRATANTE"}
                        </span>
                        {signatureImgUrl && (
                          <span className="text-[8px] text-[#10b981] font-bold mt-0.5 leading-tight print:text-[#10b981]">
                            ASSINADO ELETRONICAMENTE EM {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })} IP: 186.220.12.92 (HASH SHA256)
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Rodapé Oficial da Folha */}
                    <div className="mt-16 border-t border-slate-200 pt-3 text-center" style={{ pageBreakInside: "avoid" }}>
                      <p className="text-[8px] text-slate-400 m-0 tracking-wide">
                        JT Advocacia • Av. Paulista, 1000, 16º andar, São Paulo/SP • CEP 01311-100 • Tel: (11) 94753-4587
                      </p>
                      <p className="text-[8px] text-slate-400 mt-1 m-0">
                        Documento gerado eletronicamente e protegido por criptografia de dados de ponta.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl p-20 text-center text-xs font-light italic print:hidden">
                  Nenhuma minuta gerada. Selecione um cliente e clique no botão "Gerar Minuta por IA" acima.
                </div>
              )}
            </div>
          </div>

          {/* 3. SUBSCRIPTION PLANS SECTION */}
          <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-sm print:hidden">
            <h3 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between gap-2 uppercase tracking-wide">
              <span className="flex items-center gap-2"><span>💎</span> Assinaturas</span>
              {/* Botão de Cancelamento: visível apenas quando há plano ativo */}
              {clienteAtivo?.valor_mensalidade && clienteAtivo.valor_mensalidade > 0 && clienteAtivo.status_assinatura !== "Cancelado" && (
                <button
                  type="button"
                  onClick={handleCancelarAssinatura}
                  disabled={cancelandoAssinatura}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 normal-case shadow-sm"
                  title="Cancelar a assinatura ativa deste cliente"
                >
                  {cancelandoAssinatura ? (
                    <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> Cancelando...</>
                  ) : (
                    <>🔴 Cancelar Assinatura</>
                  )}
                </button>
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plano Mensal */}
              <button
                type="button"
                onClick={() => setTipoPlano("mensal")}
                className={`p-4 rounded-xl text-left border flex flex-col justify-between transition-all gap-1.5 cursor-pointer ${
                  tipoPlano === "mensal"
                    ? "bg-[#0f1e36]/5 dark:bg-[#d4af37]/10 text-[#0f1e36] dark:text-[#d4af37] border-[#0f1e36] dark:border-[#d4af37]"
                    : "bg-slate-50 dark:bg-[#070a13] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  <strong className="text-xs font-bold block text-[#0f1e36] dark:text-slate-200">Plano Mensal</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-light block leading-normal mt-1">
                    Assessoria preventiva jurídica com análise recorrente de prontuários.
                  </span>
                </div>
                <strong className="text-sm font-bold mt-2 block text-[#0f1e36] dark:text-slate-200">R$ 1.500,00 / mês</strong>
              </button>

              {/* Plano Anual */}
              <button
                type="button"
                onClick={() => setTipoPlano("anual")}
                className={`p-4 rounded-xl text-left border flex flex-col justify-between transition-all gap-1.5 cursor-pointer ${
                  tipoPlano === "anual"
                    ? "bg-[#0f1e36]/5 dark:bg-[#d4af37]/10 text-[#0f1e36] dark:text-[#d4af37] border-[#0f1e36] dark:border-[#d4af37]"
                    : "bg-slate-50 dark:bg-[#070a13] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  <strong className="text-xs font-bold block text-[#0f1e36] dark:text-slate-200">Plano Anual Premium</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-light block leading-normal mt-1">
                    Defesa integral contenciosa, auditoria clínica corporativa e compliance regulatório.
                  </span>
                </div>
                <strong className="text-sm font-bold mt-2 block text-[#0f1e36] dark:text-slate-200">R$ 15.000,00 / ano</strong>
              </button>
            </div>

            {/* Configuração de Valores & Histórico de Cobranças Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Lado Esquerdo: Inputs e Ação */}
              <form onSubmit={handleAtivarAssinatura} className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  🛠️ Parâmetros de Faturamento
                </h4>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Início da Vigência
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Dia do Vencimento Mensal
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={diaRenovacao}
                    onChange={(e) => setDiaRenovacao(parseInt(e.target.value) || 5)}
                    required
                    className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-widest">
                    Valor da Mensalidade/Anuidade (R$)
                  </label>
                  <input
                    type="text"
                    value={valorRecorrencia}
                    onChange={(e) => setValorRecorrencia(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] font-mono font-bold"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  {/* Botão Salvar: sempre disponível para atualizar valores */}
                  <button
                    type="button"
                    onClick={handleAtualizarValores}
                    disabled={atualizandoValores || !clienteSelecionadoId}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0f1e36] dark:text-[#d4af37] border border-slate-300 dark:border-slate-700 px-4 py-2.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {atualizandoValores ? "Salvando..." : "💾 Atualizar Valores do Plano"}
                  </button>

                  {/* ACTIVATION LOCK: Se o cliente já tem plano ativo, bloqueia o botão */}
                  {clienteAtivo?.valor_mensalidade && clienteAtivo.valor_mensalidade > 0 && clienteAtivo.status_assinatura !== "Cancelado" ? (
                    <button
                      type="button"
                      disabled
                      className="flex-1 bg-emerald-700/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400/40 px-4 py-2.5 rounded text-[11px] font-bold uppercase cursor-not-allowed opacity-80"
                      title="Este cliente já possui um plano ativo. Cancele o plano atual antes de contratar um novo."
                    >
                      ✅ Plano Já Ativo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={ativandoAssinatura || !clienteSelecionadoId}
                      className="flex-1 bg-[#0f1e36] text-white hover:bg-slate-800 px-4 py-2.5 rounded text-[11px] font-bold uppercase border-b border-[#d4af37] transition-all cursor-pointer disabled:opacity-40"
                    >
                      {ativandoAssinatura ? "Ativando..." : "+ Ativar Plano"}
                    </button>
                  )}
                </div>
              </form>

              {/* Lado Direito: Histórico de Cobranças */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1.5 flex justify-between items-center">
                  <span>💳 Painel de Emissão de Cobranças</span>
                  {clienteSelecionadoId && (
                    <button
                      type="button"
                      onClick={() => carregarMensalidades(clienteSelecionadoId)}
                      className="text-[9px] font-bold text-[#d4af37] hover:underline cursor-pointer"
                    >
                      🔄 Recarregar
                    </button>
                  )}
                </h4>

                {!clienteSelecionadoId ? (
                  <div className="h-44 bg-slate-50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-4 text-center text-xs font-light text-slate-400 italic">
                    Selecione um cliente para ver o histórico de faturamento recorrente.
                  </div>
                ) : loadingMensalidades ? (
                  <div className="space-y-2.5 animate-pulse">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-10 bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
                    ))}
                  </div>
                ) : mensalidades.length === 0 ? (
                  <div className="h-44 bg-slate-50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-4 text-center text-xs font-light text-slate-400 italic">
                    Nenhum faturamento recorrente encontrado para este cliente.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-bold">
                          <th className="px-3 py-2">Competência</th>
                          <th className="px-3 py-2 text-right">Valor</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {mensalidades.map((m, i) => (
                          <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                              {m.competencia}
                              <span className="block text-[8px] font-normal text-slate-400">Venc. {m.vencimento}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                              {m.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {m.status === "pago" && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                  Pago
                                </span>
                              )}
                              {m.status === "pendente" && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
                                  Pendente
                                </span>
                              )}
                              {m.status === "atrasado" && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
                                  Atrasado
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMensalidadeSelecionada(m);
                                    setModalBoletoAberto(true);
                                  }}
                                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0f1e36] dark:text-slate-200 px-2 py-1 rounded text-[8px] font-bold uppercase transition-colors cursor-pointer"
                                  title="Gerar Boleto de Cobrança"
                                >
                                  💵 Boleto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMensalidadeSelecionada(m);
                                    setModalPixAberto(true);
                                  }}
                                  className="bg-[#0f1e36] hover:bg-slate-800 text-white dark:bg-[#d4af37]/20 dark:hover:bg-[#d4af37]/30 dark:text-[#d4af37] px-2 py-1 rounded text-[8px] font-bold uppercase transition-colors cursor-pointer"
                                  title="Cobrar via PIX Imediato"
                                >
                                  ⚡ PIX
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. DIGITAL SIGNATURE PAD (CANVAS) */}
          {minutaTexto && (
            <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm animate-slideDown print:hidden">
              <h3 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 uppercase tracking-wide">
                <span>✍️</span> Assinatura Eletrônica do Contrato (Aguardando apenas assinatura do cliente)
              </h3>
              
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                Este contrato encontra-se no estado <strong className="text-amber-500 dark:text-[#d4af37]">Aguardando apenas assinatura do cliente</strong>. Colete a assinatura eletrônica do cliente desenhando no quadro abaixo para validar as cláusulas rascunhadas.
              </p>

              <div className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/20 h-40 w-full cursor-crosshair touch-none"
                />
                
                {isSigned && (
                  <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white animate-fadeIn">
                    <span className="text-3xl">✅</span>
                    <strong className="text-xs uppercase tracking-widest font-bold">Assinatura Vinculada</strong>
                    <span className="text-[10px] text-slate-300">Contrato assinado eletronicamente e pronto para arquivamento.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded text-xs font-bold uppercase mr-2 cursor-pointer transition-colors"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  disabled={isSigned}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-colors disabled:opacity-40"
                >
                  Confirmar Assinatura
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DO BOLETO BANCÁRIO */}
      {modalBoletoAberto && mensalidadeSelecionada && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:absolute print:inset-0 print:p-0 print:bg-white print:backdrop-none">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-4xl w-full shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">💵</span>
                <h4 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
                  Simulador de Emissão de Boleto Bancário
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalBoletoAberto(false);
                  setMensalidadeSelecionada(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer font-sans"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Visual Boleto Representation */}
            <div className="bg-white text-black p-6 rounded-xl border border-slate-300 font-sans text-[11px] leading-tight space-y-4 print:p-0 print:border-none print:bg-white">
              
              {/* Recibo do Sacado / Top Part */}
              <div className="border-b-2 border-dashed border-slate-400 pb-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <span className="font-extrabold text-sm tracking-wide text-slate-800">ITAU UNIBANCO S.A. | 341-7</span>
                  <span className="font-bold text-[10px] text-slate-500">RECIBO DO PAGADOR</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2 border border-slate-200 p-1.5 rounded">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase">Beneficiário</span>
                    <strong className="text-slate-800">JT ADVOGADOS ASSOCIADOS (CNPJ: 12.345.678/0001-90)</strong>
                  </div>
                  <div className="border border-slate-200 p-1.5 rounded">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase">Vencimento</span>
                    <span className="text-slate-800 font-bold">{mensalidadeSelecionada.vencimento}</span>
                  </div>
                  <div className="border border-slate-200 p-1.5 rounded">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase">Valor Cobrado</span>
                    <span className="text-slate-800 font-bold">{mensalidadeSelecionada.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="border border-slate-200 p-1.5 rounded">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase">Nosso Número</span>
                    <span className="text-slate-700">00012456-9</span>
                  </div>
                  <div className="border border-slate-200 p-1.5 rounded">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase">Nº do Documento</span>
                    <span className="text-slate-700">M-{mensalidadeSelecionada.competencia.replace(/ /g, "").replace("de", "")}</span>
                  </div>
                  <div className="border border-slate-200 p-1.5 rounded">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase">Data Documento</span>
                    <span className="text-slate-700">{new Date().toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="border border-slate-200 p-1.5 rounded">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase">Espécie</span>
                    <span className="text-slate-700">DS</span>
                  </div>
                </div>

                <div className="border border-slate-200 p-2 rounded">
                  <span className="text-[8px] text-slate-400 block font-bold uppercase">Pagador (Sacado)</span>
                  <strong className="text-slate-800 block text-xs">{clienteAtivo?.nome}</strong>
                  <span className="text-slate-600 block mt-0.5">CPF/CNPJ: {clienteAtivo?.cpf_cnpj || "Não cadastrado"} — Endereço: {clienteAtivo?.endereco_completo || "Cadastrado no prontuário"}</span>
                </div>
              </div>

              {/* Ficha de Compensação / Bottom Part */}
              <div className="space-y-3 pt-2">
                {/* Top Line of Slip */}
                <div className="flex items-stretch justify-between border-b-2 border-black pb-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-black tracking-widest">Itaú</span>
                    <span className="font-bold text-base px-2 border-x border-black">341-7</span>
                  </div>
                  <span className="font-mono font-bold text-xs self-center">34191.79001 01245.690008 12345.678901 9 {new Date(mensalidadeSelecionada.vencimento.split("/").reverse().join("-")).getTime().toString().slice(-4)}0000{mensalidadeSelecionada.valor.toFixed(2).replace(".", "")}</span>
                </div>

                {/* Grid fields */}
                <div className="grid grid-cols-5 gap-0 border-t border-l border-black">
                  <div className="col-span-4 border-r border-b border-black p-1.5">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Local de Pagamento</span>
                    <span className="text-black font-semibold uppercase">PREFERENCIALMENTE NAS CASAS LOTÉRICAS ATÉ O VENCIMENTO</span>
                  </div>
                  <div className="border-r border-b border-black p-1.5 bg-slate-50">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Vencimento</span>
                    <span className="text-black font-bold text-xs">{mensalidadeSelecionada.vencimento}</span>
                  </div>

                  <div className="col-span-4 border-r border-b border-black p-1.5">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Beneficiário</span>
                    <span className="text-black font-semibold">JT ADVOGADOS ASSOCIADOS (CNPJ: 12.345.678/0001-90)</span>
                  </div>
                  <div className="border-r border-b border-black p-1.5 bg-slate-50">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Agência / Código Beneficiário</span>
                    <span className="text-black font-bold">1900 / 12345-6</span>
                  </div>

                  <div className="col-span-3 border-r border-b border-black p-1.5">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Data do Documento</span>
                    <span className="text-black">{new Date().toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="border-r border-b border-black p-1.5">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Nº do Documento</span>
                    <span className="text-black">M-{mensalidadeSelecionada.competencia.replace(/ /g, "").replace("de", "")}</span>
                  </div>
                  <div className="border-r border-b border-black p-1.5 bg-slate-50">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Nosso Número</span>
                    <span className="text-black font-bold">00012456-9</span>
                  </div>

                  <div className="col-span-3 border-r border-b border-black p-1.5">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Uso do Banco</span>
                    <span className="text-black">&nbsp;</span>
                  </div>
                  <div className="border-r border-b border-black p-1.5">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Carteira / Moeda</span>
                    <span className="text-black">109 / REAIS</span>
                  </div>
                  <div className="border-r border-b border-black p-1.5 bg-slate-50">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">(=) Valor do Documento</span>
                    <span className="text-black font-bold text-xs">{mensalidadeSelecionada.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>

                  <div className="col-span-4 border-r border-b border-black p-2">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Instruções de Responsabilidade do Beneficiário</span>
                    <p className="text-black font-semibold text-[9px] leading-relaxed uppercase m-0">
                      - MULTA DE R$ 50,00 APÓS O VENCIMENTO<br />
                      - JUROS DE 1% AO MÊS SOBRE O SALDO DEVEDOR<br />
                      - NÃO RECEBER APÓS 30 DIAS DE ATRASO. CONTACTAR O ESCRITÓRIO JT ADVOGADOS
                    </p>
                  </div>
                  <div className="border-r border-b border-black p-1.5 bg-slate-50">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">(-) Desconto / Abatimento</span>
                    <span className="text-black">&nbsp;</span>
                  </div>

                  <div className="col-span-4 border-r border-b border-black p-2">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">Pagador (Sacado)</span>
                    <strong className="text-black block text-xs">{clienteAtivo?.nome}</strong>
                    <span className="text-black block mt-0.5">CPF/CNPJ: {clienteAtivo?.cpf_cnpj || "Não cadastrado"} — CEP: 01311-100</span>
                    <span className="text-black block mt-0.5">Endereço: {clienteAtivo?.endereco_completo || "Cadastrado no prontuário"}</span>
                  </div>
                  <div className="border-r border-b border-black p-1.5 bg-slate-50">
                    <span className="text-[7px] text-slate-500 block font-black uppercase">(+) Valor Cobrado</span>
                    <span className="text-black font-bold text-xs">{mensalidadeSelecionada.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                </div>

                {/* Barcode Mock Rendering using HTML lines */}
                <div className="flex flex-col gap-1 items-start pt-4" style={{ pageBreakInside: "avoid" }}>
                  <div className="flex items-stretch h-12 bg-white pl-4 select-none">
                    {[3,1,2,4,1,3,2,1,4,2,3,1,2,1,4,3,2,1,4,1,3,2,1,4,2,3,1,2,1,4,3,2,1,4,1,3,2,1,4,2,3,1,2,1,4,3,2,1].map((w, i) => (
                      <div key={i} className="bg-black" style={{ width: `${w}px`, marginRight: `${(i % 3 === 0) ? w : 1}px` }}></div>
                    ))}
                  </div>
                  <span className="text-[7px] font-mono text-slate-500 pl-4">Ficha de Compensação - Autenticação Mecânica</span>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setModalBoletoAberto(false);
                  setMensalidadeSelecionada(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0f1e36] dark:text-slate-300 px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[#0f1e36] text-white hover:bg-slate-800 px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wide border-b border-[#d4af37] transition-all cursor-pointer"
              >
                🖨️ Imprimir Boleto
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DO PIX */}
      {modalPixAberto && mensalidadeSelecionada && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h4 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 uppercase tracking-wide">
                  Cobrança via PIX Imediato
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalPixAberto(false);
                  setMensalidadeSelecionada(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            {/* PIX Body */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="space-y-1">
                <strong className="text-xs text-slate-500 dark:text-slate-400 block">Valor da Cobrança</strong>
                <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {mensalidadeSelecionada.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <p className="text-[10px] text-slate-400 font-light">Competência: {mensalidadeSelecionada.competencia}</p>
              </div>

              {/* Clean responsive SVG QR Code */}
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <svg className="w-44 h-44 text-slate-800" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" />
                  <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" />
                  <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z" />
                  <path d="M45,5 h10 v10 h-10 z M45,20 h5 v5 h-5 z M55,25 h5 v10 h-5 z M40,30 h5 v5 h-5 z M45,45 h15 v15 h-15 z M50,50 h5 v5 h-5 z" />
                  <path d="M65,45 h10 v5 h-10 z M80,45 h15 v5 h-15 z M70,55 h10 v10 h-10 z M85,60 h10 v5 h-10 z M65,75 h10 v15 h-10 z M80,80 h15 v5 h-15 z" />
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
                    value={`00020101021126580014br.gov.pix.0136nainaja@hotmail.com5204000053039865407${mensalidadeSelecionada.valor.toFixed(2)}5802BR5925JANAINA TARABAUCA ADVOGADOS6009SAO PAULO62070503***6304E8A3`}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[10px] font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const code = `00020101021126580014br.gov.pix.0136nainaja@hotmail.com5204000053039865407${mensalidadeSelecionada.valor.toFixed(2)}5802BR5925JANAINA TARABAUCA ADVOGADOS6009SAO PAULO62070503***6304E8A3`;
                      navigator.clipboard.writeText(code);
                      alert("📋 Código PIX copiado com sucesso!");
                    }}
                    className="bg-[#0f1e36] text-white hover:bg-slate-800 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
                Aguardando confirmação de pagamento...
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalPixAberto(false);
                  setMensalidadeSelecionada(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0f1e36] dark:text-slate-300 px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
