# Configuração do Filtro de Emails

## 🎯 3 Modos Disponíveis

O workflow de email pode ser configurado para processar emails de 3 formas diferentes.

---

## Modo 1: Apenas Não Lidos (Recomendado) ✅

**Uso**: Processar candidatos novos automaticamente

**Vantagem**: Não reprocessa emails antigos

**Configuração**:

No nó "Email Trigger - Configurável", adicione em `options`:

```json
{
  "options": {
    "allowUnauthorizedCerts": false,
    "forceReconnect": 30,
    "customEmailConfig": "rules",
    "rules": {
      "rules": [
        {
          "key": "seen",
          "value": false
        }
      ]
    }
  }
}
```

---

## Modo 2: Apenas Lidos

**Uso**: Reprocessar emails antigos manualmente

**Vantagem**: Ignora novos emails, processa apenas histórico

**Configuração**:

```json
{
  "options": {
    "allowUnauthorizedCerts": false,
    "forceReconnect": 30,
    "customEmailConfig": "rules",
    "rules": {
      "rules": [
        {
          "key": "seen",
          "value": true
        }
      ]
    }
  }
}
```

⚠️ **ATENÇÃO**: Isso pode processar MUITOS emails de uma vez!

---

## Modo 3: Todos (Lidos + Não Lidos)

**Uso**: Migração inicial ou reprocessamento completo

**Vantagem**: Pega tudo da caixa de entrada

**Configuração**:

Remova `customEmailConfig` e `rules` do `options`:

```json
{
  "options": {
    "allowUnauthorizedCerts": false,
    "forceReconnect": 30
  }
}
```

⚠️ **CRÍTICO**: Na primeira execução, vai processar **TODOS** os emails!

---

## 🔒 Limitando por Data (Recomendado)

Para evitar processar milhares de emails antigos, adicione validação por data no Code Node "Extrair PDF":

```javascript
// Adicione no início do code node
const emailDate = new Date($json.date);
const daysOld = (Date.now() - emailDate) / (1000 * 60 * 60 * 24);

// Ignorar emails mais antigos que 30 dias
if (daysOld > 30) {
  return [];  // Pula este email
}

// ... resto do código
```

---

## 📊 Comparação Rápida

| Modo | Processa | Risco Duplicação | Uso |
|------|----------|------------------|-----|
| **Não Lidos** | Novos emails | ❌ Baixo | Produção |
| **Lidos** | Histórico | ⚠️ Alto | Manual |
| **Todos** | Tudo | 🔴 Muito Alto | Migração |

---

## 🎬 Cenários de Uso

### Cenário 1: Produção Normal
**Config**: Apenas não lidos  
**Frequência**: A cada minuto  
**Limite data**: 7 dias

### Cenário 2: Migração Inicial
**Config**: Todos (lidos + não lidos)  
**Frequência**: Manual (desativar após)  
**Limite data**: 90 dias

### Cenário 3: Reprocessar Candidatos
**Config**: Apenas lidos  
**Frequência**: Manual  
**Limite data**: Específico (ex: último mês)

---

## 🛡️ Proteção Contra Duplicação

O workflow já tem proteção básica:
- `postProcessAction: "read"` marca email como lido após processar
- Emails já processados não serão lidos novamente em modo "não lidos"

**Proteção adicional (opcional)**:

Adicione tabela de controle no Supabase:

```sql
CREATE TABLE email_processed_log (
  email_uid TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  candidate_id UUID
);
```

E verifique antes de processar:

```javascript
// Verificar se já foi processado
const emailUid = $json.uid;
const alreadyProcessed = await checkIfProcessed(emailUid);
if (alreadyProcessed) {
  return [];  // Pula
}
```

---

**Recomendação**: Use **Modo 1 (Apenas Não Lidos)** para produção normal.
