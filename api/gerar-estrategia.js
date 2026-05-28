import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Carrega variáveis de ambiente (especialmente para o ambiente local)
dotenv.config();

export default async function handler(req, res) {
  // Configuração de CORS para permitir requisições seguras do frontend
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

  const { dados_do_cliente } = req.body;

  if (!dados_do_cliente) {
    res.status(400).json({ error: "Parâmetro 'dados_do_cliente' é obrigatório." });
    return;
  }

  // Obter chave da API
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Erro: GOOGLE_API_KEY não foi encontrada nas variáveis de ambiente.");
    res.status(500).json({
      error: "Configuração do servidor inválida. Chave de API da IA ausente.",
    });
    return;
  }

  try {
    // Inicializa o SDK do Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Definição do esquema de saída estruturado em JSON
    const responseSchema = {
      type: "object",
      properties: {
        estrategia_processual: {
          type: "array",
          items: {
            type: "object",
            properties: {
              etapa: {
                type: "string",
                description: "Etapa/Fase processual (ex: Fase Pré-Processual / Inicial, Fase Inicial, Fase Instrutória / Audiência)",
              },
              acoes: {
                type: "object",
                properties: {
                  teses_juridicas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Teses jurídicas e teses subsidiárias aplicáveis",
                  },
                  documentos_necessarios: {
                    type: "array",
                    items: { type: "string" },
                    description: "Documentos indispensáveis a serem juntados na respectiva fase",
                  },
                  fundamentacao_legal: {
                    type: "array",
                    items: { type: "string" },
                    description: "Dispositivos legais brasileiros, artigos e leis (ex: CPC, CLT, CC, etc.) fundamentando a tese",
                  },
                  riscos_e_alertas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Principais riscos, prazos fatais ou alertas sobre a fase processual",
                  },
                  proximos_passos: {
                    type: "array",
                    items: { type: "string" },
                    description: "Ações de execução imediata a serem tomadas pelo escritório",
                  },
                },
                required: [
                  "teses_juridicas",
                  "documentos_necessarios",
                  "fundamentacao_legal",
                  "riscos_e_alertas",
                  "proximos_passos",
                ],
              },
            },
            required: ["etapa", "acoes"],
          },
        },
      },
      required: ["estrategia_processual"],
    };

    // Configura o modelo gemini-2.5-flash com JSON estruturado
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Baixa temperatura para maximizar a precisão técnica e fidelidade jurídica
      },
    });

    const prompt = `Você é um advogado sênior e parecerista jurídico profissional especialista no ordenamento jurídico brasileiro.
Gere um plano de estratégia jurídica e linha de ação processual completo com base nos dados do cliente fornecidos abaixo.

Dados do Cliente (Fatos, Área de Interesse e Histórico):
${dados_do_cliente}

⚠️ Regras Críticas de Execução:
Você deve responder APENAS e estritamente o objeto JSON solicitado.
Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares fora do JSON.
Adapte a estratégia rigorosamente à área do direito selecionada e aos fatos narrados.
Baseie as teses na jurisprudência e leis brasileiras vigentes (CF, CPC, CC, CLT, etc.).`;

    console.log("Iniciando chamada para o modelo gemini-2.5-flash...");
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("Chamada de geração realizada com sucesso.");
    
    // Parse seguro para garantir conformidade
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Falha ao analisar a resposta JSON da IA:", responseText);
      throw new Error("A IA retornou uma estrutura de dados malformada.");
    }

    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Erro interno ao gerar estratégia via IA:", error);
    res.status(500).json({
      error: "Ocorreu um erro ao processar a estratégia com IA.",
      details: error.message,
    });
  }
}
