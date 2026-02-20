# 🚀 Guia de Instalação: n8n Workflow Production

## 📋 Pré-requisitos

1. **n8n instalado** (versão 1.0+)
2. **Credenciais configuradas**:
   - OpenAI API Key
   - Supabase Project URL + Service Role Key

---

## 🔧 Passo a Passo

### 1. Importar o Workflow

1. Acesse seu n8n (local ou cloud)
2. Clique em **➕ Add Workflow**
3. Menu superior direito → **Import from File**
4. Selecione: `n8n-workflow-PRODUCTION.json`

### 2. Configurar Credenciais

#### OpenAI
1. No workflow, clique no node **🤖 OpenAI GPT-4o**
2. Em "Credential for OpenAI", clique em **Create New**
3. Cole sua API Key da OpenAI
4. Salve

#### Supabase
1. Clique em qualquer node Supabase (💾 Atualizar Supabase)
2. Create New Credential
3. Preencha:
   - **Host**: `https://seu-projeto.supabase.co`
   - **Service Role Key**: Copie do dashboard Supabase (Settings → API)

### 3. Ativar o Workflow

1. Clique no botão **Active** (canto superior direito)
2. Copie a **Webhook URL** do node 📨 (formato: `https://seu-n8n.com/webhook/ats-candidate-processing`)

### 4. Configurar Variável de Ambiente (Next.js)

No arquivo `.env.local` do projeto:

```env
N8N_WORKER_WEBHOOK_URL=https://seu-n8n.com/webhook/ats-candidate-processing
```

---

## ✅ Validar Funcionamento

### Teste Manual no n8n
1. Clique no node 📨 **Receber Candidato**
2. Aba "Test URL"
3. Execute este cURL:

```bash
curl -X POST https://seu-n8n.com/webhook/ats-candidate-processing \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual_test",
    "resume_text": "João Silva, desenvolvedor fullstack com 5 anos de experiência em React, Node.js e PostgreSQL. Email: joao@example.com",
    "raw_id": "test-123"
  }'
```

**Resposta Esperada**:
```json
{
  "success": true,
  "applicationId": "test-123",
  "message": "✅ Candidato João Silva processado com sucesso!\nScore: 75/100\nStatus: reviewing"
}
```

### Teste Real (Upload no ATS)
1. Acesse `http://localhost:3000/ingestion`
2. Arraste um PDF de currículo
3. Verifique o console do n8n para logs de execução
4. Confira o Supabase se o registro foi atualizado

---

## 🛠️ Troubleshooting

### Erro: "No application ID to update"
- **Causa**: O webhook não está recebendo o campo `raw_id`
- **Solução**: Verifique se a API do Next.js (`/api/analyze`) está enviando `raw_id` no payload

### Erro: "Supabase credentials not found"
- **Causa**: Credenciais não configuradas
- **Solução**: Repita o Passo 2

### Score sempre 0 ou JSON mal formatado
- **Causa**: Structured Output Parser pode falhar com prompts ambíguos
- **Solução**: 
  1. Aumente `temperature` de 0.2 para 0.3 no node OpenAI
  2. Verifique se o `resume_text` está sendo enviado corretamente

---

## 🎯 Otimizações Avançadas

### Habilitar Retry Automático (já configurado)
O node **💾 Atualizar Supabase** já tem:
- `retryOnFail: true`
- `maxTries: 3`
- `waitBetweenTries: 1000ms`

### Adicionar Memória (Conversações)
Para chat agents, adicione um node **Window Buffer Memory** conectado ao LangChain Chain.

### Logs & Monitoring
No n8n Cloud/Self-hosted com PostgreSQL:
- Acesse **Executions** no menu lateral
- Filtre por "Failed" para ver erros
- Use o `execution_id` para debugging

---

## 📚 Recursos

- [Documentação n8n LangChain](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm/)
- [Structured Output Parser](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured/)
- [Error Handling Best Practices](https://docs.n8n.io/flow-logic/error-handling/)
