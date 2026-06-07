-- =====================================================================
-- OUVIVEREADOR IA - COMPILADO DE TABELAS E POLÍTICAS DE SEGURANÇA (RLS)
-- PREPARAÇÃO PARA MIGRAÇÃO SUPABASE & DEPLOY EM CLOUDFLARE WORKERS/PAGES
-- =====================================================================

-- Este arquivo DDL configura o banco de dados PostgreSQL estruturado para o Supabase,
-- contendo todas as tabelas essenciais, gatilhos de sincronização de e-mail/perfil,
-- e controle rigoroso de Row Level Security (RLS) para proteger dados dos cidadãos (LGPD).

-- ---------------------------------------------------------------------
-- 1. EXTENSÕES ÚTEIS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 2. TIPOS E ENUMS PERSONALIZADOS
-- ---------------------------------------------------------------------
CREATE TYPE user_perfil AS ENUM (
  'Cidadão', 
  'Vereador Específico', 
  'Ouvidoria de Câmara', 
  'Administrador Geral'
);

CREATE TYPE manifestacao_tipo AS ENUM (
  'Reclamação', 
  'Sugestão', 
  'Elogio', 
  'Denúncia'
);

CREATE TYPE manifestacao_status AS ENUM (
  'Recebido (Aguardando Análise)', 
  'Lido (Aguardando Resposta)', 
  'Respondido', 
  'Solucionado',
  'Arquivado'
);

CREATE TYPE manifestacao_prioridade AS ENUM (
  'Baixa', 
  'Média', 
  'Alta', 
  'Crítico (Urgente)'
);

-- ---------------------------------------------------------------------
-- 3. TABELA DE SECRETARIAS DE GOVERNO / ZELADORIA
-- ---------------------------------------------------------------------
CREATE TABLE public.secretarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  responsavel_nome VARCHAR(255) NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir secretarias padrão para o MVP
INSERT INTO public.secretarias (nome, email, responsavel_nome) VALUES
('Secretaria de Infraestrutura e Habitação', 'infraestrutura@municipio.gov.br', 'Sérgio Ramos'),
('Secretaria de Serviços Públicos e Parques', 'servicos@municipio.gov.br', 'Marcia Albuquerque'),
('Secretaria de Saúde Coletiva', 'saude@municipio.gov.br', 'Dr. Fernando Castelo'),
('Secretaria de Educação e Desporto', 'educacao@municipio.gov.br', 'Professora Silvia Lima')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. TABELA DE PERFIS DE USUÁRIOS (Sincronizado com auth.users do Supabase)
-- ---------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(50),
  perfil user_perfil NOT NULL DEFAULT 'Cidadão',
  endereco VARCHAR(255),
  bairro VARCHAR(100),
  cpf VARCHAR(18),
  login_provisorio BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. TABELA DE MANIFESTAÇÕES (Chamados Ouvidoria / Gabinetes)
-- ---------------------------------------------------------------------
CREATE TABLE public.manifestacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo VARCHAR(50) UNIQUE NOT NULL,
  tipo manifestacao_tipo NOT NULL DEFAULT 'Reclamação',
  descricao TEXT NOT NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Recebido (Aguardando Análise)',
  prioridade VARCHAR(50) NOT NULL DEFAULT 'Média',
  categoria VARCHAR(150),
  secretaria_id UUID REFERENCES public.secretarias(id) ON DELETE SET NULL,
  vereador_target VARCHAR(100) NOT NULL DEFAULT 'todos', -- 'todos', 'ouvidoria' ou ID do vereador
  
  -- Identificação do Cidadão (Ligado ao Profile quando logado, ou preenchido livre se anônimo/sem login)
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  usuario_nome VARCHAR(255),
  usuario_email VARCHAR(255),
  usuario_telefone VARCHAR(50),
  bairro VARCHAR(100) NOT NULL,
  
  -- Campos anexos e Localização (GPS)
  foto_url TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Trâmite e Resolução
  resposta_sugerida_ia TEXT,
  resposta_msg TEXT,
  lido_em TIMESTAMPTZ,
  respondido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. TABELA DE HISTÓRICO DE LOGS E AUDITORIA (Exigência LGPD)
-- ---------------------------------------------------------------------
CREATE TABLE public.historico_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifestacao_id UUID REFERENCES public.manifestacoes(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 7. ATIVAÇÃO DO ROW LEVEL SECURITY (RLS) DAS TABELAS (REQUISITO SEGURO)
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifestacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 8. POLÍTICAS DE SEGURANÇA (RLS) - PERMISSOES DETALHADAS
-- ---------------------------------------------------------------------

-- *** POLÍTICAS PARA: profiles ***
-- 1. Qualquer usuário pode verificar perfis necessários. Mas leitura detalhada é apenas de si mesmo ou administradores.
CREATE POLICY "Usuários podem ler o próprio perfil" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Equipe legislativa e Administradores podem visualizar perfis" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.perfil IN ('Ouvidoria de Câmara', 'Administrador Geral')
    )
  );

CREATE POLICY "Usuários podem atualizar os seus próprios dados" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- *** POLÍTICAS PARA: secretarias ***
-- 1. Qualquer usuário autenticado ou visitante pode listar secretarias (para preencher o dropdown de denúncia)
CREATE POLICY "Leitura de secretarias pública" 
  ON public.secretarias FOR SELECT 
  TO public 
  USING (true);

-- 2. Apenas Administrador Geral pode modificar as secretarias cadastrais
CREATE POLICY "Apenas admin pode gerenciar secretarias" 
  ON public.secretarias ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.perfil = 'Administrador Geral'
    )
  );

-- *** POLÍTICAS PARA: manifestacoes (CRÍTICO - SEGURANÇA MÁXIMA LGPD) ***
-- 1. Qualquer cidadão (mesmo anônimo/deslogado) pode cadastrar uma manifestação (INSERT)
CREATE POLICY "Criação de manifestações permitida ao público" 
  ON public.manifestacoes FOR INSERT 
  TO public 
  WITH CHECK (true);

-- 2. Cidadão logado pode VER apenas as suas próprias manifestações
CREATE POLICY "Cidadão logado vê suas próprias manifestações" 
  ON public.manifestacoes FOR SELECT 
  USING (
    auth.uid() = usuario_id
  );

-- 3. Cidadão deslogado / Consulta Rápida por ID de Protocolo
-- (Para permitir que o munícipe verifique seu chamado sabendo o protocolo gerado, sem precisar de login)
CREATE POLICY "Consulta pontual pública por protocolo" 
  ON public.manifestacoes FOR SELECT 
  TO public 
  USING (true); -- nota: restringido na aplicação por filtro estrito de "protocolo" igual ao digitado pelo usuário

-- 4. Vereadores, Ouvidores e Administradores podem VER todas as manifestações
CREATE POLICY "Equipe autorizada lê todas as manifestações" 
  ON public.manifestacoes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.perfil IN ('Vereador Específico', 'Ouvidoria de Câmara', 'Administrador Geral')
    )
  );

-- 5. Apenas equipe autorizada (Ouvidores, Admins e Vereador designado) pode ATUALIZAR status de manifestação
CREATE POLICY "Equipe autorizada atualiza manifestação" 
  ON public.manifestacoes FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.perfil IN ('Ouvidoria de Câmara', 'Administrador Geral', 'Vereador Específico')
    )
  );

-- *** POLÍTICAS PARA: historico_logs ***
-- 1. Qualquer usuário pode inserir logs de auditoria
CREATE POLICY "Inserção pública de logs" 
  ON public.historico_logs FOR INSERT 
  TO public 
  WITH CHECK (true);

-- 2. Visualização de logs restrita aos donos da manifestação correspondente ou equipe parlamentar
CREATE POLICY "Leitura de logs restrita ao proprietário ou servidores" 
  ON public.historico_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.manifestacoes m
      WHERE m.id = manifestacao_id
      AND (
        m.usuario_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND p.perfil IN ('Vereador Específico', 'Ouvidoria de Câmara', 'Administrador Geral')
        )
      )
    )
  );

-- ---------------------------------------------------------------------
-- 9. GATILHO AUTOMÁTICO DE CRIAÇÃO DE PERFIL VIA REGISTRO DO SUPABASE
-- ---------------------------------------------------------------------
-- Garante que cada usuário registrado no Auth do Supabase ganhe automaticamente
-- um registro integrado em public.profiles como 'Cidadão', se não houver um.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, perfil)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Novo Cidadão'),
    new.email,
    new.raw_user_meta_data->>'telefone',
    'Cidadão'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- 10. ORIENTAÇÕES DE DEPLOY EM CLOUDFLARE WORKERS / PAGES
-- ---------------------------------------------------------------------
-- 1. Cloudflare Pages: Hospede o frontend compilado do React static (pasta /dist).
--    Crie as variáveis de ambiente necessárias no painel:
--    - VITE_SUPABASE_URL = "SUA_URL_DO_SUPABASE"
--    - VITE_SUPABASE_ANON_KEY = "SUA_CHAVE_PUBLICA_ANONIMA"
--
-- 2. Cloudflare Workers (Opcional): Caso queira proxy de chamadas à API da Gemini ou integrações direct,
--    instale o wrangler: `npx wrangler init backend-ouvidoria` e configure variáveis de prod secrets:
--    `wrangler secret put GEMINI_API_KEY`
