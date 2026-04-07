import { Injectable, Logger, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { DFODocument, DocumentType, DocumentGenerationStatus } from './document.types';

@Injectable()
export class DocumentRepository {
    private readonly logger = new Logger(DocumentRepository.name);
    private readonly TABLE = 'dfo_documents';
    private readonly ACCESS_LOG_TABLE = 'dfo_document_access_logs';

    constructor(
        @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient
    ) { }

    /**
     * Find an existing document by idempotency key (prescription_id + version).
     * Prevents duplicate documents from being generated for the same prescription.
     */
    async findByPrescriptionId(prescriptionId: string): Promise<DFODocument | null> {
        const { data, error } = await this.supabase
            .from(this.TABLE)
            .select('*')
            .eq('prescription_id', prescriptionId)
            .eq('generation_status', DocumentGenerationStatus.GENERATED)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            this.logger.warn(`findByPrescriptionId failed: ${error.message}`);
            return null;
        }
        return data as DFODocument;
    }

    /**
     * Create a pending document record BEFORE generation starts.
     * This is the start of the idempotent generation flow.
     */
    async createPendingDocument(dto: {
        patient_id: string;
        consultation_id?: string;
        prescription_id?: string;
        type: DocumentType;
        file_name: string;
        file_path: string;
        generated_by: string;
    }): Promise<DFODocument> {
        const { data, error } = await this.supabase
            .from(this.TABLE)
            .insert([{
                ...dto,
                mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                generation_status: DocumentGenerationStatus.PENDING,
                version: 1,
            }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create document record: ${error.message}`);
        return data as DFODocument;
    }

    /**
     * Mark a document as successfully generated with file size.
     */
    async markAsGenerated(documentId: string, fileSizeBytes: number): Promise<void> {
        const { error } = await this.supabase
            .from(this.TABLE)
            .update({
                generation_status: DocumentGenerationStatus.GENERATED,
                file_size_bytes: fileSizeBytes,
                updated_at: new Date(),
            })
            .eq('id', documentId);

        if (error) throw new Error(`Failed to mark document as generated: ${error.message}`);
    }

    /**
     * Mark a document as failed with an error message.
     */
    async markAsFailed(documentId: string, errorMessage: string): Promise<void> {
        const { error } = await this.supabase
            .from(this.TABLE)
            .update({
                generation_status: DocumentGenerationStatus.FAILED,
                error_message: errorMessage,
                updated_at: new Date(),
            })
            .eq('id', documentId);

        if (error) this.logger.error(`Failed to mark document as failed: ${error.message}`);
    }

    /**
     * Fetch all documents for a patient (for the patient document listing API).
     */
    async findByPatientId(patientId: string): Promise<DFODocument[]> {
        const { data, error } = await this.supabase
            .from(this.TABLE)
            .select('*')
            .eq('patient_id', patientId)
            .eq('generation_status', DocumentGenerationStatus.GENERATED)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch patient documents: ${error.message}`);
        return (data || []) as DFODocument[];
    }

    /**
     * Fetch a single document record by its ID.
     */
    async findById(documentId: string): Promise<DFODocument | null> {
        const { data, error } = await this.supabase
            .from(this.TABLE)
            .select('*')
            .eq('id', documentId)
            .maybeSingle();

        if (error) return null;
        return data as DFODocument;
    }

    /**
     * Log every access (signed URL generation) for HIPAA audit compliance.
     */
    async logAccess(dto: {
        document_id: string;
        accessed_by: string;
        role: string;
        expires_at: Date;
    }): Promise<void> {
        const { error } = await this.supabase
            .from(this.ACCESS_LOG_TABLE)
            .insert([dto]);

        if (error) this.logger.warn(`Access log insert failed: ${error.message}`);
    }

    /**
     * Increment the version of an existing document (for regeneration).
     */
    async incrementVersion(prescriptionId: string, newFilePath: string, newFileName: string): Promise<DFODocument> {
        const existing = await this.findByPrescriptionId(prescriptionId);
        if (!existing) throw new Error('No existing document to version');

        const { data, error } = await this.supabase
            .from(this.TABLE)
            .update({
                file_path: newFilePath,
                file_name: newFileName,
                version: existing.version + 1,
                generation_status: DocumentGenerationStatus.PENDING,
                updated_at: new Date(),
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw new Error(`Failed to increment document version: ${error.message}`);
        return data as DFODocument;
    }
}
