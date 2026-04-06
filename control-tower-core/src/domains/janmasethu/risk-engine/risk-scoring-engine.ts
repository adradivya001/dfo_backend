import { RiskLevel } from './keyword-detector';
import { BertRiskLevel } from './bert-risk-analyzer';

export class RiskScoringEngine {
    calculateScore(signals: {
        keywordLevel: RiskLevel;
        sentimentScore: number;
        bertLevel: BertRiskLevel;
        contextRisk?: boolean;
    }): number {
        let totalScore = 0;

        // 1. Keyword Signals (Hardened Safety Net)
        if (signals.keywordLevel === RiskLevel.RED) totalScore += 80;
        else if (signals.keywordLevel === RiskLevel.YELLOW) totalScore += 40;

        // 2. Sentiment Signal (threshold based)
        if (signals.sentimentScore > 20) totalScore += 20;

        // 3. BERT Signal
        if (signals.bertLevel === BertRiskLevel.HIGH_RISK) totalScore += 40;
        else if (signals.bertLevel === BertRiskLevel.MODERATE_RISK) totalScore += 20;

        // 4. Context Signal
        if (signals.contextRisk) totalScore += 20;

        return totalScore;
    }
}
