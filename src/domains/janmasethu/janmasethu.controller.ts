import {
    Controller, Post, Get, Patch, Body, Param, Headers,
    UnauthorizedException, BadRequestException, Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JanmasethuHandler } from './janmasethu.handler';
import { JanmasethuAssignmentService } from './janmasethu.assignment';
import { JanmasethuTakeoverService } from './janmasethu.takeover';
import { JanmasethuContextService } from './janmasethu.context';
import { JanmasethuRepository } from './janmasethu.repository';
import { JanmasethuDispatchService } from './channel/janmasethu-dispatch.service';
import { JanmasethuSummaryService } from './janmasethu.summary.service';
import { JanmasethuFeedbackService } from './janmasethu.feedback.service';
import { JanmasethuDFOService } from './janmasethu.dfo.service';
import { EngagementEngineService } from './engagement-engine/engine.service';
import { AppointmentService } from './appointments/appointment.service';
import { JanmasethuLeadsService } from './janmasethu.leads.service';
import { ThreadService } from '../../kernel/thread/thread.service';
import { JanmasethuReportingService } from './janmasethu.reporting.service';
import { JanmasethuAuditService } from './janmasethu.audit.service';
import { JanmasethuEncryptionService } from './utils/encryption.service';
import { JanmasethuRbacService } from './janmasethu.rbac';
import { DocumentService } from './documents/document.service';
import { JANMASETHU_DOMAIN, JanmasethuUserRole, JanmasethuUserContext, JanmasethuPermission } from './janmasethu.types';
import { JourneyStage, ConsultationStatus } from './dfo.types';
import {
    SyncPatientDto, UpdateJourneyDto, BookAppointmentDto,
    StartConsultationDto, CloseConsultationDto, AddPrescriptionDto
} from './dto/dfo.dto';

@Controller('janmasethu')
export class JanmasethuController {
    private readonly logger = new Logger(JanmasethuController.name);

    constructor(
        private readonly handler: JanmasethuHandler,
        private readonly assignmentService: JanmasethuAssignmentService,
        private readonly takeoverService: JanmasethuTakeoverService,
        private readonly contextService: JanmasethuContextService,
        private readonly repository: JanmasethuRepository,
        private readonly threadService: ThreadService,
        private readonly dispatchService: JanmasethuDispatchService,
        private readonly configService: ConfigService,
        private readonly summaryService: JanmasethuSummaryService,
        private readonly feedbackService: JanmasethuFeedbackService,
        private readonly dfoService: JanmasethuDFOService,
        private readonly engagementEngine: EngagementEngineService,
        private readonly appointmentService: AppointmentService,
        private readonly leadsService: JanmasethuLeadsService,
        private readonly reportingService: JanmasethuReportingService,
        private readonly auditService: JanmasethuAuditService,
        private readonly encryption: JanmasethuEncryptionService,
        private readonly rbacService: JanmasethuRbacService,
        private readonly documentService: DocumentService,
    ) { }

    private getUserContext(headers: Record<string, any>): JanmasethuUserContext {
        const userId = headers['x-user-id'];
        const userRole = headers['x-user-role'] as JanmasethuUserRole;

        if (!userId || !userRole) {
            throw new UnauthorizedException('Missing user context');
        }

        return { id: userId, role: userRole };
    }

    @Get('reporting/journey/:patient_id')
    async getJourneyReport(@Param('patient_id') patientId: string, @Headers() headers: any) {
        try {
            const ctx = this.getUserContext(headers);
            await this.auditService.logPIIAccess(ctx.id, ctx.role, patientId, 'REQUESTED_FULL_JOURNEY_REPORT');
            return await this.reportingService.generateJourneyReport(patientId);
        } catch (error) {
            this.logger.error(`Journey Report Final Failure: ${error.message} - ${error.stack}`);
            throw new BadRequestException(`Clinical Aggregator Trace: ${error.message}`);
        }
    }

    @Get('audit-logs')
    async getAuditLogs(@Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        if (ctx.role !== JanmasethuUserRole.CRO) {
            throw new UnauthorizedException('Audit access limited to Clinical Compliance Officers (CRO)');
        }
        return this.auditService.getAuditHistory();
    }

    // --- DFO PATIENT & JOURNEY ---

    @Get('doctors/availability')
    async getAvailability(@Param('doctor_id') doctorId?: string) {
        return this.repository.findDoctorAvailability(doctorId);
    }

    @Post('appointments')
    async bookAppointment(@Body() dto: BookAppointmentDto, @Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        const appt = await this.dfoService.bookAppointment({
            ...dto,
            appointment_date: new Date(dto.appointment_date)
        } as any);
        await this.auditService.logClinicalUpdate(ctx.id, 'APPOINTMENT_BOOKED', dto.patient_id, { appointmentId: appt.id });
        return appt;
    }

    // --- DFO CONSULTATIONS & HISTORY ---

    @Get('patient/:id/history')
    async getPatientHistory(@Param('id') id: string, @Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        await this.auditService.logPIIAccess(ctx.id, ctx.role, id, 'VIEWED_PATIENT_CLINICAL_HISTORY');
        return this.dfoService.getPatientHistory(id);
    }

    @Post('consultations/start')
    async startConsultation(@Body() dto: StartConsultationDto, @Headers() headers: any) {
        try {
            const user = this.getUserContext(headers);
            return await this.dfoService.startConsultation(dto.threadId, user.id);
        } catch (error) {
            this.logger.error(`Consultation Start Failure: ${error.message}`);
            throw new BadRequestException(`Clinic Logic Error: ${error.message}`);
        }
    }

    @Post('consultations/prescription')
    async addPrescription(@Body() dto: AddPrescriptionDto, @Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        const res = await this.dfoService.addPrescription(dto);
        await this.auditService.logClinicalUpdate(ctx.id, 'PRESCRIPTION_ADDED', dto.consultation_id, { medication: dto.medication_name });

        // AUTO-TRIGGER: Queue document generation asynchronously (non-blocking)
        // The prescription is saved; document generation runs in the background.
        const consultation = await this.repository.findThreadById(dto.consultation_id).catch(() => null);
        const patientId: string = (consultation?.metadata?.patient_id as string) || 'unknown';

        this.documentService.queuePrescriptionGeneration({
            prescription_id: res.id!,
            consultation_id: dto.consultation_id,
            patient_id: patientId,
            doctor_id: ctx.id,
            generated_by: ctx.id,
        }).catch(e => this.logger.warn(`Document auto-queue failed (non-critical): ${e.message}`));

        return { ...res, document_generation: 'queued' };
    }

    @Post('consultations/close')
    async closeConsultation(@Body() dto: CloseConsultationDto, @Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        await this.dfoService.closeConsultation(dto.id, dto.notes);
        await this.auditService.logClinicalUpdate(ctx.id, 'CONSULTATION_CLOSED', dto.id, { notes: dto.notes.substring(0, 50) });
        return { status: 'closed' };
    }

    @Post('reports/upload')
    async uploadReport(@Body() dto: any) {
        return this.dfoService.uploadReport(dto);
    }

    // --- DFO ANALYTICS ---

    @Get('analytics')
    async getOverview() {
        return this.dfoService.getDFOAnalytics();
    }

    @Get('threads')
    async listThreads(@Headers() headers: any) {
        const user = this.getUserContext(headers);
        return this.repository.findThreads(user);
    }

    @Get('workload')
    async getWorkload() {
        return this.repository.findWorkload();
    }

    @Get('risk/:patient_id')
    async getPatientRiskTrend(@Param('patient_id') patientId: string) {
        return this.repository.findRiskLogsByPatient(patientId);
    }

    @Get('context/:id')
    async getThreadContext(
        @Param('id') threadId: string,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        return this.contextService.getThreadContext(threadId, user);
    }

    @Post('summary/:thread_id')
    async generateSummary(@Param('thread_id') threadId: string) {
        return this.summaryService.generateSummary(threadId);
    }

    @Post('feedback')
    async submitFeedback(@Body() body: any, @Headers() headers: any) {
        const user = this.getUserContext(headers);
        await this.feedbackService.submitFeedback(body.threadId, user, {
            accuracy_score: body.accuracyScore,
            comment: body.comment,
            risk_mismatch: body.riskMismatch,
        });
        return { status: 'recorded' };
    }

    @Post('assign/auto/:id')
    async autoAssign(@Param('id') threadId: string) {
        await this.assignmentService.autoAssignThread(threadId);
        return { status: 'auto-assigned', threadId };
    }

    @Post('assign/:id')
    async assignThread(
        @Param('id') threadId: string,
        @Body() body: any,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        const { targetUserId, targetRole } = body;
        await this.assignmentService.assignThread(threadId, targetUserId, targetRole, user);
        return { status: 'assigned', threadId };
    }

    @Post('take-control/:id')
    async takeControl(
        @Param('id') threadId: string,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        await this.takeoverService.takeControl(threadId, user);
        return { status: 'controlled', threadId };
    }

    @Post('refer/:id')
    async referCase(
        @Param('id') threadId: string,
        @Body() body: { targetDoctorId: string; reason: string },
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        if (user.role !== JanmasethuUserRole.DOCTOR) {
            throw new UnauthorizedException('Only DOCTOR roles can issue formal clinical referrals.');
        }

        await this.repository.referCase(threadId, body.targetDoctorId, user.id, body.reason);
        return { status: 'referred', threadId, target: body.targetDoctorId };
    }

    @Post('reply')
    async handleReply(
        @Body() body: { thread_id: string; sender_type: string; content: string },
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);

        // 1. Save message to thread
        await this.threadService.appendMessage(body.thread_id, {
            sender_id: user.id,
            sender_type: 'HUMAN',
            content: body.content,
        });

        // 2. Fetch thread to get channel and original userId
        const thread = await this.threadService.getThread(body.thread_id);

        // 3. Dispatch to external channel
        await this.dispatchService.dispatchResponse(
            thread.channel,
            thread.user_id,
            body.content
        );

        return { status: 'sent', thread_id: body.thread_id };
    }

    // --- APPOINTMENTS (Full Lifecycle) ---
    @Get('doctors/:id/slots')
    async getDoctorSlots(@Param('id') doctorId: string) {
        return this.appointmentService.findSlots(doctorId);
    }

    @Post('appointments/book')
    async completeBookAppointment(@Body() body: { patientId: string, doctorId: string, date: string, notes?: string }) {
        return this.appointmentService.bookAppointment({
            patientId: body.patientId,
            doctorId: body.doctorId,
            date: new Date(body.date),
            notes: body.notes
        });
    }

    @Post('appointments/reschedule/:id')
    async rescheduleAppointment(@Param('id') id: string, @Body() body: { newDate: string; reason: string }) {
        return this.appointmentService.rescheduleAppointment(id, new Date(body.newDate), body.reason);
    }

    @Post('appointments/cancel/:id')
    async cancelAppointment(@Param('id') id: string, @Body() body: { reason: string }) {
        return this.appointmentService.cancelAppointment(id, body.reason);
    }

    @Post('appointments/complete/:id')
    async completeAppointment(@Param('id') id: string) {
        return this.appointmentService.completeAppointment(id);
    }

    // --- PROACTIVE ENGAGEMENT TRIGGER ---
    @Post('engagement/trigger')
    async triggerEngagement(@Body() body: { event: string, payload: any }) {
        return this.engagementEngine.processEvent(body.event, body.payload);
    }

    // --- CLINIC LEADS (MIGRATED) ---
    @Get('leads')
    async listLeads(@Body() filters: any) {
        return this.leadsService.getLeads(filters);
    }

    @Post('leads')
    async createLead(@Body() payload: any, @Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        await this.auditService.logPIIAccess(ctx.id, ctx.role, 'SYSTEM', 'REGISTERED_NEW_LEAD');
        return this.leadsService.createLead(payload);
    }

    @Post('leads/process-stalled')
    async processStalled(@Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        if (!this.rbacService.canViewPII(ctx)) {
            throw new BadRequestException('Unauthorized to process clinical funnel.');
        }

        await this.auditService.logPIIAccess(ctx.id, ctx.role, 'SYSTEM', 'TRIGGERED_LEAD_CONVERSION_BATCH');
        return this.leadsService.processStalledLeads();
    }

    @Get('patients')
    async listPatients(@Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        if (!this.rbacService.canViewPII(ctx)) {
            throw new BadRequestException('Unauthorized PII Access');
        }

        await this.auditService.logPIIAccess(ctx.id, ctx.role, 'ALL_PATIENTS', 'BULK_PATIENT_LIST_ACCESS');
        const rawPatients = await this.repository.findAllPatients();

        // AUTO-DECRYPT FOR DOCTOR VIEW
        return rawPatients.map(p => ({
            ...p,
            full_name: this.encryption.decrypt(p.full_name),
            phone_number: this.encryption.decrypt(p.phone_number || '')
        }));
    }

    @Get('patients/:id')
    async getPatient(@Param('id') id: string, @Headers() headers: any) {
        const ctx = this.getUserContext(headers);
        await this.auditService.logPIIAccess(ctx.id, ctx.role, id, 'DETAILED_PATIENT_PROFILE_ACCESS');
        return this.dfoService.getPatientProfile(id);
    }

    @Get('clinic-metrics')
    async getClinicalMetrics() {
        return this.dfoService.getClinicalMetrics();
    }
}
