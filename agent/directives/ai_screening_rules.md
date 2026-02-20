# SOP: Triagem Inteligente (AI Screening)

## Objetivo
Realizar uma análise "auditável" e "explicável" de cada candidato em relação aos requisitos de uma vaga específica.

## Processo (Multi-Agent)
1.  **Agente Extrator**: Valida os dados reais do currículo (não pode haver alucinação).
2.  **Agente Analista de Vaga**: Lê a `jobs.description` e extrai os "Must-haves" e "Nice-to-haves".
3.  **Agente de Cross-Validation**: Compara os dois conjuntos e gera:
    -   `semantic_match_score`: Pontuação de 0 a 100 baseada em fit técnico e cultura.
    -   `skills_gap`: Lista de tecnologias/experiências faltantes.
    -   `ai_reasoning`: Um parágrafo explicando o *porquê* da nota, citando partes específicas do currículo.

## Regras de Decisão
- **SCORE > 85**: Mover para `TRIAGEM_POSITIVA`.
- **SCORE < 40**: Mover para `REJEITADO_AUTOMATICO` (avisar humano).
- **TALENTO JOVEM**: Aplicar Scoring Adaptativo (Potencial > Experiência). Usar status `Perfil em Ascensão`.
- **CONFLITO**: Se o `confidence` da extração for < 0.7, marcar para `REVISÃO_HUMANA`.

## Auditoria & Extração
- **NER**: Nome sempre extraído do conteúdo, nunca do metadado do arquivo.
- **Deep Scan**: Varredura obrigatória em todas as seções para exaustividade de competências.
- Todos os resultados devem ser salvos na `screening_matrix` para que o recrutador possa ver o log de raciocínio da IA antes de confirmar a movimentação do candidato.
