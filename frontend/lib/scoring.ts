
export interface ScoringWeights {
    tech: number;
    culture: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
    tech: 70,
    culture: 30
};

export function calculateWeightedScore(candidate: any, weights: ScoringWeights = DEFAULT_WEIGHTS) {
    if (!candidate || candidate.ai_status !== 'DONE') return 0;

    const evalData = candidate.criteria_evaluation || {};

    // Schema v1.2 logic (detailed scores)
    if (evalData.schema_version === '1.2' && evalData.base_scores) {
        const tech = evalData.base_scores.tecnica || 0;
        const cult = evalData.base_scores.cultura || 0;
        const perf = evalData.base_scores.performance || 0;

        // User weighted score + performance bonus (0.1x)
        return Math.round(
            (tech * (weights.tech / 100)) +
            (cult * (weights.culture / 100)) +
            (perf * 0.1)
        );
    }

    // Legacy logic (v1.1 or earlier)
    const techScore = candidate.ai_score || 0;
    const softSkillsCount = evalData.soft_skills_analysis?.detected?.length || 0;
    const leadershipStyle = evalData.profile?.leadership_style || evalData.leadership_evaluation?.style_detected;

    const softScore = Math.min((softSkillsCount / 5) * 60, 60);
    const leadershipScore = leadershipStyle && leadershipStyle !== 'None' ? 40 : 0;
    const cultureScore = softScore + leadershipScore;

    return Math.round(
        (techScore * (weights.tech / 100)) +
        (cultureScore * (weights.culture / 100))
    );
}
