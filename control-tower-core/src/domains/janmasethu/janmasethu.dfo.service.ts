import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JanmasethuRepository } from './janmasethu.repository';
import { JanmasethuEncryptionService } from './utils/encryption.service';
import {
    DFOPatient, DFOAppointment, DFOConsultation, JourneyStage,
    AppointmentStatus, ConsultationStatus, DFOPrescription, DFOMedicalReport
} from './dfo.types';

import { EngagementService } from './engagement/engagement.service';

@Injectable()
export class JanmasethuDFOService implements OnModuleInit {
    private readonly logger = new Logger(JanmasethuDFOService.name);

    constructor(
        private readonly repository: JanmasethuRepository,
        private readonly engagementService: EngagementService,
        private readonly encryption: JanmasethuEncryptionService,
        // @InjectQueue('appointment_checker') private readonly checkerQueue: Queue
    ) { }

    async onModuleInit() {
        this.logger.log('DFO Clinical Engine: Checking for seed data...');
        try {
            // 1. AUTO-SEED DOCTORS (MULTI-PROFILE)
            const doctors = await this.repository.findDoctorAvailability();
            if (doctors.length <= 1) {
                this.logger.log('SEEDING CLINIC WORKFORCE...');
                await this.repository.upsertDoctor({
                    id: '550e8400-e29b-41d4-a716-446655440001',
                    full_name: 'Dr. Divya Sharma',
                    specialization: ['Clinical Lead', 'General Practitioner'],
                    is_available: true
                });
                await this.repository.upsertDoctor({
                    id: '550e8400-e29b-41d4-a716-446655440002',
                    full_name: 'Dr. Sarah Smith',
                    specialization: ['Obstetrics & Gynecology'],
                    is_available: true
                });
                await this.repository.upsertDoctor({
                    id: '550e8400-e29b-41d4-a716-556655440003',
                    full_name: 'Dr. Rahul Kumar',
                    specialization: ['IVF Specialist'],
                    is_available: true
                });
            }

            // 2. AUTO-SEED SLOTS & APPOINTMENTS (MULTI-PROFILE LOAD)
            const pts = await this.repository.findAllPatients();
            const apps = await this.repository.findPastDueAppointments(new Date(Date.now() + 1000000000));
            if (apps.length <= 1 && pts.length > 0) {
                this.logger.log('SEEDING MULTI-PROFILE APPOINTMENTS...');
                await this.repository.createAppointment({ patient_id: '550e8400-e29b-41d4-a716-44665544a001', doctor_id: '550e8400-e29b-41d4-a716-446655440001', appointment_date: new Date(), status: AppointmentStatus.SCHEDULED });
                await this.repository.createAppointment({ patient_id: '550e8400-e29b-41d4-a716-44665544a002', doctor_id: '550e8400-e29b-41d4-a716-446655440002', appointment_date: new Date(), status: AppointmentStatus.SCHEDULED });
                await this.repository.createAppointment({ patient_id: '550e8400-e29b-41d4-a716-556655440003', doctor_id: '550e8400-e29b-41d4-a716-556655440003', appointment_date: new Date(), status: AppointmentStatus.SCHEDULED });
            }

            // 3. AUTO-SEED PATIENTS (MOCK COHORT)
            if (pts.length === 0) {
                this.logger.log('NO PATIENTS FOUND. Seeding "Sara Johnson", "Priya Nair", "Anita Das"...');
                await this.repository.upsertDFOPatient({ id: '550e8400-e29b-41d4-a716-44665544a001', full_name: 'Sara Johnson', phone_number: '+919900112233', journey_stage: JourneyStage.TRYING_TO_CONCEIVE });
                await this.repository.upsertDFOPatient({ id: '550e8400-e29b-41d4-a716-44665544a002', full_name: 'Priya Nair', phone_number: '+919900112234', journey_stage: JourneyStage.PREGNANT });
                await this.repository.upsertDFOPatient({ id: '550e8400-e29b-41d4-a716-44665544a003', full_name: 'Anita Das', phone_number: '+919900112235', journey_stage: JourneyStage.POSTPARTUM });
            }

            // 4. AUTO-SEED AUDIT LOGS
            const logs = await this.repository.findAuditLogs();
            if (logs.length === 0) {
                this.logger.log('CLEAN AUDIT. Seeding Compliance Ledger...');
                await this.repository.insertAuditLog({ actor_id: 'DR_DIVYA_001', actor_type: 'DOCTOR', action: 'SECURE_PII_ACCESS', payload: { module: 'PATIENTS' } });
                await this.repository.insertAuditLog({ actor_id: 'DR_DIVYA_001', actor_type: 'DOCTOR', action: 'LOGIN_SUCCESS', payload: { ip: '127.0.0.1' } });
                await this.repository.insertAuditLog({ actor_id: 'SYSTEM_AI', actor_type: 'AI', action: 'SENTIMENT_ALERT_TRIGGERED', payload: { thread: 'TX-92' } });
            }

            this.logger.log('CONTROL TOWER: Mission Readiness Seeding Complete.');

        } catch (error) {
            this.logger.error(`DFO Startup Failure: ${error.message}`);
        }
    }

    /**
     * OMNICHANNEL PATIENT IDENTITY (Continuity)
     */
    async registerOrUpdatePatient(dto: Partial<DFOPatient>): Promise<DFOPatient> {
        this.logger.debug(`Synchronizing patient identity: ${dto.phone_number || dto.id}`);
        const existing = await this.repository.findPatientByResolution(dto.phone_number, dto.auth_user_id);
        const payload = { ...dto, updated_at: new Date() };
        const patient = await this.repository.upsertDFOPatient(payload);

        if (dto.last_thread_id) {
            await this.repository.linkThreadToPatient(dto.last_thread_id, patient.id);
        }
        return patient;
    }

    async getPatientProfile(patientId: string) {
        const profile = await this.repository.findPatientProfile(patientId);
        if (!profile) return null;

        // 1. CLEAR-TEXT DECRYPTION (For Clinician View)
        return {
            ...profile,
            full_name: this.encryption.decrypt(profile.full_name),
            phone_number: this.encryption.decrypt(profile.phone_number || ''),
        };
    }

    async getPatientHistory(patientId: string) {
        return this.repository.findPatientHistory(patientId);
    }

    async updateJourneyStage(patientId: string, stage: JourneyStage) {
        this.logger.log(`Updating patient ${patientId} journey stage to ${stage}`);
        const patient = await this.repository.upsertDFOPatient({ id: patientId, journey_stage: stage });
        await this.engagementService.scheduleStagedMessage(patientId, patient.pregnancy_stage || 0, stage);
    }

    async bookAppointment(dto: Partial<DFOAppointment>): Promise<DFOAppointment> {
        this.logger.log(`Booking appointment for patient ${dto.patient_id}`);
        const appt = await this.repository.createAppointment({
            ...dto,
            status: AppointmentStatus.SCHEDULED,
            reminders_sent: 0
        });
        await this.engagementService.triggerEventEngagement(dto.patient_id as string, 'APPT_REMINDER', {
            appointment_id: appt.id,
            delay_ms: new Date(appt.appointment_date).getTime() - Date.now() - 24 * 60 * 60 * 1000
        });
        return appt;
    }

    async startConsultation(threadId: string, doctorId: string): Promise<DFOConsultation> {
        this.logger.log(`Starting consultation: Thread ${threadId}`);
        const thread = await this.repository.findThreadById(threadId);
        const patientId = thread?.metadata?.patient_id || threadId;

        return this.repository.startConsultation({
            thread_id: threadId,
            doctor_id: doctorId,
            patient_id: patientId,
            status: ConsultationStatus.OPEN,
            start_time: new Date()
        });
    }

    async createPatient(dto: any) {
        // 2. VAULT ENCRYPTION (For Database Safety)
        const securedDto = {
            ...dto,
            full_name: this.encryption.encrypt(dto.full_name),
            phone_number: this.encryption.encrypt(dto.phone_number),
        };
        return this.repository.upsertDFOPatient(securedDto);
    }

    async addPrescription(dto: DFOPrescription) {
        return this.repository.addPrescription(dto);
    }

    async uploadReport(dto: DFOMedicalReport) {
        return this.repository.uploadReportMetadata(dto);
    }

    async closeConsultation(consultationId: string, notes: string) {
        this.logger.log(`Closing consultation ${consultationId}`);
        await this.repository.updateConsultation(consultationId, {
            clinical_notes: notes,
            status: ConsultationStatus.CLOSED,
            end_time: new Date()
        });
    }

    async getDFOAnalytics() {
        return this.repository.findAnalyticsMetrics();
    }

    async getClinicalMetrics() {
        const today = new Date().toISOString().split('T')[0];
        return this.repository.findClinicalMetrics(today);
    }
}
