# 🎯 Workflow SIMPLIFICADO - Guia Rápido

## O Problema do Workflow Anterior

O workflow anterior usava **LangChain** (nós `@n8n/n8n-nodes-langchain.*`) que:
- É complexo demais para iniciantes
- Requer configuração de múltiplos "sub-nós"  
- Tem conexões confusas (ai_languageModel, ai_outputParser)

## Nova Abordagem: HTTP Request Direto

Este workflow é **ultramente simples**:

```
Webhook → OpenAI (HTTP) → Parse JSON → Supabase → Response
           ↓ (se erro)
      Error Trigger → Log no DB → Error Response
```

---

## 📋 Configuração (5 minutos)

### 1. Importar no n8n
1. Abra n8n
2. ➕ Add Workflow → Import from File
3. Selecione `n8n-workflow-SIMPLES.json`

### 2. Configurar Credenciais OpenAI
1. No node **"OpenAI (HTTP)"**, clique em "Credential to connect with"
2. Selecione ou crie uma:
   - Type: `OpenAI API`
   - API Key: `sk-proj-...` (pegue em https://platform.openai.com/api-keys)

### 3. Configurar Credenciais Supabase
1. No node **"Atualizar Supabase"**, clique em credentials
2. Crie nova:
   - Host: `https://seu-projeto.supabase.co`
   - API Key: Copie o **Service Role Key** do Supabase (Settings → API → service_role)

### 4. Ativar
1. Botão **"Active"** no canto superior direito
2. Copie a URL do Webhook (aparece no node "Webhook")

### 5. Configurar .env do Next.js

```env
N8N_WORKER_WEBHOOK_URL=https://seu-n8n.com/webhook/ats-processing
```

---

## ✅ Testar

### No n8n (Manual Test)
1. Clique no node "Webhook" → botão "Listen for Test Event"
2. Em outro terminal:

```bash
curl -X POST https://seu-n8n.com/webhook/ats-processing \
  -H "Content-Type: application/json" \
  -d '{
    "source": "test",
    "resume_text": "João Silva, 5 anos React/Node, email: joao@test.com",
    "raw_id": "123-test-id"
  }'
```

**Resposta Esperada**:
```json
{
  "success": true,
  "candidato": "João Silva",
  "score": 75
}
```

---

## 🔍 Diferenças vs Workflow Antigo

| Aspecto | Workflow Antigo | Workflow NOVO |
|---------|----------------|---------------|
| **Nós** | 15 nodes | 8 nodes |
| **Conexões** | 20+ links | 6 links |
| **Tipo OpenAI** | LangChain (complexo) | HTTP Request (direto) |
| **Output Parser** | Structured Parser (sub-nó extra) | `response_format: json_object` (nativo) |
| **Error Handling** | Error Trigger separado | Mesma coisa (funciona) |

---

## 🐛 Troubleshooting

### Erro: "Unexpected token in JSON"
- **Causa**: OpenAI retornou texto em vez de JSON
- **Solução**: No prompt do node "OpenAI (HTTP)", reforce: `"Retorne APENAS JSON válido. Nenhum texto extra."`

### Erro: "Cannot read property 'raw_id'"
- **Causa**: Webhook não está recebendo o campo corretamente
- **Solução**: Verifique se o Next.js está enviando `{"body": {"raw_id": "..."}}`

### Score sempre igual
- **Causa**: `temperature` muito baixa
- **Solução**: No JSON da OpenAI, mude `"temperature": 0.3` para `0.5`

---

## 🚀 Próximo Passo

Após testar o workflow:
1. Vá para `/ingestion` no seu ATS
2. Arraste um PDF de currículo
3. Acompanhe a execução no n8n (aba "Executions")
4. Confira se o Supabase foi atualizado

**Importante**: Este workflow usa a API da OpenAI diretamente (mais barato e confiável que LangChain para casos simples).
