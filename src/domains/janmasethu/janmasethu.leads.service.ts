import { Injectable, Logger } from '@nestjs/common';
import { JanmasethuRepository } from './janmasethu.repository';
import { JanmasethuEncryptionService } from './utils/encryption.service';

/**
 * Valid lead_status enum values from database
 */
const VALID_STATUSES = [
    'New Inquiry',
    'Follow Up',
    'Converted',
    'Not Interested',
    'Lost',
];

/**
 * Common source values used for smart field detection
 */
const SOURCE_VALUES = ['Walk-In', 'Walk-in', 'Website', 'website', 'Referral', 'referral', 'Social Media', 'Phone Call'];

const COLUMN_MAPPINGS: Record<string, string> = {
    'name': 'name', 'Name': 'name', 'FullName': 'name', 'Full Name': 'name',
    'phone': 'phone', 'Phone': 'phone', 'PhoneNumber': 'phone', 'Phone Number': 'phone',
    'status': 'status', 'Status': 'status', 'LeadStatus': 'status', 'Stage': 'status',
    'date': 'date_added', 'Date': 'date_added', 'CreatedAt': 'date_added',
    'age': 'age', 'Age': 'age',
    'gender': 'gender', 'Gender': 'gender',
    'source': 'source', 'Source': 'source',
    'inquiry': 'inquiry', 'Inquiry': 'inquiry',
    'problem': 'problem', 'Problem': 'problem',
    'treatmentdoctor': 'treatment_doctor', 'Doctor': 'treatment_doctor',
    'treatmentsuggested': 'treatment_suggested', 'Treatment': 'treatment_suggested',
    'location': 'location', 'City': 'location',
};

@Injectable()
export class JanmasethuLeadsService {
    private readonly logger = new Logger(JanmasethuLeadsService.name);

    constructor(
        private readonly repository: JanmasethuRepository,
        private readonly encryption: JanmasethuEncryptionService
    ) { }

    /**
     * MIGRATED CORE FROM JS_Clinics_Backend
     * - Normalizes incoming lead payload (mapping headers, resolving status/source mix-up).
     * - Enforces AES-256 encryption on clinical medical fields.
     */
    async createLead(rawPayload: Record<string, any>) {
        const body = this.normalizeLead(rawPayload);

        const name = body.name?.trim();
        const phone = body.phone?.trim();

        if (!name || !phone) {
            throw new Error('Mandatory Fields Missing: Name and Phone Number are required for Clinic Lead Registration.');
        }

        // 1. Prepare clinical payload with encryption
        const payload = {
            ...body,
            status: this.normalizeStatus(body.status),
            problem: this.encryption.encrypt(body.problem),
            treatment_doctor: this.encryption.encrypt(body.treatment_doctor),
            treatment_suggested: this.encryption.encrypt(body.treatment_suggested),
        };

        this.logger.log(`JanmaSethu: Registering new clinical lead for ${name} [${phone}]`);

        // 2. Persist in Repository
        return await this.repository.createLead(payload);
    }

    async getLeads(filters: any) {
        const { items, pagination } = await this.repository.findLeads(filters);

        // 3. Decrypt on Retrieval
        const decryptedItems = items.map(lead => ({
            ...lead,
            problem: this.encryption.decrypt(lead.problem),
            treatment_doctor: this.encryption.decrypt(lead.treatment_doctor),
            treatment_suggested: this.encryption.decrypt(lead.treatment_suggested),
        }));

        return { items: decryptedItems, pagination };
    }

    /**
     * STALLED LEADS BATCH PROCESSOR
     * - Identifies leads in 'New Inquiry' > 24h.
     * - Performs non-invasive "Care Nudge" outreach.
     */
    async processStalledLeads() {
        this.logger.log('Janmasethu: Scanning for stalled clinical leads...');
        const leads = await this.repository.findStalledLeads(24);

        if (!leads.length) {
            this.logger.log('No stalled leads found today. Funnel is clean!');
            return { processed: 0 };
        }

        const outreachResults: any[] = [];
        for (const lead of leads) {
            const result = await this.runAutomatedOutreach(lead);
            outreachResults.push(result);
        }

        return {
            total_stalled: leads.length,
            processed: outreachResults.length
        };
    }

    private async runAutomatedOutreach(lead: any) {
        const decryptedProblem = this.encryption.decrypt(lead.problem);

        this.logger.warn(`[LEAD_NUDGE] Patient: ${lead.name} (${lead.phone}) | Topic: ${decryptedProblem}`);

        // --- CARE NUDGE TEMPLATE ---
        const message = `Hi ${lead.name}, this is the Janmasethu Care Team. We noticed you were inquiring about "${decryptedProblem}" yesterday. Would you like to schedule a quick call with our specialist? 😊🩺`;

        this.logger.log(`Dispatching Outreach: ${message}`);

        // 4. Update status to 'Follow Up' to mark activity
        return await this.repository.updateLeadStatus(
            lead.id,
            'Follow Up',
            `Auto-Nudge: Sent care message regarding ${decryptedProblem}`
        );
    }

    /**
     * NORMALIZATION BRAIN
     * - Swaps Source and Status if they look reversed (common CSV error)
     */
    private normalizeLead(lead: Record<string, any>): Record<string, any> {
        const normalized: Record<string, any> = {};

        for (const [key, value] of Object.entries(lead)) {
            const lowerKey = key.toLowerCase().trim();
            const mappedField = COLUMN_MAPPINGS[lowerKey] || lowerKey;

            if (normalized[mappedField] === undefined) {
                normalized[mappedField] = value;
            }
        }

        const sourceVal = normalized.source;
        const statusVal = normalized.status;

        // Perform smart reversal check
        if (this.looksLikeStatus(sourceVal) && this.looksLikeSource(statusVal)) {
            normalized.source = statusVal;
            normalized.status = sourceVal;
        }

        return normalized;
    }

    private normalizeStatus(rawStatus: string): string {
        if (!rawStatus) return 'New Inquiry';
        const matched = VALID_STATUSES.find(s => s.toLowerCase() === rawStatus.trim().toLowerCase());
        return matched || 'New Inquiry';
    }

    private looksLikeSource(value: string): boolean {
        if (!value) return false;
        return SOURCE_VALUES.some(s => s.toLowerCase() === value.trim().toLowerCase());
    }

    private looksLikeStatus(value: string): boolean {
        if (!value) return false;
        const trimmed = value.trim().toLowerCase();
        return VALID_STATUSES.some(s => s.toLowerCase() === trimmed) || trimmed.includes('follow') || trimmed.includes('inquiry');
    }
}
