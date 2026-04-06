import { Injectable, Logger } from '@nestjs/common';
import { JanmasethuRepository } from './janmasethu.repository';
import { JanmasethuUserRole } from './janmasethu.types';
import { AuditService } from '../../kernel/audit/audit.service';
import { AuditModule } from '../../kernel/audit/audit.module';

export enum AuditAction {
    PII_VIEW = 'PII_VIEW_ACCESS',
    RECORD_UPDATE = 'MEDICAL_RECORD_UPDATE',
    SECURITY_ALERT = 'SECURITY_THRESHOLD_EXCEEDED',
    SYSTEM_CONFIG = 'SYSTEM_CONFIGURATION_CHANGE'
}

@Injectable()
export class JanmasethuAuditService {
    private readonly logger = new Logger(JanmasethuAuditService.name);

    constructor(
        private readonly repository: JanmasethuRepository,
        private readonly kernelAudit: AuditService,
    ) { }

    /**
     * LOG PATIENT DATA ACCESS (PII Compliance)
     * Mandatory for HIPAA / Medical Laws.
     */
    async logPIIAccess(actorId: string, actorType: JanmasethuUserRole | 'AI' | 'SYSTEM', patientId: string, reason: string) {
        this.logger.warn(`AUDIT: [${actorType}] ${actorId} accessed PII for patient ${patientId}. Reason: ${reason}`);

        await this.kernelAudit.append({
            actor_id: actorId,
            actor_type: 'HUMAN',
            event_type: 'PII_ACCESS',
            payload: { patient_id: patientId, reason, timestamp: new Date().toISOString() }
        } as any);
    }

    /**
     * LOG CLINICAL RECORD UPDATE
     */
    async logClinicalUpdate(actorId: string, action: string, patientId: string, change: any) {
        this.logger.log(`AUDIT: Clinical update for patient ${patientId} by ${actorId}: ${action}`);

        await this.kernelAudit.append({
            actor_id: actorId,
            actor_type: 'HUMAN',
            event_type: 'CLINICAL_UPDATE',
            payload: { patient_id: patientId, action, change }
        } as any);
    }

    /**
     * FETCH AUDIT HISTORY (Compliance Review)
     */
    async getAuditHistory(limit: number = 100) {
        return this.kernelAudit.getAll();
    }
}
