import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { PremiumIALoader } from "./PremiumIALoader";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const [areaSelecionada, setAreaSelecionada] = useState<"civil" | "empresarial" | "trabalhista" | "administrativo" | "consumidor">("civil");
  const [fatosNarrados, setFatosNarrados] = useState<string>("");

  // Interface para o perfil do advogado logado
  interface AdvogadoProfile {
    id: string;
    nome: string;
    email: string;
    oab?: string;
    tratamento?: string;
    telefone?: string;
    assinatura_digital_url?: string | null;
    cpf_cnpj?: string;
    endereco_profissional?: string;
  }

  const [advogado, setAdvogado] = useState<AdvogadoProfile | null>(null);
  const [loadingAdvogado, setLoadingAdvogado] = useState<boolean>(false);

  const contextoDoContrato = useMemo(() => {
    return `Área Jurídica: ${areaSelecionada} | Fatos e Contexto do Cliente: ${fatosNarrados}`;
  }, [areaSelecionada, fatosNarrados]);

  // Estado do Toast de Sucesso Emerald
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  // Helpers de Mascaramento de Moeda (R$)
  const formatBRL = (value: number | string) => {
    const num = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(num)) return "";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const cleanBRLToNumber = (value: string): number => {
    const clean = value.replace(/[^\d]/g, "");
    if (!clean) return 0;
    const num = parseInt(clean, 10) / 100;
    return isNaN(num) ? 0 : num;
  };

  const handleCurrencyInputChange = (val: string, setter: (v: string) => void) => {
    let clean = val.replace(/\D/g, "");
    if (!clean) {
      setter("");
      return;
    }
    const num = parseInt(clean, 10) / 100;
    setter(formatBRL(num));
  };

  // Estados do Formulário de Assinatura
  const [dataInicio, setDataInicio] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [diaRenovacao, setDiaRenovacao] = useState<number>(5);
  const [valorRecorrencia, setValorRecorrencia] = useState<string>("R$ 1.500,00");
  const [ativandoAssinatura, setAtivandoAssinatura] = useState<boolean>(false);
  const [cancelandoAssinatura, setCancelandoAssinatura] = useState<boolean>(false);

  // Estado da Minuta Gerada
  const [minutaTexto, setMinutaTexto] = useState<string>("");

  // Ref da div off-screen para captura do html2canvas
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  // Estados do Canvas de Assinatura
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const assinaturaImediataRef = useRef<string | null>(null);
  const [signatureExists, setSignatureExists] = useState<boolean>(false);
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [signatureImgUrl, setSignatureImgUrl] = useState<string | null>(null);
  const [lawyerSignatureImgUrl, setLawyerSignatureImgUrl] = useState<string | null>(null);

  // Base64 das assinaturas — injetadas na div off-screen antes do html2canvas
  const [lawyerSigBase64, setLawyerSigBase64] = useState<string | null>(null);
  const [clientSigBase64, setClientSigBase64] = useState<string | null>(null);
  const [preparingPrint, setPreparingPrint] = useState<boolean>(false);

  // Converte qualquer URL de imagem para Base64 via fetch (resolve CORS do Supabase)
  const carregarImagemBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url, { mode: "cors", cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Não foi possível converter imagem para Base64:", url, err);
      return null;
    }
  };

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

  // Carrega dinamicamente os dados do advogado logado (perfil)
  const carregarDadosAdvogado = async () => {
    try {
      setLoadingAdvogado(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Busca todas as colunas da tabela public.advogados
        const { data, error } = await supabase
          .from("advogados")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setAdvogado({
            id: user.id,
            email: user.email || "",
            nome: data.nome || user.user_metadata?.nome || "Dra. Janaina Tarabauca",
            oab: data.oab || user.user_metadata?.oab || "123.456",
            tratamento: data.tratamento || user.user_metadata?.tratamento || "Dra.",
            telefone: data.telefone || "",
            assinatura_digital_url: data.assinatura_digital_url || user.user_metadata?.assinatura_digital_url || null,
            cpf_cnpj: data.cpf_cnpj || "12.345.678/0001-90",
            endereco_profissional: data.endereco_profissional || "Av. Paulista, 1000, 16º andar, São Paulo/SP",
          });
        } else {
          // Fallback caso não ache registro estendido
          setAdvogado({
            id: user.id,
            email: user.email || "",
            nome: user.user_metadata?.nome || "Dra. Janaina Tarabauca",
            oab: user.user_metadata?.oab || "123.456",
            tratamento: user.user_metadata?.tratamento || "Dra.",
            telefone: user.user_metadata?.telefone || "",
            assinatura_digital_url: user.user_metadata?.assinatura_digital_url || null,
            cpf_cnpj: "12.345.678/0001-90",
            endereco_profissional: "Av. Paulista, 1000, 16º andar, São Paulo/SP",
          });
        }
      }
    } catch (err: any) {
      console.warn("Erro ao carregar credenciais do advogado:", err.message);
    } finally {
      setLoadingAdvogado(false);
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
      const valor = cleanBRLToNumber(valorRecorrencia);
      const dia = parseInt(diaRenovacao.toString());

      if (valor <= 0) {
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
      
      showToast("Salvo com sucesso!");
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
        setFatosNarrados(clienteAtivo.observacoes || "");
        if (clienteAtivo.areas_interesse) {
          const area = clienteAtivo.areas_interesse.toLowerCase();
          if (area.includes("civil")) setAreaSelecionada("civil");
          else if (area.includes("consumidor") || area.includes("consumo")) setAreaSelecionada("consumidor");
          else if (area.includes("empresarial") || area.includes("societário") || area.includes("societario")) setAreaSelecionada("empresarial");
          else if (area.includes("trabalhista") || area.includes("trabalho")) setAreaSelecionada("trabalhista");
          else if (area.includes("administrativo")) setAreaSelecionada("administrativo");
        }
        if (clienteAtivo.valor_mensalidade) {
          setValorRecorrencia(formatBRL(clienteAtivo.valor_mensalidade));
        } else {
          setValorRecorrencia(tipoPlano === "mensal" ? formatBRL(1500) : formatBRL(15000));
        }
        if (clienteAtivo.dia_vencimento) {
          setDiaRenovacao(clienteAtivo.dia_vencimento);
        } else {
          setDiaRenovacao(5);
        }
      }
    } else {
      setMensalidades([]);
      setFatosNarrados("");
    }
  }, [clienteSelecionadoId, clienteAtivo]);

  useEffect(() => {
    carregarClientes();
    carregarAssinaturaAdvogada();
    carregarDadosAdvogado();
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
        setValorRecorrencia(formatBRL(1500));
      } else {
        setValorRecorrencia(formatBRL(15000));
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

  // Limpar formulário e começ  const handleNovoContrato = () => {
    setClienteSelecionadoId("");
    setMinutaTexto("");
    setTipoPlano("mensal");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setDiaRenovacao(5);
    setValorRecorrencia(formatBRL(1500));
    setSignatureImgUrl(null);
    handleClearSignature();
  };

  // Helper para gerar o texto da minuta com base na área e tipo de pessoa
  const gerarTextoMinuta = (
    area: "civil" | "empresarial" | "trabalhista" | "administrativo" | "consumidor",
    tipoPessoa: "PF" | "PJ",
    nomeCliente: string,
    cnpjCpf: string,
    contextoContratoStr: string
  ): string => {
    const dataHoje = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const cleanVal = valorRecorrencia.replace(/[^\d]/g, "");
    const valorNum = cleanVal ? parseInt(cleanVal, 10) / 100 : 1500;
    const valorFormatado = valorNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Extrair os fatos do contextoDoContrato para injeção dinâmica
    const fatosParte = contextoContratoStr.includes("Fatos e Contexto do Cliente: ")
      ? contextoContratoStr.split("Fatos e Contexto do Cliente: ")[1]
      : contextoContratoStr;

    // 1. MAPEAMENTO DE TEMPLATES (Dicionário de Escopos)
    let tituloContrato = "";
    let qualificacaoContratante = "";
    let clausulaObjeto = "";
    let clausulaEspecifica = "";

    if (area === "trabalhista") {
      tituloContrato = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E CONSULTORIA TRABALHISTA";
      qualificacaoContratante = "trabalhador(a) / reclamante";
      clausulaObjeto = `O presente instrumento tem como objeto o patrocínio, representação judicial e defesa dos direitos trabalhistas da parte Contratante em face de seus antigos empregadores, incluindo reclamações trabalhistas e pedidos de verbas rescisórias, fundamentando-se especialmente nos fatos a seguir: ${fatosParte || "Nenhuma observação cadastrada."}`;
      
      // Extrair salário/valores e verbas dinamicamente sem usar valores fixos
      const matchSalario = fatosParte.match(/(salário|salario|R\$)\s*(\d+[\d\.,]*)/i);
      const matchVerbas = fatosParte.match(/(décimo|ferias|rescisórias|rescisao|fgts|horas extras)/i);
      const salario = matchSalario ? `com remuneração baseada em ${matchSalario[0]} ${matchSalario[2]}` : "com remuneração acordada na ficha funcional";
      const verbas = matchVerbas ? `abrangendo direitos de ${matchVerbas[0]}` : "abrangendo as verbas rescisórias e trabalhistas legais cabíveis";
      clausulaEspecifica = `\n\nCLÁUSULA ADICIONAL - DOS DIREITOS LABORAIS AVALIADOS:\nA contratada prestará assessoria técnica minuciosa para o cálculo e homologação das verbas contratuais informadas pelo cliente, ${salario}, ${verbas}, conforme os fatos narrados no cadastro.`;
    } else if (area === "empresarial") {
      tituloContrato = "CONTRATO DE ASSESSORIA JURÍDICA E CONSULTORIA EMPRESARIAL";
      qualificacaoContratante = "sociedade empresária / contratante";
      clausulaObjeto = `O presente instrumento tem como objeto a prestação de serviços de consultoria jurídica empresarial, elaboração de contratos societários, proteção patrimonial e governança corporativa, baseando-se nos seguintes fatos: ${fatosParte || "Sem notas de fatos no prontuário"}`;
      
      // Extrair sócios e cotas dinamicamente sem usar valores fixos (hardcoded)
      const matchSocios = fatosParte.match(/sócio[s]?\s+([^,\.\n]+)/i);
      const matchCotas = fatosParte.match(/(\d+[\d\.,]*%|\d+\s+cotas)/i);
      const socios = matchSocios ? matchSocios[1] : "qualificados em anexo";
      const cotas = matchCotas ? matchCotas[1] : "conforme participação societária";
      clausulaEspecifica = `\n\nCLÁUSULA ADICIONAL - DA ESTRUTURA SOCIETÁRIA:\nAs partes pactuam que o planejamento empresarial levará em conta a divisão de cotas no percentual aproximado de ${cotas}, sob responsabilidade e gestão dos sócios definidos como ${socios}, conforme delineado no contexto fático informado.`;
    } else if (area === "administrativo") {
      tituloContrato = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS EM DIREITO ADMINISTRATIVO";
      qualificacaoContratante = "Contratante";
      clausulaObjeto = `O presente instrumento tem como objeto a prestação de serviços de assessoria em Direito Administrativo, com foco em análise jurídica de editais de licitação, elaboração de recursos e impugnações administrativas, e defesa técnica baseada nos fatos descritos: ${fatosParte || "Sem notas de fatos no prontuário"}`;
    } else if (area === "consumidor") {
      tituloContrato = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E DEFESA DO CONSUMIDOR";
      qualificacaoContratante = "Consumidor(a) / Contratante";
      clausulaObjeto = `O presente instrumento tem como objeto a prestação de serviços advocatícios para a representação judicial e extrajudicial dos interesses do Contratante perante práticas abusivas de fornecedores de produtos ou serviços, responsabilidade civil pelo fato/vício do serviço ou produto, ou declaração de nulidade de cláusulas abusivas, em estrita observância ao Código de Defesa do Consumidor (CDC), fundamentando-se nos Fatos e Histórico de Prontuário: ${fatosParte || "Sem notas de fatos no prontuário"}`;
      
      const matchFornecedor = fatosParte.match(/(fornecedor|empresa|loja|banco|operadora)\s+([^,\.\n]+)/i);
      const fornecedor = matchFornecedor ? matchFornecedor[2] : "fornecedor indicado na ação";
      clausulaEspecifica = `\n\nCLÁUSULA ADICIONAL - DA DEFESA DA VULNERABILIDADE:\nA Contratada assume a obrigação de patrocinar a causa com foco especial na reparação integral de danos patrimoniais e morais sofridos pelo Consumidor frente às práticas abusivas imputadas a(o) ${fornecedor}, pleiteando a inversão do ônus da prova nos termos do Art. 6º, VIII do CDC e a facilitação da defesa de seus direitos.`;
    } else {
      // Civil / Padrão
      tituloContrato = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS";
      qualificacaoContratante = "Contratante";
      clausulaObjeto = `O presente instrumento tem como objeto a prestação de serviços advocatícios para representação e patrocínio dos interesses civis da parte Contratante, judicial ou extrajudicialmente, baseando-se nos fatos narrados: ${fatosParte || "Nenhuma observação cadastrada."}`;
    }

    const nomeAdvogada = advogado?.nome || "Dra. Janaina Tarabauca";
    const oabAdvogada = advogado?.oab || "123.456";
    const tratamentoAdvogada = advogado?.tratamento || "Dra.";
    const enderecoAdvogada = advogado?.endereco_profissional || "no escritório JT Advocacia";

    const definicaoContratante = `CONTRATANTE: ${nomeCliente.toUpperCase()}, na qualidade de ${qualificacaoContratante}, portador(a) do CPF/CNPJ sob o nº ${cnpjCpf}, residente, domiciliado(a) ou sediado(a) no endereço cadastrado.`;
    const definicaoContratada = `CONTRATADA: ${nomeAdvogada.toUpperCase()}, inscrita na OAB sob o nº ${oabAdvogada}, com endereço profissional ${enderecoAdvogada.startsWith("em ") || enderecoAdvogada.startsWith("no ") ? "" : "em "}${enderecoAdvogada}.`;

    return `${tituloContrato}

${definicaoContratante}

${definicaoContratada}

CLÁUSULA PRIMEIRA - DO OBJETO:
${clausulaObjeto}${clausulaEspecifica}

CLÁUSULA SEGUNDA - DA CONFIDENCIALIDADE:
As partes se comprometem a manter sigilo absoluto sobre todas as informações comerciais, operacionais ou técnicas de que venham a ter conhecimento em virtude deste contrato, sob pena de responsabilização civil e contratual.

CLÁUSULA TERCEIRA - DA VIGÊNCIA E RESCISÃO:
O contrato terá vigência de 12 (doze) meses a contar da data de início acordada, com renovação automática. A rescisão imotivada exigirá aviso prévio por escrito de 30 dias.

CLÁUSULA QUARTA - DOS HONORÁRIOS:
Pelos serviços preventivos contratados, o CONTRATANTE pagará à CONTRATADA o valor de ${valorFormatado} em caráter recorrente, via boleto bancário ou transferência, com vencimento todo dia ${diaRenovacao} de cada mês.

    Foro de Eleição: Fica eleito o foro da Comarca de São Paulo/SP para dirimir eventuais dúvidas.

    São Paulo, ${dataHoje}.

    __________________________________
    ${nomeCliente} (Contratante)

    __________________________________
    ${tratamentoAdvogada} ${nomeAdvogada} (Contratada)`;
  };

  // Teste de validação cruzada para garantir ausência de vazamento de contexto
  const executarTesteValidacaoCruzada = () => {
    const termosProibidos = [
      "médico", "medico", "saúde", "saude", "hospitalar", "clínica", "clinica",
      "paciente", "crm", "cfm", "corpo clínico", "corpo clinico", "erro médico", "erro medico"
    ];

    const areas: ("civil" | "empresarial" | "trabalhista" | "administrativo" | "consumidor")[] = [
      "civil", "empresarial", "trabalhista", "administrativo", "consumidor"
    ];

    const tiposPessoa: ("PF" | "PJ")[] = ["PF", "PJ"];
    let logs: string[] = [];
    let passou = true;

    for (const area of areas) {
      for (const tipo of tiposPessoa) {
        const texto = gerarTextoMinuta(area, tipo, "Cliente Teste", "123.456.789-00", "Fatos de teste para homologação.");
        
        const termosEncontrados = termosProibidos.filter(termo => 
          texto.toLowerCase().includes(termo.toLowerCase())
        );

        if (termosEncontrados.length > 0) {
          passou = false;
          logs.push(`❌ Falha: Área [${area}] (${tipo}) contém termos proibidos: ${termosEncontrados.join(", ")}`);
        } else {
          logs.push(`✅ Sucesso: Área [${area}] (${tipo}) livre de termos da saúde.`);
        }
      }
    }

    if (passou) {
      showToast("Validação Cruzada: 100% livre de vazamento!", "success");
      alert("🏆 Teste de Validação Cruzada Aprovado!\n\n" + logs.join("\n"));
    } else {
      showToast("Falha na Validação Cruzada!", "error");
      alert("🚨 Erro de Vazamento de Contexto Detectado:\n\n" + logs.join("\n"));
    }
  };

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

      const nomeAgente = motorIA === "jus_ia" ? "JUS IA" : motorIA === "gemini" ? "Gemini" : "ChatGPT";
      const areaInteresse = areaSelecionada === "consumidor" ? "Consumidor" : areaSelecionada;

      let promptSistema = `Você é o agente de IA ${nomeAgente}.`;
      if (areaSelecionada === "consumidor") {
        promptSistema = `Você é a JUS IA, especialista em Direito do Consumidor e CDC. O cliente em questão é um Consumidor. Adapte o título para: CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E DEFESA DO CONSUMIDOR.
Qualifique a parte Contratante destacando sua condição de consumidor e relacione o objeto da ação com práticas abusivas, responsabilidade civil pelo fato/vício do serviço ou produto, ou cláusulas abusivas, costurando estritamente com os Fatos e Histórico de Prontuário informados: ${fatosNarrados}.
NÃO utilize termos genéricos de contratos cíveis comuns. Use jargões técnicos adequados à vulnerabilidade do consumidor.`;
      }

      const instrucaoIA = `
        [Agente: ${nomeAgente}] 
        [Área Jurídica Estrita: ${areaInteresse}]
        [Dados Fáticos do Prontuário: ${fatosNarrados}]
        
        System: ${promptSistema}
        
        Instrução: Com base nos dados acima, elabore um esboço de cláusulas contratuais personalizado. Se a área for Consumidor, embase o Objeto no CDC e nos fatos narrados. Evite qualquer texto genérico ou corporativo padrão que não cite o problema real do cliente.
      `;

      console.log("Enviando Payload de Prompt Contextualizado para a IA:", instrucaoIA);

      // Simulação realista da resposta com base na IA selecionada e nos dados do cliente
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const nomeCliente = clienteAtivo?.nome || "Cliente";
      const cnpjCpf = clienteAtivo?.cpf_cnpj || "00.000.000/0001-00";

      const minutaGerada = gerarTextoMinuta(
        areaSelecionada,
        clienteAtivo?.tipo_pessoa || "PF",
        nomeCliente,
        cnpjCpf,
        instrucaoIA
      );

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

      const areaNome = 
        areaSelecionada === "civil" ? "Direito Civil" :
        areaSelecionada === "empresarial" ? "Direito Empresarial" :
        areaSelecionada === "trabalhista" ? "Direito Trabalhista" :
        areaSelecionada === "consumidor" ? "Direito do Consumidor" :
        "Direito Administrativo";

      const nomePlano =
        tipoPlano === "mensal"
          ? `Assessoria Preventiva - ${areaNome} (Mensal)`
          : `Defesa Integral e Compliance - ${areaNome} (Anual Premium)`;

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
    showToast("Copiado para a área de transferência!");
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
    isDrawingRef.current = true;
    setSignatureExists(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
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
    isDrawingRef.current = false;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSignatureImgUrl(base64);
        setIsSigned(true);
        setSignatureExists(true);
        showToast("Assinatura importada com sucesso!");
      };
      reader.readAsDataURL(file);
    }
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
      assinaturaImediataRef.current = imgUrl; // Síncrono imediato para evitar assincronia no PDF
      setClientSigBase64(imgUrl); // Força vinculação rápida no estado do preview off-screen
    }
    setIsSigned(true);
    showToast("Assinatura vinculada com sucesso de primeira!");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // GERAÇÃO DE PDF — html2canvas + jsPDF (Off-Screen Rendering)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleGerarPDF = async (incluirAssinaturaCliente: boolean = false) => {
    if (!minutaTexto) {
      alert("Gere a minuta antes de exportar o PDF.");
      return;
    }

    setPreparingPrint(true);

    try {
      // ── ETAPA 1: Converter assinatura da CONTRATADA (advogada) para Base64 ──
      const rawLawyerUrl = advogado?.assinatura_digital_url || lawyerSignatureImgUrl || null;
      let resolvedLawyerB64: string | null = null;

      if (rawLawyerUrl) {
        if (rawLawyerUrl.startsWith("data:image/")) {
          resolvedLawyerB64 = rawLawyerUrl;
          console.log("[PDF] ✅ Assinatura da advogada: já é Base64 válido.");
        } else {
          console.log("[PDF] ⏳ Convertendo assinatura da advogada para Base64:", rawLawyerUrl);
          resolvedLawyerB64 = await carregarImagemBase64(rawLawyerUrl);
          if (!resolvedLawyerB64 || !resolvedLawyerB64.startsWith("data:image/")) {
            console.error("[PDF] ❌ FALHA na conversão Base64 da assinatura da advogada. Verifique a URL e as políticas CORS do Supabase Storage.");
            resolvedLawyerB64 = null;
          } else {
            console.log("[PDF] ✅ Assinatura da advogada convertida com sucesso.");
          }
        }
      } else {
        console.warn("[PDF] ⚠️ Nenhuma URL de assinatura encontrada para a advogada. Verifique o cadastro em 'Configurações > Perfil Profissional'.");
      }

      // ── ETAPA 2: Converter assinatura do CONTRATANTE (cliente) para Base64 ──
      let resolvedClientB64: string | null = null;
      const urlAssinaturaCliente = assinaturaImediataRef.current || signatureImgUrl;

      if (incluirAssinaturaCliente && urlAssinaturaCliente) {
        if (urlAssinaturaCliente.startsWith("data:image/")) {
          resolvedClientB64 = urlAssinaturaCliente;
          console.log("[PDF] ✅ Assinatura do cliente: já é Base64 síncrono imediato.");
        } else {
          console.log("[PDF] ⏳ Convertendo assinatura do cliente para Base64...");
          resolvedClientB64 = await carregarImagemBase64(urlAssinaturaCliente);
          if (!resolvedClientB64 || !resolvedClientB64.startsWith("data:image/")) {
            console.error("[PDF] ❌ FALHA na conversão Base64 da assinatura do cliente.");
            resolvedClientB64 = null;
          } else {
            console.log("[PDF] ✅ Assinatura do cliente convertida com sucesso.");
          }
        }
      }

      // ── ETAPA 3: Atualizar estados com os Base64 resolvidos ──
      setLawyerSigBase64(resolvedLawyerB64);
      setClientSigBase64(resolvedClientB64);

      // Pré-carregamento síncrono das imagens na memória do navegador para evitar renderização em branco no html2canvas
      if (resolvedClientB64) {
        const imgPreload = new Image();
        imgPreload.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          imgPreload.onload = () => resolve(true);
          imgPreload.onerror = () => resolve(true); // Continua mesmo se falhar para não travar o PDF
          imgPreload.src = resolvedClientB64!;
        });
      }

      if (resolvedLawyerB64) {
        const imgPreload = new Image();
        imgPreload.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          imgPreload.onload = () => resolve(true);
          imgPreload.onerror = () => resolve(true);
          imgPreload.src = resolvedLawyerB64!;
        });
      }

      // ── ETAPA 4: Timeout de segurança (500ms) para o React re-renderizar a div off-screen ──
      // Sem este delay, o html2canvas captura o DOM antes das <img> carregarem os Base64.
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      // ── ETAPA 5: Capturar a div off-screen com html2canvas ──
      const container = pdfContainerRef.current;
      if (!container) {
        console.error("[PDF] ❌ Container off-screen (#pdf-contrato-offscreen) não encontrado no DOM.");
        alert("Erro interno: elemento de renderização não encontrado. Recarregue a página.");
        return;
      }

      console.log("[PDF] ⏳ Iniciando captura html2canvas (scale: 2)...");
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: false,
        logging: true,
        scale: 2,
        backgroundColor: "#ffffff",
        width: container.offsetWidth,
        height: container.offsetHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      console.log("[PDF] ✅ Canvas capturado. Dimensões:", canvas.width, "x", canvas.height);

      // ── ETAPA 6: Montar o PDF A4 com jsPDF ──
      const PDF_WIDTH_MM = 210;   // A4 largura em mm
      const PDF_HEIGHT_MM = 297;  // A4 altura em mm
      const pdf = new jsPDF("portrait", "mm", "a4");

      const imgProps = pdf.getImageProperties(imgData);
      const pxRatio = imgProps.height / imgProps.width;
      const pageImgHeightMm = PDF_WIDTH_MM * pxRatio;

      let heightLeft = pageImgHeightMm;
      let position = 0;
      let page = 0;

      while (heightLeft > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          PDF_WIDTH_MM,
          pageImgHeightMm,
          undefined,
          "FAST"
        );
        heightLeft -= PDF_HEIGHT_MM;
        position -= PDF_HEIGHT_MM;
        page++;
      }

      // ── ETAPA 7: Download automático ──
      const nomeArquivo = `Contrato_${clienteAtivo?.nome?.replace(/\s+/g, "_") || "cliente"}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(nomeArquivo);
      console.log("[PDF] ✅ PDF gerado e download iniciado:", nomeArquivo);
      showToast("PDF exportado com sucesso!", "success");

    } catch (err: any) {
      console.error("[PDF] ❌ Erro crítico na geração do PDF:", err);
      alert("Erro ao gerar PDF: " + (err?.message || "Erro desconhecido. Verifique o console."));
    } finally {
      setPreparingPrint(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a13] text-slate-800 dark:text-slate-100 p-6 space-y-6 print:bg-white print:p-0 print:text-black relative overflow-hidden">

      {/* ── Pano de Fundo Suavizado — Gradiente Radial Difuso ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.04)_0%,rgba(15,30,54,0.0)_60%)] pointer-events-none print:hidden" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(15,30,54,0.15)_0%,rgba(7,10,19,0)_65%)] pointer-events-none print:hidden" />
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-50/95 dark:bg-[#0f172a]/95 text-emerald-800 dark:text-emerald-300 shadow-2xl backdrop-blur-md animate-slideDown font-sans text-xs font-bold tracking-wide print:hidden">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs">✓</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* CABEÇALHO E CENTRAL DE IMPRESSÃO - CONTRATOS */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 mb-6 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm print:hidden relative z-50 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#0f1e36] p-2 rounded border border-[#d4af37]">
            <img src="/logo-jt.png" alt="Janaina Tarabauca Advocacia" className="h-6 w-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-[#0f1e36] dark:text-white uppercase tracking-wider">
              Janaina Tarabauca Advocacia
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Gestão de Minutas & Contratos de Prestação de Serviços
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={preparingPrint || !minutaTexto}
          onClick={() => handleGerarPDF(isSigned)}
          className="w-full sm:w-auto bg-[#0f1e36] hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 rounded shadow-md flex items-center justify-center gap-2 transition-all border-b-4 border-[#d4af37] cursor-pointer disabled:opacity-50"
        >
          {preparingPrint ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Gerando PDF...</>
          ) : (
            <>📄 EXPORTAR CONTRATO PARA PDF</>
          )}
        </button>
      </div>

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
            <label className="block text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Cliente do Contrato *
            </label>
            {loadingClientes ? (
              <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse"></div>
            ) : (
              <select
                value={clienteSelecionadoId}
                onChange={(e) => {
                  setClienteSelecionadoId(e.target.value);
                  setMinutaTexto(""); // Limpa o rascunho/esboço anterior
                  handleClearSignature(); // Reseta assinaturas vinculadas
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm md:text-base text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] cursor-pointer font-semibold"
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

          {/* Selecionar Área do Direito */}
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Área do Direito / Especialidade *
            </label>
            <select
              value={areaSelecionada}
              onChange={(e) => {
                setAreaSelecionada(e.target.value as any);
                setMinutaTexto(""); // Limpa o rascunho/esboço anterior
                handleClearSignature(); // Reseta assinaturas vinculadas
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm md:text-base text-[#0f1e36] dark:text-slate-200 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] cursor-pointer font-semibold"
            >
              <option value="civil">⚖️ Direito Civil</option>
              <option value="consumidor">🛍️ Direito do Consumidor</option>
              <option value="empresarial">🏢 Direito Empresarial / Societário</option>
              <option value="trabalhista">💼 Direito Trabalhista</option>
              <option value="administrativo">🏛️ Direito Administrativo</option>
            </select>
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
                <div className="space-y-1.5">
                  <label className="block text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Observações Gerais / Fatos Narrados *
                  </label>
                  <textarea
                    rows={5}
                    value={fatosNarrados}
                    onChange={(e) => setFatosNarrados(e.target.value)}
                    placeholder="Descreva aqui os fatos narrados e o contexto do cliente para a geração da minuta..."
                    className="w-full bg-white dark:bg-[#070a13] border border-slate-250 dark:border-slate-800 text-[#0f1e36] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm md:text-base py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors resize-y font-medium leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: AI GENERATOR, PLANOS & DIGITAL SIGNATURE */}
        <div className="lg:col-span-2 space-y-6 print:w-full">
          
          {/* 2. INTERACTIVE AI GENERATOR PANEL */}
          <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-sm print:border-none print:shadow-none print:p-0 print:bg-white print:text-black print:overflow-visible">
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
                      ? "bg-[#d4af37] text-slate-950 shadow-sm"
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
                disabled={loadingMinuta || loadingAdvogado || !clienteSelecionadoId}
                className="bg-[#0f1e36] text-white px-6 py-3 rounded text-sm md:text-base font-bold uppercase tracking-wide border-b border-[#d4af37] hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#0f1e36] transition-all cursor-pointer"
              >
                {loadingAdvogado ? "Buscando credenciais..." : loadingMinuta ? "Processando..." : "Gerar Minuta por IA"}
              </button>

              <button
                type="button"
                onClick={executarTesteValidacaoCruzada}
                className="bg-transparent text-[#0f1e36] dark:text-[#d4af37] border border-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f1e36] dark:hover:text-[#0f1e36] px-5 py-3 rounded text-sm md:text-base font-bold uppercase tracking-wide transition-all cursor-pointer"
              >
                🧪 Testar Validação Cruzada
              </button>
            </div>

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
                        disabled={preparingPrint}
                        onClick={() => handleGerarPDF(false)}
                        className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-[#0f1e36] dark:text-[#d4af37] border border-slate-300 dark:border-slate-800 font-bold text-xs uppercase tracking-wide px-3 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {preparingPrint ? "Gerando..." : "📄 Exportar Prévia (PDF)"}
                      </button>
                      {isSigned && (
                        <button
                          type="button"
                          disabled={preparingPrint}
                          onClick={() => handleGerarPDF(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide px-3 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {preparingPrint ? "Gerando..." : "✍️ Exportar Assinado (PDF)"}
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
                <PremiumIALoader />
              ) : minutaTexto ? (
                <>
                  {/* CABEÇALHO TIMBRADO JURÍDICO - VISÍVEL NA UI */}
                  <div className="flex items-center gap-4 mb-4 border-b-2 border-[#d4af37] pb-4">
                    <div>
                      <h2 className="font-bold text-base text-[#0f1e36] dark:text-slate-100 tracking-wider uppercase m-0">
                        Janaina Tarabauca Advogados
                      </h2>
                      <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mt-0.5">
                        {areaSelecionada === "civil" && "Direito Civil"}
                        {areaSelecionada === "consumidor" && "Direito do Consumidor"}
                        {areaSelecionada === "empresarial" && "Direito Empresarial / Societário"}
                        {areaSelecionada === "trabalhista" && "Direito Trabalhista"}
                        {areaSelecionada === "administrativo" && "Direito Administrativo"}
                      </p>
                    </div>
                  </div>

                  {/* BANNER DE STATUS */}
                  <div className="text-center border p-2.5 mb-6 rounded-lg"
                       style={{ borderColor: isSigned ? "#10b981" : "#d4af37", backgroundColor: isSigned ? "rgba(16, 185, 129, 0.05)" : "#fffdf5" }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: isSigned ? "#10b981" : "#d4af37" }}>
                      {isSigned ? "CONTRATO ASSINADO ELETRONICAMENTE VIA PORTAL JT ADVOCACIA" : "RASCUNHO / PRÉVIA DE MINUTA DE CONTRATO"}
                    </span>
                  </div>

                  <div className="w-full p-6 bg-white dark:bg-slate-900 border rounded shadow-sm h-[500px] overflow-y-auto prose dark:prose-invert max-w-none">
                    <textarea
                      value={minutaTexto}
                      onChange={(e) => setMinutaTexto(e.target.value)}
                      className="prose dark:prose-invert w-full h-full bg-transparent border-none outline-none resize-none focus:ring-0 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500/70"
                      placeholder="O documento gerado aparecerá aqui..."
                    />
                  </div>

                  {/* BLOCO DE ASSINATURAS E TIMESTAMP - VISÍVEL NO PREVIEW */}
                  <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Coluna Esquerda (CONTRATADA) */}
                      <div className="flex flex-col items-center gap-2 text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 print:bg-white print:p-0 print:border-none">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">CONTRATADA</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 print:text-black uppercase mt-1">
                          {((advogado?.tratamento || "Dra.") + " " + (advogado?.nome || "Janaina Tarabauca")).toUpperCase()}
                        </span>
                        <div className="border-b border-slate-300 dark:border-slate-700 print:border-black w-full h-24 flex items-center justify-center bg-white dark:bg-slate-950 p-2 rounded-lg print:bg-white print:p-0">
                          {/* Usa Base64 no print para evitar CORS; URL normal na tela */}
                          {(lawyerSigBase64 || advogado?.assinatura_digital_url || lawyerSignatureImgUrl) ? (
                            <img
                              src={lawyerSigBase64 || advogado?.assinatura_digital_url || lawyerSignatureImgUrl || ""}
                              alt={`Assinatura ${advogado?.nome || "Advogada"}`}
                              className="h-16 w-auto object-contain mx-auto mix-blend-multiply"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic select-none">Aguardando assinatura cadastrada...</span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#10b981] font-black tracking-wider uppercase mt-0.5 flex items-center gap-1">● ASSINADO DIGITALMENTE</span>
                      </div>

                      {/* Coluna Direita (CONTRATANTE) */}
                      <div className="flex flex-col items-center gap-2 text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">CONTRATANTE</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase mt-1">
                          {clienteAtivo?.nome || "CONTRATANTE"}
                        </span>
                        <div className="border-b border-slate-300 dark:border-slate-700 w-full h-24 flex items-center justify-center bg-white dark:bg-slate-950 p-2 rounded-lg">
                          {signatureImgUrl ? (
                            <img
                              src={signatureImgUrl}
                              alt="Assinatura Contratante"
                              className="h-16 w-auto max-w-[220px] object-contain mx-auto"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic select-none">Aguardando assinatura do cliente...</span>
                          )}
                        </div>
                        {signatureImgUrl && (
                          <span className="text-[8px] text-[#10b981] font-bold mt-0.5 leading-tight">
                            ✅ ASSINADO EM {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
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
                    Assessoria preventiva jurídica com suporte mensal e análise de contratos.
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
                    Defesa integral contenciosa, assessoria jurídica preventiva corporativa e compliance de normas.
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
                    onChange={(e) => handleCurrencyInputChange(e.target.value, setValorRecorrencia)}
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

              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-colors"
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
                <label className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#070A13] px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer border-b border-[#D4AF37] transition-all">
                  📥 Importar Assinatura (PNG/JPG)
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
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
                      showToast("Copiado para a área de transferência!");
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

      {/* ═══════════════════════════════════════════════════════════════════════
          DIV OFF-SCREEN A4 — CAPTURADA PELO html2canvas
          REGRA DE OURO: NUNCA use display:none ou hidden aqui!
          O posicionamento fora da tela (top: -9999px) garante que o navegador
          renderize o conteúdo completamente, mas o usuário não enxerga.
          ═══════════════════════════════════════════════════════════════════════ */}
      {minutaTexto && (
        <div
          ref={pdfContainerRef}
          id="pdf-contrato-offscreen"
          style={{
            position: "absolute",
            top: "-9999px",
            left: "-9999px",
            width: "794px",        /* Largura A4 a 96dpi */
            minHeight: "1123px",   /* Altura A4 a 96dpi */
            backgroundColor: "#ffffff",
            color: "#000000",
            fontFamily: "Georgia, 'Times New Roman', serif",
            padding: "60px 70px",
            boxSizing: "border-box",
          }}
        >
          {/* ── TIMBRADO ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "3px solid #d4af37", paddingBottom: "16px", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f1e36", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Janaina Tarabauca Advogados
              </div>
              <div style={{ fontSize: "10px", color: "#d4af37", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "4px" }}>
                {areaSelecionada === "civil" && "Direito Civil"}
                {areaSelecionada === "consumidor" && "Direito do Consumidor"}
                {areaSelecionada === "empresarial" && "Direito Empresarial / Societário"}
                {areaSelecionada === "trabalhista" && "Direito Trabalhista"}
                {areaSelecionada === "administrativo" && "Direito Administrativo"}
              </div>
            </div>
          </div>

          {/* ── BANNER DE STATUS ── */}
          <div style={{
            textAlign: "center",
            border: `2px solid ${isSigned ? "#10b981" : "#d4af37"}`,
            borderRadius: "8px",
            padding: "8px 16px",
            marginBottom: "28px",
            backgroundColor: isSigned ? "rgba(16,185,129,0.06)" : "#fffdf5",
          }}>
            <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: isSigned ? "#10b981" : "#b8860b" }}>
              {isSigned
                ? "✅ CONTRATO ASSINADO ELETRONICAMENTE VIA PORTAL JT ADVOCACIA"
                : "📋 RASCUNHO / PRÉVIA DE MINUTA DE CONTRATO"}
            </span>
          </div>

          {/* ── CORPO DO CONTRATO ── */}
          <pre style={{
            whiteSpace: "pre-wrap",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "11px",
            lineHeight: "1.85",
            color: "#111111",
            margin: "0 0 40px 0",
            wordBreak: "break-word",
          }}>
            {minutaTexto}
          </pre>

          {/* ── BLOCO DE ASSINATURAS ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            marginTop: "48px",
            paddingTop: "32px",
            borderTop: "1px solid #cbd5e1",
          }}>
            {/* Contratada */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>CONTRATADA</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f1e36", textTransform: "uppercase", margin: "6px 0 10px" }}>
                {((advogado?.tratamento || "Dra.") + " " + (advogado?.nome || "Janaina Tarabauca")).toUpperCase()}
              </span>
              <div style={{ width: "100%", height: "80px", borderBottom: "1.5px solid #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa" }}>
                {lawyerSigBase64 ? (
                  <img
                    src={lawyerSigBase64}
                    alt="Assinatura Advogada"
                    style={{ maxHeight: "70px", maxWidth: "200px", objectFit: "contain" }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span style={{ fontSize: "9px", color: "#94a3b8", fontStyle: "italic" }}>Assinatura Digital Cadastrada</span>
                )}
              </div>
              <span style={{ fontSize: "8px", color: "#10b981", fontWeight: 700, marginTop: "6px", textTransform: "uppercase" }}>● ASSINADO DIGITALMENTE</span>
            </div>

            {/* Contratante */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>CONTRATANTE</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f1e36", textTransform: "uppercase", margin: "6px 0 10px" }}>
                {clienteAtivo?.nome?.toUpperCase() || "CONTRATANTE"}
              </span>
              <div style={{ width: "100%", height: "80px", borderBottom: "1.5px solid #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa" }}>
                {clientSigBase64 ? (
                  <img
                    src={clientSigBase64}
                    alt="Assinatura Cliente"
                    style={{ maxHeight: "70px", maxWidth: "200px", objectFit: "contain" }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span style={{ fontSize: "9px", color: "#94a3b8", fontStyle: "italic" }}>
                    {isSigned ? "Assinatura Eletrônica Coletada" : "Aguardando assinatura do cliente"}
                  </span>
                )}
              </div>
              {clientSigBase64 && (
                <span style={{ fontSize: "7px", color: "#10b981", fontWeight: 700, marginTop: "6px" }}>
                  ASSINADO EM {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} (HASH SHA-256)
                </span>
              )}
            </div>
          </div>

          {/* ── RODAPÉ ── */}
          <div style={{ marginTop: "48px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ fontSize: "8px", color: "#94a3b8", margin: 0 }}>
              JT Advocacia • Av. Paulista, 1000, 16º andar, São Paulo/SP • CEP 01311-100 • Tel: (11) 94753-4587
            </p>
            <p style={{ fontSize: "8px", color: "#94a3b8", margin: "4px 0 0" }}>
              Documento gerado eletronicamente e protegido por criptografia de dados de ponta.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
