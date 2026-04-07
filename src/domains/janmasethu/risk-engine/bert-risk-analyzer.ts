import axios from 'axios';
import { Logger } from '@nestjs/common';

export enum BertRiskLevel {
    LOW_RISK = 'LOW_RISK',
    MODERATE_RISK = 'MODERATE_RISK',
    HIGH_RISK = 'HIGH_RISK',
}

const LABEL_MAP: Record<string, BertRiskLevel> = {
    HIGH_RISK: BertRiskLevel.HIGH_RISK,
    MODERATE_RISK: BertRiskLevel.MODERATE_RISK,
    LOW_RISK: BertRiskLevel.LOW_RISK,
};

export class BertRiskAnalyzer {
    private readonly logger = new Logger(BertRiskAnalyzer.name);
    private readonly apiUrl: string;

    constructor() {
        this.apiUrl = process.env.BERT_API_URL ?? 'https://ungaraged-soony-maricela.ngrok-free.dev/predict';
    }

    async analyze(text: string): Promise<BertRiskLevel> {
        try {
            const response = await axios.get<{
                message: string;
                risk_level: string;
                confidence: number;
            }>(
                `${this.apiUrl}?message=${encodeURIComponent(text)}`,
                {
                    timeout: 2000,
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                },
            );

            const label = response.data?.risk_level?.toUpperCase();

            if (label === "RED") {
                return BertRiskLevel.HIGH_RISK;
            }

            if (label === "YELLOW") {
                return BertRiskLevel.MODERATE_RISK;
            }

            return BertRiskLevel.LOW_RISK;

        } catch (err: any) {
            this.logger.warn(
                `BertRiskAnalyzer: API call failed (${err?.message ?? "unknown error"}). Falling back to LOW_RISK.`,
            );

            return BertRiskLevel.LOW_RISK;
        }
    }
}
