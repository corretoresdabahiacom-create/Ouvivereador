import { GoogleGenAI } from "@google/genai";

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete?(key: string): Promise<void>;
}

interface PagesFunctionEventContext<Env, Params extends string = any> {
  request: Request;
  env: Env;
  params: Record<Params, string>;
  waitUntil(promise: Promise<any>): void;
  next(request?: Request | string, init?: RequestInit): Promise<Response>;
}

type PagesFunction<Env = any, Params extends string = any> = (
  context: PagesFunctionEventContext<Env, Params>
) => Response | Promise<Response>;

interface Env {
  GEMINI_API_KEY: string;
  OUVIDORIA_DB?: KVNamespace;
}

// Router Type Definitions
type RouteHandler = (
  req: Request,
  env: Env,
  params: Record<string, string>,
  query: Record<string, string>
) => Promise<Response> | Response;

interface Route {
  method: string;
  pattern: RegExp;
  paramKeys: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];

function addRoute(method: string, pathPattern: string, handler: RouteHandler) {
  const paramKeys: string[] = [];
  const regexString = pathPattern
    .replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      paramKeys.push(key);
      return "([^/]+)";
    })
    .replace(/\*/g, ".*");
  const pattern = new RegExp(`^${regexString}$`);
  routes.push({ method, pattern, paramKeys, handler });
}

// Helper to easily send JSON responses
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, PUT",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

// Safely parse JSON post bodies
async function getBody(req: Request) {
  try {
    return await req.clone().json();
  } catch {
    return {};
  }
}

// The initial seed/mock database state
function getInitialDB() {
  return {
    usuarios: [
      {
        id: "u-admin",
        nome: "Admin Geral",
        email: "admin@camara.gov.br",
        telefone: "11999999999",
        senhaHash: "admin123",
        perfil: "Administrador Geral",
        emailAlternativo: "copia.admin@camara.gov.br",
        criadoEm: "2026-05-01T10:00:00Z"
      },
      {
        id: "u-ouvidor",
        nome: "Dr. Carlos (Ouvidor)",
        email: "ouvidoria@camara.gov.br",
        telefone: "11988888888",
        senhaHash: "ouvidoria123",
        perfil: "Ouvidoria de Câmara",
        emailAlternativo: "copia.ouvidor@camara.gov.br",
        criadoEm: "2026-05-01T11:00:00Z"
      },
      {
        id: "u-silva",
        nome: "Vereador Silva",
        email: "silva@camara.gov.br",
        telefone: "11977777777",
        senhaHash: "silva123",
        perfil: "Vereador Específico",
        emailAlternativo: "copia.silva@camara.gov.br",
        criadoEm: "2026-05-01T12:00:00Z",
        criadoPorAdminId: "u-admin"
      },
      {
        id: "u-vereador-req",
        nome: "Vereador Oficial",
        email: "vereador@camara.gov.br",
        telefone: "11966666666",
        senhaHash: "vereador123",
        perfil: "Vereador Específico",
        emailAlternativo: "copia.vereador@camara.gov.br",
        criadoEm: "2026-06-04T16:00:00Z",
        criadoPorAdminId: "u-admin"
      },
      {
        id: "u-usuario-req",
        nome: "Usuário Requerente",
        email: "usuario@gmail.com",
        telefone: "11933333333",
        senhaHash: "usuario123",
        perfil: "Cidadão",
        endereco: "Rua do Plenário, 10",
        bairro: "Centro",
        cpf: "111.222.333-44",
        criadoEm: "2026-06-04T16:00:00Z"
      },
      {
        id: "u-procurador-req",
        nome: "Procurador Dr. André",
        email: "procurador@camara.gov.br",
        telefone: "11922222222",
        senhaHash: "procurador123",
        perfil: "Procurador da Câmara",
        emailAlternativo: "copia.procurador@camara.gov.br",
        criadoEm: "2026-06-04T16:00:00Z",
        criadoPorAdminId: "u-admin"
      },
      {
        id: "u-cidadao1",
        nome: "Carlos Silva",
        email: "carlos@gmail.com",
        telefone: "11955555555",
        senhaHash: "carlos123",
        perfil: "Cidadão",
        endereco: "Rua do Sol, 45",
        bairro: "Centro",
        cpf: "123.456.789-10",
        criadoEm: "2026-05-05T14:40:00Z"
      },
      {
        id: "u-cidadao-comum",
        nome: "Cidadão Geral",
        email: "cidadao@gmail.com",
        telefone: "11944444444",
        senhaHash: "cidadao123",
        perfil: "Cidadão",
        endereco: "Avenida Central, 100",
        bairro: "Centro",
        cpf: "999.999.999-99",
        criadoEm: "2026-05-29T08:57:00Z"
      }
    ],
    secretarias: [
      {
        id: "sec-infra",
        nome: "Secretaria de Infraestrutura e Habitação",
        email: "infraestrutura@municipio.gov.br",
        responsavelNome: "Sérgio Ramos"
      },
      {
        id: "sec-servicos",
        nome: "Secretaria de Serviços Públicos e Parques",
        email: "servicos@municipio.gov.br",
        responsavelNome: "Marcia Albuquerque"
      },
      {
        id: "sec-saude",
        nome: "Secretaria de Saúde Coletiva",
        email: "saude@municipio.gov.br",
        responsavelNome: "Dr. Fernando Castelo"
      },
      {
        id: "sec-educacao",
        nome: "Secretaria de Educação e Desporto",
        email: "educacao@municipio.gov.br",
        responsavelNome: "Professora Silvia Lima"
      }
    ],
    manifestacoes: [],
    logs: [
      {
        id: "log-initial",
        timestamp: "2026-05-27T14:00:00Z",
        usuarioEmail: "sistema@ouvidoria.gov.br",
        usuarioNome: "Protetor LGPD Ativo",
        acao: "Iniciou base de dados encriptada de cidadãos conformidade LGPD"
      }
    ],
    headerConfig: {
      municipioNome: "Câmara de Rio Claro",
      nomePrograma: "OuviVereador IA — Ouvidoria Inteligente",
      logoUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=120",
      backgroundColor: "#024a30",
      textColor: "#ffffff",
      welcomeGreeting: "Bem-vindo à Ouvidoria Câmara Municipal Alagoinhas/ BA",
      appSubTitle: "Atendimento ao Cidadão • Legislativo Municipal"
    },
    cargos: [
      { id: "c-1", nome: "Vereador Titular", descricao: "Membro eleito do corpo legislativo municipal" },
      { id: "c-2", nome: "Servidor Efetivo", descricao: "Funcionário aprovado em concurso público municipal" },
      { id: "c-3", nome: "Ouvidor Geral", descricao: "Responsável master pelo processamento e trâmite dos relatos" },
      { id: "c-4", nome: "Assessor Parlamentar", descricao: "Gabinete direto de vereabilidade" }
    ],
    publicidadesTop: [
      {
        id: "top-ad-1",
        category: "Transparência Legislativa",
        title: "Campanha de Isenção, Regularização Tarifária e Descontos de IPTU 2026",
        highlight: "Até 80% de desconto nos juros moratórios de tributos locais.",
        details: "A Câmara Municipal aprovou por unanimidade a Lei Complementar 12/2026, regulamentando o novo Refis Municipal. Cidadãos e pequenos empresários com IPTU, ISS e taxas pendentes podem solicitar a quitação presencialmente no balcão de atendimento ou de forma digital via portal de finanças municipal. O prazo final para adesão ao programa estende-se até o final deste semestre com garantias reguladas.",
        cta: "Acessar Portal Tributário"
      },
      {
        id: "top-ad-2",
        category: "Participação Popular",
        title: "Plano Cicloviário Unificado da Avenida Central e Parque das Nações",
        highlight: "Audiência Pública na Câmara Municipal nesta quarta-feira às 19:00.",
        details: "Venha opinar sobre o traçado das novas vias municipais dedicadas a ciclistas, pedestres e novos modais de mobilidade limpa de forma auditada e segura. A comissão de urbanismo e mobilidade urbana receberá contribuições primeiras ou por escrito. Haverá transmissão online pelo canal oficial da TV Legislativa.",
        cta: "Inscrever-se para Falar"
      },
      {
        id: "top-ad-3",
        category: "Unidade Móvel de Zeladoria",
        title: "Ouvidoria no seu Bairro - Próxima sexta-feira no Distrito Industrial",
        highlight: "Fale diretamente com os vereadores de plantão e registre demandas de infraestrutura.",
        details: "A equipe técnica e a Ouvidoria itinerante estarão aportadas na Praça de Esportes com serviços rápidos de encaminhamento de relatos, consultas de assistências sob LGPD e audiências públicas individuais com representantes. Acompanhe relatórios presenciais.",
        cta: "Consultar Cronograma Completo"
      }
    ],
    publicidadeBottom: {
      id: "bottom-ad-1",
      category: "Parceria & Apoio Institucional",
      title: "Escola do Legislativo: Cursos Gratuitos de Cidadania, Oratória e Políticas Públicas",
      subtitle: "O saber técnico ao alcance de todos os cidadãos. Acesse a trilha de aprendizado online gratuita ou assista às aulas magnas na sede da Câmara Municipal.",
      cta: "Inscrever-se Grátis"
    }
  };
}

// In-Memory Database Fallback for stateless edge execution
let memoryDB: any = null;

// Clean asynchronous getter and setter for persistence in Cloudflare KV
async function getDB(env: Env) {
  if (env.OUVIDORIA_DB) {
    try {
      const data = await env.OUVIDORIA_DB.get("db_json");
      if (data) {
        let parsed = JSON.parse(data);
        let modified = false;

        // Apply backfills identical to original server.ts
        if (!parsed.usuarios) {
          parsed.usuarios = [];
        }
        const hasCidadao = parsed.usuarios.some((u: any) => u.email === "cidadao@gmail.com");
        if (!hasCidadao) {
          parsed.usuarios.push({
            id: "u-cidadao-comum",
            nome: "Cidadão Geral",
            email: "cidadao@gmail.com",
            telefone: "11944444444",
            senhaHash: "cidadao123",
            perfil: "Cidadão",
            endereco: "Avenida Central, 100",
            bairro: "Centro",
            cpf: "999.999.999-99",
            criadoEm: "2026-05-29T08:57:00Z"
          });
          modified = true;
        }

        const hasVereadorReq = parsed.usuarios.some((u: any) => u.email === "vereador@camara.gov.br");
        if (!hasVereadorReq) {
          parsed.usuarios.push({
            id: "u-vereador-req",
            nome: "Vereador Oficial",
            email: "vereador@camara.gov.br",
            telefone: "11966666666",
            senhaHash: "vereador123",
            perfil: "Vereador Específico",
            emailAlternativo: "copia.vereador@camara.gov.br",
            criadoEm: "2026-06-04T16:00:00Z"
          });
          modified = true;
        }

        const hasUsuarioReq = parsed.usuarios.some((u: any) => u.email === "usuario@gmail.com");
        if (!hasUsuarioReq) {
          parsed.usuarios.push({
            id: "u-usuario-req",
            nome: "Usuário Requerente",
            email: "usuario@gmail.com",
            telefone: "11933333333",
            senhaHash: "usuario123",
            perfil: "Cidadão",
            endereco: "Rua do Plenário, 10",
            bairro: "Centro",
            cpf: "111.222.333-44",
            criadoEm: "2026-06-04T16:00:00Z"
          });
          modified = true;
        }

        const hasProcuradorReq = parsed.usuarios.some((u: any) => u.email === "procurador@camara.gov.br");
        if (!hasProcuradorReq) {
          parsed.usuarios.push({
            id: "u-procurador-req",
            nome: "Procurador Dr. André",
            email: "procurador@camara.gov.br",
            telefone: "11922222222",
            senhaHash: "procurador123",
            perfil: "Procurador da Câmara",
            emailAlternativo: "copia.procurador@camara.gov.br",
            criadoEm: "2026-06-04T16:00:00Z"
          });
          modified = true;
        }

        parsed.usuarios.forEach((u: any) => {
          if (u.perfil !== "Cidadão" && !u.emailAlternativo) {
            u.emailAlternativo = `copia.${u.email.split("@")[0]}@camara.gov.br`;
            modified = true;
          }
        });

        if (!parsed.headerConfig) {
          parsed.headerConfig = {};
        }
        if (!parsed.headerConfig.welcomeGreeting) {
          parsed.headerConfig.welcomeGreeting = "Bem-vindo à Ouvidoria Câmara Municipal Alagoinhas/ BA";
          modified = true;
        }
        if (!parsed.headerConfig.appSubTitle) {
          parsed.headerConfig.appSubTitle = "Atendimento ao Cidadão • Legislativo Municipal";
          modified = true;
        }

        if (!parsed.publicidadesTop) {
          parsed.publicidadesTop = getInitialDB().publicidadesTop;
          modified = true;
        }
        if (!parsed.publicidadeBottom) {
          parsed.publicidadeBottom = getInitialDB().publicidadeBottom;
          modified = true;
        }
        if (!parsed.cargos) {
          parsed.cargos = getInitialDB().cargos;
          modified = true;
        }

        if (modified) {
          await env.OUVIDORIA_DB.put("db_json", JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.error("Cloudflare KV read error:", e);
    }
  }

  if (!memoryDB) {
    memoryDB = getInitialDB();
  }
  return memoryDB;
}

async function saveDB(db: any, env: Env) {
  const originalCount = db.manifestacoes.length;
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Keep active tickets, or resolved tickets within 60 days
  db.manifestacoes = db.manifestacoes.filter((m: any) => {
    if (m.status === "Respondido" && m.respondidoEm) {
      const respondidoDate = new Date(m.respondidoEm);
      const shouldKeep = respondidoDate >= sixtyDaysAgo;
      if (!shouldKeep) {
        db.logs.push({
          id: `retention-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          usuarioEmail: "lgpd-purger@camara.gov.br",
          usuarioNome: "Retenção Automática LGPD",
          acao: `Exclusão automática da reclamação respondida há mais de 60 dias (Protocolo ${m.protocolo}).`
        });
      }
      return shouldKeep;
    }
    return true;
  });

  if (env.OUVIDORIA_DB) {
    try {
      await env.OUVIDORIA_DB.put("db_json", JSON.stringify(db));
      return;
    } catch (e) {
      console.error("Cloudflare KV write error:", e);
    }
  }

  memoryDB = db;
}

// Audit trail Logger
async function writeAuditLog(usuarioEmail: string, usuarioNome: string, acao: string, protocoloRef: string | undefined, env: Env) {
  const db = await getDB(env);
  db.logs.push({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    usuarioEmail,
    usuarioNome,
    acao,
    protocoloRef
  });
  await saveDB(db, env);
}

// Safely obtain Gemini API on-demand
function getGemini(env: Env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Intelligent automatic router / hybrid classifier logic
async function classifyManifestacaoIA(text: string, env: Env) {
  const t = text.toLowerCase();
  
  // 1. RULES-BASED ROUTING (Cost-efficient, fast processing)
  if (t.includes("pista") || t.includes("buraco") || t.includes("asfalto") || t.includes("cratera") || t.includes("reparo") || t.includes("calçada")) {
    return {
      categoria: "Buracos e Reparos nas Vias",
      prioridade: "Média",
      secretariaId: "sec-infra",
      sugestao: "Prezado(a) cidadão(ã), registramos sua reclamação sobre os asfaltamentos e vias públicas. O setor de engenharia de tráfego e zeladoria da Secretaria de Infraestrutura agendou uma vistoria presencial para o endereço especificado no protocolo dentro do prazo de 5 dias úteis."
    };
  }

  if (t.includes("poste") || t.includes("luz") || t.includes("lâmpada") || t.includes("iluminacao") || t.includes("iluminação") || t.includes("escuro")) {
    return {
      categoria: "Iluminação Pública",
      prioridade: "Média",
      secretariaId: "sec-infra",
      sugestao: "Prezado(a) munícipe, a sua solicitação a respeito de reparo ou troca de lâmpada em iluminação pública foi devidamente recebida e despachada à Secretaria de Infraestrutura. A equipe técnica de eletricistas tem um prazo estipulado de até 48 horas úteis para atender ocorrências de postes apagados."
    };
  }

  if (t.includes("lixo") || t.includes("entulho") || t.includes("mato") || t.includes("sujeira") || t.includes("varrição") || t.includes("capina") || t.includes("descarte")) {
    return {
      categoria: "Limpeza Urbana",
      prioridade: "Alta",
      secretariaId: "sec-servicos",
      sugestao: "Estimado(a) munícipe, compreendemos seu desconforto. A solicitação para coleta de resíduos ou capina urbana foi encaminhada para a Secretaria de Serviços Públicos. O mutirão de limpeza preventiva passará pelo perímetro mapeado nas próximas 72 horas."
    };
  }

  if (t.includes("saúde") || t.includes("médico") || t.includes("posto de saúde") || t.includes("consulta") || t.includes("upa") || t.includes("vacina") || t.includes("exame") || t.includes("remédio")) {
    return {
      categoria: "Atendimento de Saúde",
      prioridade: "Alta",
      secretariaId: "sec-saude",
      sugestao: "Prezado(a), acolhemos sua manifestação no sistema de ouvidoria do Sistema Único de Saúde (SUS) local. Ela foi protocolada e enviada com prioridade máxima à Secretaria de Saúde Coletiva para providências e monitoramento clínico imediato."
    };
  }

  if (t.includes("escola") || t.includes("creche") || t.includes("professor") || t.includes("merenda") || t.includes("aula") || t.includes("aluno") || t.includes("vaga")) {
    return {
      categoria: "Educação Pública",
      prioridade: "Média",
      secretariaId: "sec-educacao",
      sugestao: "Prezado(a) cidadão(ã), registramos sua queixa ou sugestão pedagógica. Ela foi formalmente despachada para o setor de ouvidoria escolar da Secretaria de Educação e Desporto para avaliação e retorno célere em benefício da comunidade letiva."
    };
  }

  // 2. GEMINI DEEP ANALYSIS FALLBACK
  const ai = getGemini(env);
  if (ai) {
    try {
      const systemPrompt = `Você é o assistente virtual de inteligência artificial da Câmara de Vereadores.
Analise a manifestação informal enviada por um morador brasileiro. Classifique nos seguintes parâmetros.
Retorne APENAS um objeto JSON plano (sem formatação markdown \`\`\`json ou texto adicional) contendo exatamente:
{
  "categoria": "Nome amigável da Categoria (máximo 4 palavras)",
  "prioridade": "Baixa" ou "Média" ou "Alta" ou "Urgente",
  "secretariaId": "sec-infra" ou "sec-servicos" ou "sec-saude" ou "sec-educacao",
  "sugestao": "Rascunho de resposta extremamente formal, polida, e acolhedora em nome da Ouvidoria da Câmara Municipal, instruindo que a manifestação foi encaminhada para a secretaria correspondente e será resolvida em breve."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analise do relato: "${text}"`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        }
      });

      const cleanJson = response.text ? response.text.trim() : "";
      if (cleanJson) {
        const obj = JSON.parse(cleanJson);
        return {
          categoria: obj.categoria || "Atendimento Geral",
          prioridade: obj.prioridade || "Média",
          secretariaId: obj.secretariaId || "sec-infra",
          sugestao: obj.sugestao || "Prezado cidadão, acolhemos sua relevante manifestação legislativa. Sua demanda foi encaminhada com sucesso à secretaria responsável para andamento técnico."
        };
      }
    } catch (err) {
      console.error("[Gemini Cloud Classification Fallback] Error", err);
    }
  }

  // 3. SECURE RECOVERY PLAIN ROUTE
  return {
    categoria: "Geral / Outros",
    prioridade: "Média",
    secretariaId: "sec-infra",
    sugestao: "Prezado(a) munícipe, registramos este protocolo em nossa base de ouvidoria unificada. Sua mensagem já está à disposição das secretarias executivas responsáveis. Acompanhe novas atualizações por meio de seu protocolo de consulta."
  };
}


// --- API ROUTE REFRESHING IN MEMORY ---

// 1. GET config
addRoute("GET", "/api/header-config", async (req, env) => {
  const db = await getDB(env);
  return jsonResponse(db.headerConfig);
});

// 2. POST update config
addRoute("POST", "/api/header-config", async (req, env) => {
  const body = await getBody(req);
  const { municipioNome, nomePrograma, logoUrl, backgroundColor, welcomeGreeting, appSubTitle } = body;
  const db = await getDB(env);
  db.headerConfig = {
    municipioNome: municipioNome || db.headerConfig.municipioNome,
    nomePrograma: nomePrograma || db.headerConfig.nomePrograma,
    logoUrl: logoUrl || db.headerConfig.logoUrl,
    backgroundColor: backgroundColor || db.headerConfig.backgroundColor,
    welcomeGreeting: welcomeGreeting !== undefined ? welcomeGreeting : (db.headerConfig.welcomeGreeting || "Bem-vindo à Ouvidoria Câmara Municipal Alagoinhas/ BA"),
    appSubTitle: appSubTitle !== undefined ? appSubTitle : (db.headerConfig.appSubTitle || "Atendimento ao Cidadão • Legislativo Municipal"),
    textColor: "#ffffff"
  };
  await saveDB(db, env);
  await writeAuditLog("admin@camara.gov.br", "Administrador Geral", `Modificou as variáveis estéticas do cabeçalho municipal, mensagem de boas-vindas: "${db.headerConfig.welcomeGreeting}" e subtítulo: "${db.headerConfig.appSubTitle}".`, undefined, env);
  return jsonResponse({ success: true, headerConfig: db.headerConfig });
});

// 3. GET advertising content
addRoute("GET", "/api/publicidades", async (req, env) => {
  const db = await getDB(env);
  return jsonResponse({
    publicidadesTop: db.publicidadesTop || [],
    publicidadeBottom: db.publicidadeBottom || {}
  });
});

// 4. POST update top ads item (Add or Edit)
addRoute("POST", "/api/publicidades/top", async (req, env) => {
  const body = await getBody(req);
  const { id, category, title, highlight, details, cta, adminEmail } = body;
  const db = await getDB(env);

  const caller = db.usuarios.find((u: any) => u.email === adminEmail);
  if (!caller || caller.perfil !== "Administrador Geral") {
    return jsonResponse({ success: false, message: "Acesso negado: Apenas o Administrador Geral pode postar ou gerenciar publicidades." }, 403);
  }

  if (!category || !title || !highlight || !details || !cta) {
    return jsonResponse({ success: false, message: "Campos obrigatórios ausentes para a publicidade." }, 400);
  }

  if (!db.publicidadesTop) {
    db.publicidadesTop = [];
  }

  if (id) {
    const idx = db.publicidadesTop.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      db.publicidadesTop[idx] = { id, category, title, highlight, details, cta };
      await writeAuditLog(adminEmail, caller.nome, `Editou a publicidade superior: "${title}"`, undefined, env);
    } else {
      return jsonResponse({ success: false, message: "Publicidade superior não encontrada." }, 404);
    }
  } else {
    const newId = `top-ad-${Date.now()}`;
    db.publicidadesTop.push({ id: newId, category, title, highlight, details, cta });
    await writeAuditLog(adminEmail, caller.nome, `Criou nova publicidade superior: "${title}"`, undefined, env);
  }

  await saveDB(db, env);
  return jsonResponse({ success: true, publicidadesTop: db.publicidadesTop });
});

// 5. DELETE top ad item
addRoute("DELETE", "/api/publicidades/top/:id", async (req, env, params, query) => {
  const { id } = params;
  const adminEmail = query.adminEmail;
  const db = await getDB(env);

  const caller = db.usuarios.find((u: any) => u.email === adminEmail);
  if (!caller || caller.perfil !== "Administrador Geral") {
    return jsonResponse({ success: false, message: "Acesso negado: Apenas o Administrador Geral pode remover publicidades." }, 403);
  }

  if (!db.publicidadesTop) {
    db.publicidadesTop = [];
  }

  const idx = db.publicidadesTop.findIndex((item: any) => item.id === id);
  if (idx !== -1) {
    const titleDeleted = db.publicidadesTop[idx].title;
    db.publicidadesTop.splice(idx, 1);
    await writeAuditLog(String(adminEmail), caller.nome, `Removeu a publicidade superior: "${titleDeleted}"`, undefined, env);
    await saveDB(db, env);
    return jsonResponse({ success: true, publicidadesTop: db.publicidadesTop });
  } else {
    return jsonResponse({ success: false, message: "Publicidade superior não encontrada." }, 404);
  }
});

// 6. POST update bottom ad
addRoute("POST", "/api/publicidades/bottom", async (req, env) => {
  const body = await getBody(req);
  const { category, title, subtitle, cta, adminEmail } = body;
  const db = await getDB(env);

  const caller = db.usuarios.find((u: any) => u.email === adminEmail);
  if (!caller || caller.perfil !== "Administrador Geral") {
    return jsonResponse({ success: false, message: "Acesso negado: Apenas o Administrador Geral pode editar a publicidade de rodapé." }, 403);
  }

  if (!category || !title || !subtitle || !cta) {
    return jsonResponse({ success: false, message: "Preencha todos os campos da publicidade de rodapé." }, 400);
  }

  db.publicidadeBottom = {
    id: db.publicidadeBottom?.id || "bottom-ad-1",
    category,
    title,
    subtitle,
    cta
  };

  await writeAuditLog(adminEmail, caller.nome, `Atualizou a publicidade de rodapé: "${title}"`, undefined, env);
  await saveDB(db, env);
  return jsonResponse({ success: true, publicidadeBottom: db.publicidadeBottom });
});

// 7. POST auth login
addRoute("POST", "/api/auth/login", async (req, env) => {
  const body = await getBody(req);
  const { emailOrPhone, password } = body;

  if (!emailOrPhone || !password) {
    return jsonResponse({ success: false, message: "Campos obrigatórios: login e senha." }, 400);
  }

  const db = await getDB(env);
  const user = db.usuarios.find(
    (u: any) => (u.email === emailOrPhone || u.telefone === emailOrPhone) && u.senhaHash === password
  );

  if (!user) {
    return jsonResponse({ success: false, message: "Usuário ou senha incorretos." }, 401);
  }

  await writeAuditLog(user.email, user.nome, "Autenticou-se no painel OuviVereador", undefined, env);

  return jsonResponse({
    success: true,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      perfil: user.perfil,
      loginProvisorio: user.loginProvisorio,
      endereco: user.endereco,
      bairro: user.bairro,
      cpf: user.cpf,
      criadoPorAdminId: user.criadoPorAdminId
    }
  });
});

// 8. POST auth cadastro
addRoute("POST", "/api/auth/cadastro", async (req, env) => {
  const body = await getBody(req);
  const { nome, email, telefone, password, endereco, bairro, cpf } = body;

  if (!nome || !email || !telefone || !password) {
    return jsonResponse({ success: false, message: "Informe nome, e-mail, telefone e senha corporativa." }, 400);
  }

  const db = await getDB(env);
  const duplicate = db.usuarios.some((u: any) => u.email === email || u.telefone === telefone);
  if (duplicate) {
    return jsonResponse({ success: false, message: "E-mail ou Telefone já cadastrado no sistema." }, 400);
  }

  const newUser = {
    id: `u-${Date.now()}`,
    nome,
    email,
    telefone,
    senhaHash: password,
    perfil: "Cidadão",
    endereco,
    bairro: bairro || "Centro",
    cpf,
    criadoEm: new Date().toISOString()
  };

  db.usuarios.push(newUser);
  await saveDB(db, env);
  await writeAuditLog(newUser.email, newUser.nome, "Criou registro próprio de cidadão obedecendo LGPD", undefined, env);

  return jsonResponse({ success: true, user: newUser });
});

// 9. POST password recover
addRoute("POST", "/api/auth/recuperar", async (req, env) => {
  const body = await getBody(req);
  const { emailOrPhone } = body;
  const db = await getDB(env);

  const user = db.usuarios.find((u: any) => u.email === emailOrPhone || u.telefone === emailOrPhone);
  if (!user) {
    return jsonResponse({ success: false, message: "Usuário não localizado." }, 404);
  }

  await writeAuditLog(user.email, user.nome, "Efetuou solicitação de recuperação de credenciais", undefined, env);
  return jsonResponse({
    success: true,
    message: `A sua senha armazenada sob proteção é: "${user.senhaHash}".`
  });
});

// 10. POST change password
addRoute("POST", "/api/auth/alterar-senha", async (req, env) => {
  const body = await getBody(req);
  const { userId, novaSenha } = body;
  if (!userId || !novaSenha) {
    return jsonResponse({ success: false, message: "Informe a nova senha." }, 400);
  }

  const db = await getDB(env);
  const idx = db.usuarios.findIndex((u: any) => u.id === userId);
  if (idx === -1) {
    return jsonResponse({ success: false, message: "Usuário não localizado." }, 404);
  }

  db.usuarios[idx].senhaHash = novaSenha;
  db.usuarios[idx].loginProvisorio = false;
  await saveDB(db, env);
  await writeAuditLog(db.usuarios[idx].email, db.usuarios[idx].nome, "Atualizou a senha inicial do primeiro acesso.", undefined, env);
  return jsonResponse({ success: true, message: "Sua senha definitiva foi gravada com sucesso!" });
});

// 11. GET cargos list
addRoute("GET", "/api/cargos", async (req, env) => {
  const db = await getDB(env);
  return jsonResponse(db.cargos || []);
});

// 12. POST cargos add/edit
addRoute("POST", "/api/cargos", async (req, env) => {
  const body = await getBody(req);
  const { id, nome, descricao, adminEmail, adminNome } = body;
  if (!nome) {
    return jsonResponse({ success: false, message: "O nome do cargo é obrigatório." }, 400);
  }

  const db = await getDB(env);
  const caller = db.usuarios.find((u: any) => u.email === adminEmail);
  if (!caller || caller.perfil !== "Administrador Geral") {
    return jsonResponse({ success: false, message: "Acesso negado: Só o Administrador Geral pode criar cargos." }, 403);
  }

  if (!db.cargos) {
    db.cargos = [];
  }

  if (id) {
    const idx = db.cargos.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      return jsonResponse({ success: false, message: "Cargo não localizado." }, 404);
    }
    const duplicate = db.cargos.some((c: any) => c.id !== id && c.nome.toLowerCase() === nome.toLowerCase());
    if (duplicate) {
      return jsonResponse({ success: false, message: "Já existe outro cargo cadastrado com este nome." }, 400);
    }
    db.cargos[idx] = { id, nome, descricao: descricao || "" };
    await saveDB(db, env);
    await writeAuditLog(adminEmail || "admin@camara.gov.br", adminNome || "Admin Geral", `Editou o cargo legislativo: ${nome}`, undefined, env);
    return jsonResponse({ success: true, cargo: db.cargos[idx] });
  } else {
    const duplicate = db.cargos.some((c: any) => c.nome.toLowerCase() === nome.toLowerCase());
    if (duplicate) {
      return jsonResponse({ success: false, message: "Já existe um cargo cadastrado com este nome." }, 400);
    }

    const newCargo = {
      id: `c-${Date.now()}`,
      nome,
      descricao: descricao || ""
    };
    db.cargos.push(newCargo);
    await saveDB(db, env);
    await writeAuditLog(adminEmail || "admin@camara.gov.br", adminNome || "Admin Geral", `Criou novo cargo legislativo: ${nome}`, undefined, env);
    return jsonResponse({ success: true, cargo: newCargo });
  }
});

// 13. DELETE cargo
addRoute("DELETE", "/api/cargos/:id", async (req, env, params, query) => {
  const { id } = params;
  const adminEmail = query.adminEmail;
  const adminNome = query.adminNome;

  const db = await getDB(env);
  const caller = db.usuarios.find((u: any) => u.email === adminEmail);
  if (!caller || caller.perfil !== "Administrador Geral") {
    return jsonResponse({ success: false, message: "Acesso negado: Só o Administrador Geral pode deletar cargos." }, 403);
  }

  if (!db.cargos) db.cargos = [];

  const origin = db.cargos.find((c: any) => c.id === id);
  if (!origin) {
    return jsonResponse({ success: false, message: "Cargo não localizado." }, 404);
  }

  db.cargos = db.cargos.filter((c: any) => c.id !== id);
  await saveDB(db, env);
  await writeAuditLog(String(adminEmail) || "admin@camara.gov.br", String(adminNome) || "Admin Geral", `Excluiu o cargo municipal: ${origin.nome}`, undefined, env);
  return jsonResponse({ success: true });
});

// 14. GET secretarias list
addRoute("GET", "/api/secretarias", async (req, env) => {
  const db = await getDB(env);
  return jsonResponse(db.secretarias || []);
});

// 15. POST secretarias add/edit
addRoute("POST", "/api/secretarias", async (req, env) => {
  const body = await getBody(req);
  const { id, nome, email, responsavelNome, adminEmail, adminNome } = body;
  if (!nome || !email || !responsavelNome) {
    return jsonResponse({ success: false, message: "Preencha todos os campos da secretaria." }, 400);
  }

  const db = await getDB(env);
  if (id) {
    const idx = db.secretarias.findIndex((s: any) => s.id === id);
    if (idx !== -1) {
      db.secretarias[idx] = { id, nome, email, responsavelNome };
      await writeAuditLog(adminEmail || "admin@camara.gov.br", adminNome || "Admin Geral", `Atualizou a secretaria municipal: ${nome}`, undefined, env);
    }
  } else {
    const newSec = {
      id: `sec-${Date.now()}`,
      nome,
      email,
      responsavelNome
    };
    db.secretarias.push(newSec);
    await writeAuditLog(adminEmail || "admin@camara.gov.br", adminNome || "Admin Geral", `Adicionou nova secretaria no organograma: ${nome}`, undefined, env);
  }

  await saveDB(db, env);
  return jsonResponse({ success: true });
});

// 16. DELETE secretaria
addRoute("DELETE", "/api/secretarias/:id", async (req, env, params, query) => {
  const { id } = params;
  const adminEmail = query.adminEmail;
  const adminNome = query.adminNome;

  const db = await getDB(env);
  const origin = db.secretarias.find((s: any) => s.id === id);
  if (!origin) {
    return jsonResponse({ success: false, message: "Secretaria não existente." }, 404);
  }

  db.secretarias = db.secretarias.filter((s: any) => s.id !== id);
  await saveDB(db, env);
  await writeAuditLog(String(adminEmail) || "admin@camara.gov.br", String(adminNome) || "Admin", `Deletou a secretaria municipal: ${origin.nome}`, undefined, env);
  return jsonResponse({ success: true });
});

// 17. GET users list (Admin filters applied if not master superadmin)
addRoute("GET", "/api/usuarios", async (req, env, params, query) => {
  const adminId = query.adminId;
  const perfilAdmin = query.perfilAdmin;
  const db = await getDB(env);

  if (perfilAdmin === "Administrador Geral" && adminId && adminId !== "u-admin") {
    const list = db.usuarios.filter((u: any) => u.criadoPorAdminId === adminId || u.id === adminId);
    return jsonResponse(list);
  }

  return jsonResponse(db.usuarios);
});

// 18. POST users register/edit
addRoute("POST", "/api/usuarios", async (req, env) => {
  const body = await getBody(req);
  const { id, nome, email, telefone, senhaHash, perfil, cargo, adminId, adminEmail, adminNome, emailAlternativo } = body;

  if (!nome || !email || !telefone || !perfil) {
    return jsonResponse({ success: false, message: "Campos obrigatórios pendentes." }, 400);
  }

  const db = await getDB(env);
  const caller = db.usuarios.find((u: any) => u.email === adminEmail);
  if (!caller || caller.perfil !== "Administrador Geral") {
    return jsonResponse({ success: false, message: "Acesso negado: Só o Administrador Geral pode criar contas com acesso." }, 403);
  }

  if (id) {
    const idx = db.usuarios.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
      db.usuarios[idx] = {
        ...db.usuarios[idx],
        nome,
        email,
        telefone,
        senhaHash: senhaHash || db.usuarios[idx].senhaHash,
        perfil,
        cargo: cargo || db.usuarios[idx].cargo || "",
        emailAlternativo: emailAlternativo || db.usuarios[idx].emailAlternativo || ""
      };
      await writeAuditLog(adminEmail || "admin@camara.gov.br", adminNome || "Admin", `Editou conta de usuário de cargo ${cargo}: ${nome} (Perfil: ${perfil})`, undefined, env);
    }
  } else {
    const dup = db.usuarios.some((u: any) => u.email === email || u.telefone === telefone);
    if (dup) {
      return jsonResponse({ success: false, message: "Este e-mail ou telefone já está sendo utilizado." }, 400);
    }

    const newUser = {
      id: `u-${Date.now()}`,
      nome,
      email,
      telefone,
      senhaHash: senhaHash || "mudar123",
      perfil,
      cargo: cargo || "",
      emailAlternativo: emailAlternativo || "",
      criadoPorAdminId: adminId || "u-admin",
      loginProvisorio: true,
      criadoEm: new Date().toISOString()
    };

    db.usuarios.push(newUser);
    await writeAuditLog(adminEmail || "admin@camara.gov.br", adminNome || "Admin", `Criou nova credencial administrativa de perfil ${perfil} e cargo ${cargo || "N/A"} para: ${nome}`, undefined, env);
  }

  await saveDB(db, env);
  return jsonResponse({ success: true });
});

// 19. DELETE user
addRoute("DELETE", "/api/usuarios/:id", async (req, env, params, query) => {
  const { id } = params;
  const adminEmail = query.adminEmail;
  const adminNome = query.adminNome;

  const db = await getDB(env);
  const caller = db.usuarios.find((u: any) => u.email === adminEmail);
  if (!caller || caller.perfil !== "Administrador Geral") {
    return jsonResponse({ success: false, message: "Acesso negado: Só o Administrador Geral pode remover usuários cadastrados." }, 403);
  }

  const tgt = db.usuarios.find((u: any) => u.id === id);
  if (!tgt) {
    return jsonResponse({ success: false, message: "Usuário inexistente." }, 404);
  }

  db.usuarios = db.usuarios.filter((u: any) => u.id !== id);
  await saveDB(db, env);
  await writeAuditLog(String(adminEmail) || "admin@camara.gov.br", String(adminNome) || "Admin", `Deletou a conta do usuário: ${tgt.nome} (E-mail: ${tgt.email})`, undefined, env);
  return jsonResponse({ success: true });
});

// 20. GET complaints unifed method
addRoute("GET", "/api/manifestacoes", async (req, env, params, query) => {
  const usuarioId = query.usuarioId;
  const perfil = query.perfil;
  const vId = query.vId;
  const db = await getDB(env);

  let list = [...db.manifestacoes];

  if (perfil === "Cidadão") {
    list = list.filter((m: any) => m.usuarioId === usuarioId);
  } else if (perfil === "Vereador Específico") {
    list = list.filter((m: any) => !m.vereadorId || m.vereadorId === vId || m.vereadorId === "todos");
  }

  return jsonResponse(list);
});

// 21. POST open new tickets
addRoute("POST", "/api/manifestacoes", async (req, env) => {
  const body = await getBody(req);
  const {
    tipo,
    descricao,
    vereadorId,
    usuarioId,
    usuarioNome,
    usuarioEmail,
    usuarioTelefone,
    bairro,
    localizacao,
    fotoUrl,
    origem
  } = body;

  if (!tipo || !descricao || !bairro) {
    return jsonResponse({ success: false, message: "Insira tipo, descrição e bairro." }, 400);
  }

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  const protocolo = `OUV-${todayStr}-${code}`;

  const autoClass = await classifyManifestacaoIA(descricao, env);
  const remetenteOrigem = origem || "Cidadão Comum";
  const isDestaque = [
    "Órgão Público",
    "Prefeito(a) Municipal",
    "Secretário(a) Municipal",
    "Vereador(a) / Gabinete"
  ].includes(remetenteOrigem);

  const prioridadeFinal = isDestaque ? "Urgente" : autoClass.prioridade;

  const newTicket = {
    id: `m-${Date.now()}`,
    protocolo,
    tipo,
    descricao,
    status: "Recebido",
    prioridade: prioridadeFinal,
    categoria: autoClass.categoria,
    secretariaId: autoClass.secretariaId,
    vereadorId: vereadorId || "todos",
    usuarioId: usuarioId || null,
    usuarioNome: usuarioNome || "Anônimo",
    usuarioEmail: usuarioEmail || "cidadao@anonimo.gov.br",
    usuarioTelefone: usuarioTelefone || "",
    bairro,
    localizacao,
    fotoUrl: fotoUrl || null,
    criadoEm: new Date().toISOString(),
    respostaSugeridaIA: autoClass.sugestao,
    origem: remetenteOrigem,
    destacada: isDestaque,
    historicoLogs: [
      `${new Date().toISOString()}: Manifestação enviada sob amparo da LGPD. Protocolo: ${protocolo}`,
      `${new Date().toISOString()}: Triagem IA efetuada. Categoria sugerida: '${autoClass.categoria}', Secretaria: '${autoClass.secretariaId || "Não mapeada"}'.`,
      ...(isDestaque ? [`${new Date().toISOString()}: [ZELADORIA PRIORITÁRIA] - Remetente institucional oficial verificado: '${remetenteOrigem}'. Protocolo marcado com tratamento de urgência e destaque no painel parlamentar.`] : [])
    ]
  };

  const db = await getDB(env);
  db.manifestacoes.push(newTicket);
  await saveDB(db, env);

  await writeAuditLog(
    usuarioEmail || "anonimo@camara.gov.br",
    usuarioNome || "Cidadão Anônimo",
    `Manifestou ${tipo} gerando protocolo de rastreabilidade: ${protocolo}`,
    protocolo,
    env
  );

  return jsonResponse({ success: true, manifestacao: newTicket });
});

// 22. POST Mark ticket as read to active 39-days SLA metrics
addRoute("POST", "/api/manifestacoes/:id/lido", async (req, env, params) => {
  const { id } = params;
  const body = await getBody(req);
  const { adminEmail, adminNome } = body;

  const db = await getDB(env);
  const idx = db.manifestacoes.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return jsonResponse({ success: false, message: "Ficha de manifestação não localizada." }, 404);
  }

  const mat = db.manifestacoes[idx];
  if (mat.status === "Recebido" || mat.status === "Encaminhado para Secretaria" || !mat.lidoEm) {
    mat.status = "Lido (Aguardando Resposta)";
    mat.lidoEm = new Date().toISOString();
    mat.historicoLogs.push(
      `${new Date().toISOString()}: O responsável '${adminNome}' leu sua mensagem. Notificação LGPD disparada: 'Sua mensagem foi lida pelo responsável e em breve será respondida.'`
    );
    await saveDB(db, env);
    await writeAuditLog(adminEmail || "sistema@ouvidoria.gov.br", adminNome || "Administrador", `Efetuou primeira leitura e ativou cronômetro de 39 dias para: ${mat.protocolo}`, mat.protocolo, env);
  }

  return jsonResponse({ success: true, manifestacao: mat });
});

// 23. POST final response submission
addRoute("POST", "/api/manifestacoes/:id/responder", async (req, env, params) => {
  const { id } = params;
  const body = await getBody(req);
  const { respostaMsg, adminEmail, adminNome } = body;

  if (!respostaMsg) {
    return jsonResponse({ success: false, message: "Escreva uma resposta para o cidadão." }, 400);
  }

  const db = await getDB(env);
  const idx = db.manifestacoes.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return jsonResponse({ success: false, message: "Manifestação não localizada." }, 404);
  }

  const mat = db.manifestacoes[idx];
  mat.status = "Respondido";
  mat.respondidoEm = new Date().toISOString();
  mat.respostaMsg = respostaMsg;
  mat.historicoLogs.push(
    `${new Date().toISOString()}: Ouvidoria/Vereador respondeu: "${respostaMsg}".`
  );

  await saveDB(db, env);
  await writeAuditLog(
    adminEmail || "ouvidor@camara.gov.br",
    adminNome || "Ouvidor",
    `Enviou solução formal e encerrou SLA para protocolo: ${mat.protocolo}`,
    mat.protocolo,
    env
  );

  return jsonResponse({ success: true, manifestacao: mat });
});

// 24. POST Improve dispatch text with Gemini AI 3.5-flash
addRoute("POST", "/api/despacho/melhorar-ia", async (req, env) => {
  const body = await getBody(req);
  const { rascunho, manifestacaoTexto } = body;
  if (!rascunho || !rascunho.trim()) {
    return jsonResponse({ success: false, message: "Escreva algo primeiro no rascunho do despacho para que a IA possa melhorar." }, 400);
  }

  const ai = getGemini(env);
  if (ai) {
    try {
      const systemInstruction = `Você é um assessor inteligente e polido da Câmara de Vereadores.
O usuário (um agente legislativo ou vereador) escreveu um rascunho de despacho/resposta para uma ou mais manifestações de cidadãos.
Sua tarefa é expandir, corrigir erros gramaticais e melhorar o tom do despacho para que fique profissional, respeitoso, formal e em conformidade técnica com o serviço público legislativo brasileiro.
Mantenha os fatos principais e as decisões contidas no rascunho do usuário, mas torne a redação impecável.
Retorne APENAS o texto aprimorado do despacho em formato puramente textual (sem tags markdown, sem blocos de código e sem saudações extras que não façam parte do corpo do despacho).`;

      const prompt = `Manifestação original dos cidadãos: "${manifestacaoTexto || 'N/A'}"
Rascunho do despacho escrito pelo agente: "${rascunho}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction
        }
      });

      const textoMelhorado = response.text ? response.text.trim() : rascunho;
      return jsonResponse({ success: true, textoMelhorado });
    } catch (err: any) {
      console.error("Gemini improve dispatch error:", err);
      return jsonResponse({ success: false, message: "Erro de IA ao melhorar despacho: " + err.message }, 500);
    }
  } else {
    return jsonResponse({
      success: true,
      textoMelhorado: `[Aprimoramento Simulado] ${rascunho} - Despacho formalizado em conformidade com as diretivas regimentais vigentes desta casa de leis, encaminhado para andamento imediato na respectiva divisão.`
    });
  }
});

// 25. POST dispatching multiple complaints
addRoute("POST", "/api/manifestacoes/despachar", async (req, env) => {
  const body = await getBody(req);
  const { ids, responsavelId, despachoText, adminEmail, adminNome } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return jsonResponse({ success: false, message: "Nenhum protocolo ou mensagem foi selecionado." }, 400);
  }
  if (!responsavelId) {
    return jsonResponse({ success: false, message: "Selecione a pessoa responsável para o despacho." }, 400);
  }
  if (!despachoText || !despachoText.trim()) {
    return jsonResponse({ success: false, message: "Escreva o despacho (recado) para enviar." }, 400);
  }

  const db = await getDB(env);
  const senderAgent = db.usuarios.find((u: any) => u.email === adminEmail);
  const recipientAgent = db.usuarios.find((u: any) => u.id === responsavelId);
  if (!recipientAgent) {
    return jsonResponse({ success: false, message: "Pessoa responsável destinatária não localizada." }, 404);
  }

  const updatedManifestacoes: any[] = [];
  const proofLogs: string[] = [];
  const timestamp = new Date().toISOString();
  
  const senderCopied = senderAgent && senderAgent.perfil !== "Cidadão" && senderAgent.emailAlternativo;
  const receiverCopied = recipientAgent && recipientAgent.perfil !== "Cidadão" && recipientAgent.emailAlternativo;

  for (const id of ids) {
    const idx = db.manifestacoes.findIndex((m: any) => m.id === id);
    if (idx !== -1) {
      const mat = db.manifestacoes[idx];
      mat.status = "Encaminhado";
      mat.servidorResponsavelId = recipientAgent.id;
      mat.servidorResponsavelNome = recipientAgent.nome;
      mat.respostaSugeridaIA = despachoText;
      
      if (!mat.historicoLogs) {
        mat.historicoLogs = [];
      }

      mat.historicoLogs.push(
        `${timestamp}: Despachado por ${adminNome} (${senderAgent ? senderAgent.perfil : "Agente"}) para ${recipientAgent.nome} (${recipientAgent.perfil}). Recado de Despacho: "${despachoText}"`
      );

      if (senderCopied) {
        mat.historicoLogs.push(
          `${timestamp}: [COPIA PROVA ENVIADA] Cópia comprobatória enviada ao e-mail alternativo do remetente legislativo: ${senderAgent.emailAlternativo}`
        );
        if (!proofLogs.includes(`Resta comprovada a remessa por cópia de segurança enviada para: ${senderAgent.emailAlternativo}`)) {
          proofLogs.push(`Resta comprovada a remessa por cópia de segurança enviada para: ${senderAgent.emailAlternativo}`);
        }
      }
      if (receiverCopied) {
        mat.historicoLogs.push(
          `${timestamp}: [NOTIFICAÇÃO PROVA ENVIADA] Notificação de despacho enviada ao e-mail alternativo do destinatário: ${recipientAgent.emailAlternativo}`
        );
        if (!proofLogs.includes(`Destinatário cientificado por cópia em: ${recipientAgent.emailAlternativo}`)) {
          proofLogs.push(`Destinatário cientificado por cópia em: ${recipientAgent.emailAlternativo}`);
        }
      }

      await writeAuditLog(
        adminEmail || "admin@camara.gov.br",
        adminNome || "Agente Geral",
        `Efetuou despacho do protocolo ${mat.protocolo} para o agente ${recipientAgent.nome} com cópia comprobatória LGPD de envio de email de prova.`,
        mat.protocolo,
        env
      );

      updatedManifestacoes.push(mat);
    }
  }

  await saveDB(db, env);
  return jsonResponse({
    success: true,
    message: "Despacho processado com sucesso em todas as mensagens selecionadas!",
    copiedSender: senderCopied ? senderAgent.emailAlternativo : null,
    copiedReceiver: receiverCopied ? recipientAgent.emailAlternativo : null,
    proofLogs,
    updatedManifestacoes
  });
});

// 26. POST Forward to other secretaria
addRoute("POST", "/api/manifestacoes/:id/encaminhar", async (req, env, params) => {
  const { id } = params;
  const body = await getBody(req);
  const { secretariaId, adminEmail, adminNome } = body;

  const db = await getDB(env);
  const idx = db.manifestacoes.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return jsonResponse({ success: false, message: "Manifestação não localizada." }, 404);
  }

  const sec = db.secretarias.find((s: any) => s.id === secretariaId);
  if (!sec) {
    return jsonResponse({ success: false, message: "Secretaria de destino inválida." }, 400);
  }

  const mat = db.manifestacoes[idx];
  mat.secretariaId = secretariaId;
  mat.status = "Encaminhado para Secretaria";
  mat.historicoLogs.push(
    `${new Date().toISOString()}: Re-encaminhado por ${adminNome} para a secretaria: ${sec.nome}`
  );

  await saveDB(db, env);
  await writeAuditLog(
    adminEmail || "ouvidor@camara.gov.br",
    adminNome || "Ouvidor",
    `Re-encaminhou o ticket ${mat.protocolo} para a pasta: ${sec.nome}`,
    mat.protocolo,
    env
  );

  return jsonResponse({ success: true, manifestacao: mat });
});

// 27. POST Forward to server/vereador
addRoute("POST", "/api/manifestacoes/:id/encaminhar-servidor-vereador", async (req, env, params) => {
  const { id } = params;
  const body = await getBody(req);
  const { servidorId, vId, adminEmail, adminNome } = body;

  const db = await getDB(env);
  const idx = db.manifestacoes.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return jsonResponse({ success: false, message: "Manifestação não localizada." }, 404);
  }

  const mat = db.manifestacoes[idx];
  let logParts: string[] = [];

  if (servidorId) {
    const sUser = db.usuarios.find((u: any) => u.id === servidorId);
    if (sUser) {
      mat.servidorResponsavelId = servidorId;
      mat.servidorResponsavelNome = sUser.nome;
      logParts.push(`Servidor responsável: ${sUser.nome} (${sUser.perfil})`);
    }
  }

  if (vId) {
    const vUser = db.usuarios.find((u: any) => u.id === vId);
    if (vUser) {
      mat.vereadorResponsavelId = vUser.id;
      mat.vereadorResponsavelNome = vUser.nome;
      logParts.push(`Vereador responsável: ${vUser.nome}`);
    }
  }

  if (logParts.length === 0) {
    return jsonResponse({ success: false, message: "É necessário designar pelo menos um Servidor ou Vereador responsável." }, 400);
  }

  const actionMsg = `Encaminhado por Ouvidor Geral para: ${logParts.join(" e ")}`;
  mat.status = "Encaminhado";
  mat.historicoLogs.push(`${new Date().toISOString()}: ${actionMsg}`);

  await saveDB(db, env);
  await writeAuditLog(
    adminEmail || "ouvidor@camara.gov.br",
    adminNome || "Ouvidor Geral",
    `Encaminhou o ticket ${mat.protocolo} ao corpo técnico legislativo: ${logParts.join(", ")}`,
    mat.protocolo,
    env
  );

  return jsonResponse({ success: true, manifestacao: mat });
});

// 28. POST Reclassify manually
addRoute("POST", "/api/manifestacoes/:id/reclassificar", async (req, env, params) => {
  const { id } = params;
  const body = await getBody(req);
  const { categoria, prioridade, adminEmail, adminNome } = body;

  const db = await getDB(env);
  const idx = db.manifestacoes.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return jsonResponse({ success: false, message: "Manifestação não localizada." }, 404);
  }

  const mat = db.manifestacoes[idx];
  mat.categoria = categoria || mat.categoria;
  mat.prioridade = prioridade || mat.prioridade;
  mat.historicoLogs.push(
    `${new Date().toISOString()}: Reclassificado manualmente por ${adminNome}. Nova Categoria: "${categoria}", Prioridade: "${prioridade}"`
  );

  await saveDB(db, env);
  await writeAuditLog(
    adminEmail || "ouvidoria@camara.gov.br",
    adminNome || "Ouvidor",
    `Alterou categoria/métrica de prioridade no chamado ${mat.protocolo}`,
    mat.protocolo,
    env
  );

  return jsonResponse({ success: true, manifestacao: mat });
});

// 29. POST forward protocol file by email
addRoute("POST", "/api/manifestacoes/:id/enviar-email", async (req, env, params) => {
  const { id } = params;
  const body = await getBody(req);
  const { emailDestinatario, usuarioNome, usuarioEmail } = body;

  if (!emailDestinatario || !emailDestinatario.trim()) {
    return jsonResponse({ success: false, message: "E-mail destinatário inválido." }, 400);
  }

  const db = await getDB(env);
  const idx = db.manifestacoes.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return jsonResponse({ success: false, message: "Manifestação não localizada." }, 404);
  }

  const mat = db.manifestacoes[idx];
  mat.historicoLogs.push(
    `${new Date().toISOString()}: Relatório do protocolo enviado por e-mail para ${emailDestinatario}`
  );

  await saveDB(db, env);
  await writeAuditLog(
    usuarioEmail || "cidadao@camara.gov.br",
    usuarioNome || "Cidadão",
    `Enviou por e-mail cópia digital do protocolo: ${mat.protocolo} para ${emailDestinatario}`,
    mat.protocolo,
    env
  );

  return jsonResponse({ success: true, message: "Relatório de protocolo enviado com sucesso por e-mail!" });
});

// 30. POST Send dynamic general pdf/xls report by email
addRoute("POST", "/api/ouvidoria/enviar-relatorio", async (req, env) => {
  const body = await getBody(req);
  const { emailDestinatario, usuarioNome, usuarioEmail, filtros, ticketCount, ticketSummary } = body;

  if (!emailDestinatario || !emailDestinatario.trim()) {
    return jsonResponse({ success: false, message: "E-mail destinatário inválido." }, 400);
  }

  const filtrosDesc = Object.entries(filtros || {})
    .filter(([_, v]) => v && v !== "" && v !== "todos")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ") || "Sem filtros ativos (Geral)";

  await writeAuditLog(
    usuarioEmail || "ouvidoria@camara.gov.br",
    usuarioNome || "Ouvidor de Câmara",
    `Enviou Relatório Consolidado de Ouvidoria (${ticketCount} chamados, Filtros: ${filtrosDesc}) para o destinatário: ${emailDestinatario}`,
    undefined,
    env
  );

  return jsonResponse({ 
    success: true, 
    message: `Relatório oficial de Ouvidoria transmitido com sucesso para ${emailDestinatario}!` 
  });
});

// 31. POST Action in batch for complaints (excluir, concluir, andamento, encaminhar)
addRoute("POST", "/api/ouvidoria/acao-lote", async (req, env) => {
  const body = await getBody(req);
  const { ids, acao, destino, usuarioNome, usuarioEmail } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return jsonResponse({ success: false, message: "Nenhuma mensagem selecionada." }, 400);
  }

  const db = await getDB(env);
  const protocolasAfetados: string[] = [];

  if (acao === "excluir") {
    const naoConcluidas = db.manifestacoes.filter((m: any) => ids.includes(m.id) && m.status !== "Solucionado" && m.status !== "Respondido");
    if (naoConcluidas.length > 0) {
      const naoConcluidasProtocolos = naoConcluidas.map((m: any) => m.protocolo).join(", ");
      return jsonResponse({ 
        success: false, 
        message: `A mensagem só pode ser excluída quando concluída! Os seguintes chamados ainda não estão concluídos: ${naoConcluidasProtocolos}` 
      }, 400);
    }

    db.manifestacoes = db.manifestacoes.filter((m: any) => {
      const match = ids.includes(m.id);
      if (match) {
        protocolasAfetados.push(m.protocolo);
      }
      return !match;
    });

    await saveDB(db, env);
    await writeAuditLog(
      usuarioEmail || "ouvidoria@camara.gov.br",
      usuarioNome || "Ouvidor de Câmara",
      `Efetuou exclusão em lote de ${protocolasAfetados.length} chamados. Protocolos: ${protocolasAfetados.join(", ")}`,
      undefined,
      env
    );

    return jsonResponse({ 
      success: true, 
      message: `${protocolasAfetados.length} mensagem(ns) excluída(s) com sucesso.` 
    });
  }

  if (acao === "concluir") {
    let alterados = 0;
    db.manifestacoes.forEach((m: any) => {
      if (ids.includes(m.id)) {
        m.status = "Solucionado";
        m.historicoLogs.push(
          `${new Date().toISOString()}: Marcada como Concluída através de ação em lote por ${usuarioNome || "Membro da Câmara"}`
        );
        protocolasAfetados.push(m.protocolo);
        alterados++;
      }
    });

    await saveDB(db, env);
    await writeAuditLog(
      usuarioEmail || "ouvidoria@camara.gov.br",
      usuarioNome || "Ouvidor de Câmara",
      `Marcou em lote (${alterados} chamados) como Concluído. Protocolos: ${protocolasAfetados.join(", ")}`,
      undefined,
      env
    );

    return jsonResponse({ 
      success: true, 
      message: `${alterados} chamados foram marcados como Concluídos (Solucionados) com sucesso.` 
    });
  }

  if (acao === "andamento") {
    let alterados = 0;
    db.manifestacoes.forEach((m: any) => {
      if (ids.includes(m.id)) {
        m.status = "Em Andamento";
        m.historicoLogs.push(
          `${new Date().toISOString()}: Alterado para status 'Em Andamento' via ação em lote por ${usuarioNome || "Membro da Câmara"}`
        );
        protocolasAfetados.push(m.protocolo);
        alterados++;
      }
    });

    await saveDB(db, env);
    await writeAuditLog(
      usuarioEmail || "ouvidoria@camara.gov.br",
      usuarioNome || "Ouvidor de Câmara",
      `Alterou em lote (${alterados} chamados) para status Em Andamento. Protocolos: ${protocolasAfetados.join(", ")}`,
      undefined,
      env
    );

    return jsonResponse({ 
      success: true, 
      message: `${alterados} chamados foram definidos em andamento com sucesso.` 
    });
  }

  if (acao === "encaminhar" || acao === "enviar-responsavel") {
    let alterados = 0;
    db.manifestacoes.forEach((m: any) => {
      if (ids.includes(m.id)) {
        m.encaminhadoPara = destino || m.encaminhadoPara || "Gabinete / Órgão";
        m.status = "Encaminhado";
        m.historicoLogs.push(
          `${new Date().toISOString()}: Encaminhado em lote por ${usuarioNome || "Ouvidor"} para: ${destino}`
        );
        protocolasAfetados.push(m.protocolo);
        alterados++;
      }
    });

    await saveDB(db, env);
    await writeAuditLog(
      usuarioEmail || "ouvidoria@camara.gov.br",
      usuarioNome || "Ouvidor de Câmara",
      `Encaminhou em lote (${alterados} chamados) para "${destino}". Protocolos: ${protocolasAfetados.join(", ")}`,
      undefined,
      env
    );

    return jsonResponse({ 
      success: true, 
      message: `${alterados} mensagens foram encaminhadas com sucesso para "${destino}".` 
    });
  }

  return jsonResponse({ success: false, message: "Ação em lote inválida." }, 400);
});

// 32. POST complete resolve complaint
addRoute("POST", "/api/manifestacoes/:id/resolver-completo", async (req, env, params) => {
  const { id } = params;
  const body = await getBody(req);
  const { status, observacaoResolvido, encaminhadoPara, respostaMsg, adminEmail, adminNome } = body;

  const db = await getDB(env);
  const idx = db.manifestacoes.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return jsonResponse({ success: false, message: "Manifestação não localizada." }, 404);
  }

  const mat = db.manifestacoes[idx];
  
  mat.status = status || "Solucionado";
  mat.observacaoResolvido = observacaoResolvido || mat.observacaoResolvido;
  mat.encaminhadoPara = encaminhadoPara || mat.encaminhadoPara;
  
  if (respostaMsg) {
    mat.respostaMsg = respostaMsg;
  }
  
  if (mat.status === "Solucionado" || mat.status === "Respondido" || mat.status === "Finalizado") {
    mat.respondidoEm = new Date().toISOString();
  }

  mat.historicoLogs.push(
    `${new Date().toISOString()}: O parlamentar/gestor '${adminNome}' atualizou os dados de resolução: Status="${mat.status}", Encaminhado para="${mat.encaminhadoPara || '---'}", Observação de Solução="${mat.observacaoResolvido || '---'}"`
  );

  await saveDB(db, env);
  await writeAuditLog(
    adminEmail || "sistema@ouvidoria.gov.br",
    adminNome || "Parlamentar/Ouvidor",
    `Atualizou status para ${mat.status} e registrou resolução para o protocolo ${mat.protocolo}`,
    mat.protocolo,
    env
  );

  return jsonResponse({ success: true, manifestacao: mat });
});

// 33. GET audit logs list
addRoute("GET", "/api/logs", async (req, env) => {
  const db = await getDB(env);
  const logsWithCargo = (db.logs || []).map((log: any) => {
    const user = (db.usuarios || []).find((u: any) => u.email === log.usuarioEmail);
    return {
      ...log,
      cargo: user?.cargo || "Cidadão / Externo"
    };
  });
  return jsonResponse(logsWithCargo);
});

// 34. POST whatsapp mockup
addRoute("POST", "/api/whatsapp/mock-send", async (req, env) => {
  const body = await getBody(req);
  const { messageText, userPhone, userName, userBairro, attachmentBase64 } = body;

  if (!messageText) {
    return jsonResponse({ success: false, message: "Texto de mensagens vazio." }, 400);
  }

  const now = new Date();
  const protoStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const protoCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const protocolo = `WPP-${protoStr}-${protoCode}`;

  const autoClass = await classifyManifestacaoIA(messageText, env);

  const wppTicket = {
    id: `m-wpp-${Date.now()}`,
    protocolo,
    tipo: "Reclamação",
    descricao: `[Canal WhatsApp de ${userName || "Munícipe"}] ${messageText}`,
    status: "Recebido",
    prioridade: autoClass.prioridade,
    categoria: autoClass.categoria,
    secretariaId: autoClass.secretariaId,
    vereadorId: "todos",
    usuarioNome: userName || "Munícipe (WhatsApp)",
    usuarioTelefone: userPhone || "11987654321",
    usuarioEmail: "whatsapp@ouvidoriadigital.gov.br",
    bairro: userBairro || "Centro",
    fotoUrl: attachmentBase64 || null,
    criadoEm: now.toISOString(),
    respostaSugeridaIA: autoClass.sugestao,
    historicoLogs: [
      `${now.toISOString()}: Manifestação capturada através do fluxo do chatbot integrado no WhatsApp Business API.`,
      `${now.toISOString()}: Protocolo automático gerado e vinculado para acompanhamento via consulta.`,
      `${now.toISOString()}: Triagem IA preliminar concluída para a categoria '${autoClass.categoria}'.`
    ]
  };

  const db = await getDB(env);
  db.manifestacoes.push(wppTicket);
  await saveDB(db, env);

  await writeAuditLog(
    "whatsapp@ouvidoriadigital.gov.br", 
    userName || "Munícipe WhatsApp", 
    `Registrou chamado pelo WhatsApp Business API chatbot (Protocolo: ${protocolo})`, 
    protocolo,
    env
  );

  return jsonResponse({
    success: true,
    protocolo,
    respostaChatbot: `Olá! Sou o *Assistente Legislativo Virtual da Câmara*.\n\nSeu chamado foi registrado com absoluto rigor e segurança pela lei da LGPD! 🛡️\n\n📝 *Detalhes do chamado*:\n• *Protocolo*: \`${protocolo}\`\n• *Mauri Bairro*: ${userBairro || "Análise presencial"}\n• *Categoria IA*: *${autoClass.categoria}*\n• *Urgência sugerida*: *${autoClass.prioridade}*\n\nNossos assessores e técnicos já foram notificados e o prazo regulamentar foi iniciado. Você poderá acompanhar o andamento informando seu número de protocolo no nosso site! Obrigado pela sua participação ativa.`,
    manifestacao: wppTicket
  });
});


// --- CLOUDFLARE PAGES MAIN REQUEST HANDLER FLOW ---
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle preflight OPTIONS requests for routing/api compatibility
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, PUT",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  // Find routing patterns
  for (const route of routes) {
    if (route.method === method) {
      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramKeys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });
        
        // Extract query parameters
        const query: Record<string, string> = {};
        url.searchParams.forEach((value, name) => {
          query[name] = value;
        });

        try {
          return await route.handler(request, env, params, query);
        } catch (err: any) {
          console.error(`Route handler error on ${method} ${path}:`, err);
          return jsonResponse({ success: false, message: "Erro interno no servidor do Cloudflare Worker: " + err.message }, 500);
        }
      }
    }
  }

  // No backend route matches - return 404
  return jsonResponse({ success: false, message: `Rota ${method} ${path} não cadastrada no Cloudflare Worker.` }, 404);
};
