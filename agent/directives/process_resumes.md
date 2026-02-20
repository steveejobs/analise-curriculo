# SOP: Processar Currículos (Ingestion Engine)

## Objetivo
Processar currículos de múltiplas fontes (Email, Upload, API) e convertê-los em candidatos estruturados.

## Entradas
- Arquivo (PDF/DOCX) ou Texto brutos.
- Metadata (company_id, source_type).

## Fluxo
1. Centralizar no endpoint `POST /api/ingestion/process`.
2. Salvar arquivo no Storage (Supabase).
3. Registrar log de ingestão com status `RECEIVED`.
4. Disparar Worker n8n para extração via IA.
5. Receber retorno via Webhook em `POST /api/webhooks/candidates`.
6. Persistir candidato e atualizar log para `SUCCESS`.

## Ferramentas
- **Storage**: Supabase Bucket `raw_resumes`.
- **Worker**: n8n Processing Worker v2.
- **Backend**: Next.js API Routes.

## Tratamento de Erros
- Em caso de falha na IA: Registrar no `ingestion_logs` e disparar notificação.
- Em caso de duplicidade: Ignorar via message_id.
