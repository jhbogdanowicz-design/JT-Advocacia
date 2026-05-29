import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).send("OK");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido. Utilize POST." });
    return;
  }

  const { textoDocumento } = req.body;
  if (!textoDocumento) {
    res.status(400).json({ error: "Nenhum conteúdo textual fornecido para análise." });
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Erro: GOOGLE_API_KEY não foi encontrada nas variáveis de ambiente.");
    res.status(500).json({
      error: "Configuração do servidor inválida. Chave de API do Gemini ausente.",
    });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const responseSchema = {
      type: "object",
      properties: {
        resumo_executivo: { 
          type: "string", 
          description: "Resumo em um parágrafo dos fatos principais e do cenário atual do documento." 
        },
        tese_sugerida: { 
          type: "string", 
          description: "Linha argumentativa ou de defesa recomendada baseada no direito brasileiro." 
        },
        minuta_inicial_rascunho: { 
          type: "string", 
          description: "Esqueleto formal de petição ou manifestação inicial contendo: Fatos, Fundamentos Jurídicos resumidos e Pedidos básicos baseados no documento." 
        },
        classificacao: {
          type: "object",
          properties: {
            estagio: { 
              type: "string", 
              enum: ["Fase Inicial", "Instrução", "Sentença", "Recurso", "Execução"] 
            },
            prioridade: { 
              type: "string", 
              enum: ["Baixa", "Média", "Alta", "Urgente"] 
            }
          },
          required: ["estagio", "prioridade"]
        }
      },
      required: ["resumo_executivo", "tese_sugerida", "minuta_inicial_rascunho", "classificacao"]
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3
      }
    });

    const prompt = `
      Você é um assistente de IA sênior especialista em direito brasileiro, focado em auditoria técnica e aceleração de rotinas jurídicas.
      Analise o texto extraído do processo/peça fornecido abaixo e preencha rigorosamente a estrutura JSON solicitada.

      Conteúdo do Documento:
      ${textoDocumento}

      Regras cruciais:
      - Responda APENAS o objeto JSON correspondente ao esquema configurado, sem markdown ou explicações externas.
      - Seja conciso e direto ao ponto para economizar tempo da advogada.
      - Na minuta inicial, monte um rascunho de petição formal em português com parágrafos bem estruturados e elegantes.
    `;

    console.log("Chamando Gemini-2.5-Flash para analisar documento de processo...");
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Falha ao fazer parse do JSON do Gemini:", responseText);
      throw new Error("A IA retornou um JSON malformado.");
    }

    res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Erro na análise do Gemini:", error.message);
    res.status(500).json({ error: "Falha na análise analítica do Gemini: " + error.message });
  }
}
