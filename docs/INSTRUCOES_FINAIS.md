# 🚀 Instruções Finais: Configuração dos 2 Workflows

Conforme solicitado, separei a lógica em **dois workflows dedicados** para máxima robustez.

## 1️⃣ Arquivos Gerados
Você encontrará dois arquivos JSON na raiz do projeto:
*   `ATS_Workflow_Email.json`: Para processar candidatos vindos da sincronização de email.
*   `ATS_Workflow_Upload.json`: Para processar uploads manuais (arrastar PDF).

## 2️⃣ Como Importar no n8n

1.  Abra seu n8n.
2.  Crie um novo workflow vazio.
3.  Menu (canto superior direito) → Import from File → Selecione `ATS_Workflow_Email.json`.
4.  Repita o processo para `ATS_Workflow_Upload.json`.

## 3️⃣ Configuração Obrigatória (Credenciais)

Em **AMBOS** os workflows, você precisa configurar os nós:
1.  **OpenAI Analysis**: Selecione sua credencial da OpenAI.
2.  **Update Supabase**: Selecione sua credencial do Supabase (Url + Service Role Key).

## 4️⃣ Ativação e URLs

1.  Ative os dois workflows (botão **Active**).
2.  Copie a URL de Produção de cada Webhook:
    *   No workflow de Email: Copie a URL e salve-a no `.env.local` na variável `N8N_EMAIL_WEBHOOK_URL`.
    *   No workflow de Upload: Copie a URL e salve-a no `.env.local` na variável `N8N_UPLOAD_WEBHOOK_URL`.

**Exemplo no .env.local:**
```env
N8N_EMAIL_WEBHOOK_URL=https://seu-n8n.com/webhook/ats-email
N8N_UPLOAD_WEBHOOK_URL=https://seu-n8n.com/webhook/ats-upload
```

## 5️⃣ Por que funcionará melhor?

*   **Separação de Responsabilidades**: O fluxo de email lida com `subject` e `date`. O fluxo de upload lida com arquivo direto.
*   **Segurança de Dados**: O Backend (Next.js) agora extrai o texto do PDF e CIDA o registro no banco **antes** de chamar o n8n. O n8n apenas analisa e atualiza.
*   **Sem Falhas de ID**: Como o registro já existe no banco quando o n8n é chamado, não há risco de "ID not found" ou duplicidade.

Pronto para rodar! 🚀
