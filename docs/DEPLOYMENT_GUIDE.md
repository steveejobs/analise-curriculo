# 🚀 Guia de Implantação: Colocar o ATS Online

Este guia explica como colocar o sistema **Intelligent ATS** em produção usando Vercel, Supabase e OpenAI.

## 1. Configuração do Vercel (Frontend & API)

O Vercel hospedará a interface do usuário e as rotas de API.

1.  **Conecte seu Repositório**: No Dashboard do Vercel, clique em "New Project" e selecione o repositório deste projeto.
2.  **Configurações de Build**:
    - **Framework Preset**: Next.js
    - **Build Command**: `npm run build`
    - **Output Directory**: `.next`
3.  **Variáveis de Ambiente**: Adicione as seguintes variáveis no painel do Vercel:

| Variável | Valor (Exemplo) |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sua URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua Anon Key do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua Service Role Key (CRÍTICA para IA) |
| `OPENAI_API_KEY` | Sua chave da OpenAI |

> [!IMPORTANT]
> A variável `SUPABASE_SERVICE_ROLE_KEY` deve ser mantida em sigilo absoluto. Nunca a exponha no frontend.

## 2. Configuração do Agente de IA (Background)

O Vercel não suporta scripts de longa duração (background workers). Por isso, o **AI Agent** (`ai-agent.ts`) deve ser executado externamente.

### Opção A: Servidor Próprio (VPS/Local)
Se você tiver um servidor ou quiser rodar localmente enquanto o frontend está online:
1.  Navegue até a pasta `frontend`.
2.  Certifique-se de que o `.env` tem as mesmas chaves configuradas no Vercel.
3.  Execute o comando:
    ```bash
    npm run dev:agent
    ```
    *(Ou `npx tsx scripts/ai-agent.ts` se o script não estiver no package.json)*

### Opção B: Render / Railway
Você pode subir o script `ai-agent.ts` em um serviço de "Background Worker" nessas plataformas.

## 3. Webhooks (Opcional - n8n)

Se você optar por usar os Workflows do n8n (em vez do script `ai-agent.ts`):
1.  Importe os arquivos `.json` da pasta `docs` no seu n8n.
2.  Configure as credenciais e ative os workflows.
3.  Copie as URLs e adicione ao `.env` do Vercel como `N8N_WORKER_WEBHOOK_URL`.

## 4. Verificação Final

Após a implantação:
1.  Acesse a URL gerada pelo Vercel.
2.  Vá na página de "Ingestão".
3.  Faça o upload de um PDF de teste.
4.  Acompanhe os logs do seu **AI Agent** para ver a análise acontecendo em tempo real.
5.  Verifique se o status muda para "CONCLUÍDO" e o SCORE aparece no dashboard.

---
**Suporte:** Caso o build falhe no Vercel, verifique se todas as dependências estão no `package.json`.
