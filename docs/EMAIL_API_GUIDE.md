# Guia: Ingestão de Email via API com Gmail

Este workflow integra-se nativamente com o Gmail para sincronizar currículos por email através de chamadas de API.

## 🚀 Como Funciona

**Endpoint**: `https://n8n.lynxa.cloud/webhook/ats-email-sync`  
**Método**: `POST`  
**Autenticação**: OAuth2 do Gmail (configurada no n8n)

### 📋 Parâmetros (JSON Body)

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `status` | string | Filtra por lidos/não lidos: `unread`, `read`, `all` | `"unread"` |
| `limit` | integer | Máximo de emails a processar. Default: 10 | `20` |
| `sender` | string | Filtra por remetente específico (opcional) | `"candidato@gmail.com"` |

---

## 💻 Exemplos de Uso

### 1. Buscar Novos Currículos (Recomendado)
```bash
curl -X POST https://n8n.lynxa.cloud/webhook/ats-email-sync \
     -H "Content-Type: application/json" \
     -d '{
       "status": "unread",
       "limit": 10
     }'
```

### 2. Reprocessar Emails de um Candidato Específico
```bash
curl -X POST https://n8n.lynxa.cloud/webhook/ats-email-sync \
     -H "Content-Type: application/json" \
     -d '{
       "sender": "joao.silva@gmail.com",
       "limit": 5
     }'
```

### 3. Sincronizar Todos os Emails com Anexos
```bash
curl -X POST https://n8n.lynxa.cloud/webhook/ats-email-sync \
     -H "Content-Type: application/json" \
     -d '{
       "status": "all"
     }'
```

---

## ⚙️ Configuração no n8n

### 1. Criar Credencial OAuth2 do Gmail
1. No n8n, vá em **Credentials** → **New**
2. Selecione **Gmail OAuth2 API**
3. Autorize o acesso à conta Gmail do RH
4. Salve como `Gmail RH ATS`

### 2. Importar o Workflow
1. Baixe: [n8n-email-ingestion-workflow.json](file:///c:/Users/jarde/Desktop/Analise%20de%20Curriculo/intelligent-ats/n8n-email-ingestion-workflow.json)
2. No n8n: **Workflows** → **Import from File**
3. A credencial `gmail-oauth-credentials` será solicitada

### 3. Ativar o Workflow
- Clique em **Active** no canto superior direito

---

## 📊 Filtros Avançados

O workflow aplica automaticamente:
- ✅ `has:attachment` - Apenas emails com anexos
- ✅ `is:unread` ou `is:read` - Conforme parâmetro `status`
- ✅ `from:remetente` - Se `sender` for especificado

### Formato de Arquivos Suportados
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)

---

## 🔐 Vantagens do Gmail OAuth2

- **Segurança**: Não precisa de senha de app ou IMAP habilitado
- **Labels**: Integra com labels do Gmail (ex: marcar como processado)
- **Performance**: Acesso direto à API do Google
- **Recursos**: Suporta filtros nativos do Gmail (ex: `from:`, `subject:`)

---

## 🧪 Teste Rápido

```bash
# 1. Envie um email de teste com currículo em PDF/Word para o Gmail configurado
# 2. Execute:
curl -X POST https://n8n.lynxa.cloud/webhook/ats-email-sync \
     -H "Content-Type: application/json" \
     -d '{"status": "unread", "limit": 1}'
     
# 3. Verifique os logs no n8n para acompanhar o processamento
```
