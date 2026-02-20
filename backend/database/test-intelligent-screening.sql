-- ================================================
-- Script de Teste: Vaga para Desenvolvedor Full Stack
-- ================================================
-- Execute no SQL Editor do Supabase para criar vaga de teste

-- Primeiro, verificar schema atual da tabela jobs
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- Inserir vaga de exemplo para testes
-- Adaptado para o schema real (sem coluna description)
INSERT INTO jobs (
  id,
  title,
  requirements,
  company_id,
  status
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Desenvolvedor Full Stack Sênior',
  '{"description": "Buscamos desenvolvedor full stack com sólida experiência em React, Node.js e PostgreSQL. Você trabalhará em projetos inovadores de grande escala, colaborando com equipe multidisciplinar. Requisitos: 5+ anos de experiência, conhecimento em arquitetura de software, testes automatizados e CI/CD.", "required_skills": ["React", "Node.js", "PostgreSQL", "TypeScript", "Git", "Docker", "REST APIs", "Jest", "AWS"]}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  'ACTIVE'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  requirements = EXCLUDED.requirements,
  status = EXCLUDED.status;

-- Verificar se a vaga foi criada
SELECT 
  id,
  title,
  requirements,
  status
FROM jobs
WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- ================================================
-- Exemplo de Currículo para Teste
-- ================================================
/*
Use este texto no campo "resume_text" do webhook:

João Silva
Desenvolvedor Full Stack Sênior

EXPERIÊNCIA PROFISSIONAL:

Tech Solutions (2021 - Presente)
Desenvolvedor Full Stack Sênior
- Desenvolvimento de aplicações web com React e Node.js
- Arquitetura de microsserviços em TypeScript
- Implementação de testes automatizados com Jest
- Deploy e manutenção em AWS
- Trabalho com PostgreSQL e otimização de queries

StartupXYZ (2019 - 2021)
Desenvolvedor Full Stack Pleno
- Desenvolvimento de features em React
- APIs RESTful com Node.js e Express
- Integração com bancos de dados PostgreSQL
- Versionamento com Git e GitHub

WebDev Inc (2017 - 2019)
Desenvolvedor Junior
- Desenvolvimento front-end com React
- Suporte em APIs Node.js
- Aprendizado de boas práticas

FORMAÇÃO:
Bacharelado em Ciência da Computação - USP (2013-2017)

HABILIDADES:
React, Node.js, TypeScript, PostgreSQL, Git, Jest, REST APIs, AWS, Docker, Express, JavaScript, HTML, CSS

CONTATO:
Email: joao.silva@email.com
Telefone: +55 11 98765-4321
LinkedIn: linkedin.com/in/joaosilva
*/

-- ================================================
-- Exemplo de Payload para Webhook
-- ================================================
/*
POST https://n8n.lynxa.cloud/webhook/ats-intelligent-screening

{
  "job_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "resume_text": "João Silva\nDesenvolvedor Full Stack Sênior\n\nEXPERIÊNCIA PROFISSIONAL:\n\nTech Solutions (2021 - Presente)\nDesenvolvedor Full Stack Sênior\n- Desenvolvimento de aplicações web com React e Node.js\n- Arquitetura de microsserviços em TypeScript\n- Implementação de testes automatizados com Jest\n- Deploy e manutenção em AWS\n- Trabalho com PostgreSQL e otimização de queries\n\nStartupXYZ (2019 - 2021)\nDesenvolvedor Full Stack Pleno\n- Desenvolvimento de features em React\n- APIs RESTful com Node.js e Express\n- Integração com bancos de dados PostgreSQL\n- Versionamento com Git e GitHub\n\nWebDev Inc (2017 - 2019)\nDesenvolvedor Junior\n- Desenvolvimento front-end com React\n- Suporte em APIs Node.js\n- Aprendizado de boas práticas\n\nFORMAÇÃO:\nBacharelado em Ciência da Computação - USP (2013-2017)\n\nHABILIDADES:\nReact, Node.js, TypeScript, PostgreSQL, Git, Jest, REST APIs, AWS, Docker, Express, JavaScript, HTML, CSS\n\nCONTATO:\nEmail: joao.silva@email.com\nTelefone: +55 11 98765-4321",
  "candidate_name": "João Silva",
  "source": "upload"
}
*/

-- ================================================
-- Queries para Verificar Resultados
-- ================================================

-- Ver último candidato processado
SELECT 
  id,
  name,
  email,
  ai_score,
  priority,
  status,
  analysis,
  created_at
FROM candidates
ORDER BY created_at DESC
LIMIT 1;

-- Ver análise detalhada do último candidato
SELECT 
  c.name as candidato,
  j.title as vaga,
  c.ai_score as score,
  c.priority as prioridade,
  c.status,
  sm.recommendation as recomendacao,
  sm.matched_skills as skills_encontradas,
  sm.skills_gap as skills_faltando,
  sm.strengths as pontos_fortes,
  sm.weaknesses as pontos_fracos,
  sm.red_flags,
  sm.ai_reasoning as justificativa
FROM candidates c
JOIN screening_matrix sm ON c.id = sm.candidate_id
JOIN jobs j ON c.job_id = j.id
ORDER BY c.created_at DESC
LIMIT 1;

-- Ver todos os candidatos da vaga de teste
SELECT 
  c.name,
  c.ai_score,
  c.priority,
  sm.recommendation,
  array_length(sm.matched_skills::text[], 1) as skills_matched_count,
  array_length(sm.skills_gap::text[], 1) as skills_missing_count
FROM candidates c
JOIN screening_matrix sm ON c.id = sm.candidate_id
WHERE c.job_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
ORDER BY c.ai_score DESC;

-- Estatísticas da vaga
SELECT 
  j.title,
  COUNT(c.id) as total_candidatos,
  COUNT(CASE WHEN sm.recommendation = 'APPROVED' THEN 1 END) as aprovados,
  COUNT(CASE WHEN sm.recommendation = 'INTERVIEW' THEN 1 END) as entrevistas,
  COUNT(CASE WHEN sm.recommendation = 'REJECTED' THEN 1 END) as rejeitados,
  ROUND(AVG(c.ai_score)) as score_medio,
  MAX(c.ai_score) as score_maximo
FROM jobs j
LEFT JOIN candidates c ON j.id = c.job_id
LEFT JOIN screening_matrix sm ON c.id = sm.candidate_id
WHERE j.id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
GROUP BY j.id, j.title;
