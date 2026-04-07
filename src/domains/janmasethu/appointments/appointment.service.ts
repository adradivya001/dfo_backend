import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { JanmasethuRepository } from '../janmasethu.repository';
import { AppointmentStatus, DFOAppointment, DFODoctor } from '../dfo.types';
import { EngagementEngineService } from '../engagement-engine/engine.service';

@Injectable()
export class AppointmentService {
    private readonly logger = new Logger(AppointmentService.name);

    constructor(
        private readonly repository: JanmasethuRepository,
        private readonly engagementEngine: EngagementEngineService,
    ) { }

    /**
     * SLOT MANAGEMENT
     */
    async findSlots(doctorId: string): Promise<any[]> {
        return this.repository.findAvailabilitySlots(doctorId);
    }

    /**
     * BOOKING LIFECYCLE
     */
    async bookAppointment(dto: { patientId: string, doctorId: string, date: Date, notes?: string }): Promise<DFOAppointment> {
        this.logger.log(`Booking appointment for patient ${dto.patientId} on ${dto.date}`);

        // 1. Availability Check
        const slots = await this.findSlots(dto.doctorId);
        if (slots.length === 0) throw new BadRequestException('Doctor not available');

        // 2. Create the Appointment
        const appt = await this.repository.createAppointment({
            patient_id: dto.patientId,
            doctor_id: dto.doctorId,
            appointment_date: dto.date,
            status: AppointmentStatus.SCHEDULED,
            notes: dto.notes,
            reminders_sent: 0
        });

        // 3. INTEGRATION: Auto-schedule reminder via Engagement Engine
        // Schedule it 2 hours BEFORE the appointment date
        const reminderTime = new Date(dto.date.getTime() - 2 * 60 * 60 * 1000);
        await this.engagementEngine.processEvent('APPOINTMENT_BOOKED', {
            appointmentId: appt.id,
            patientId: dto.patientId,
            reminderTime
        });

        return appt;
    }

    /**
     * ADVANCED LIFECYCLE (Rescheduling & Cancellation)
     */
    async rescheduleAppointment(id: string, newDate: Date, reason: string): Promise<DFOAppointment> {
        this.logger.log(`Rescheduling appointment ${id} to ${newDate.toISOString()}`);

        const oldAppt = await this.repository.findAppointmentById(id);
        if (!oldAppt) throw new BadRequestException('Original appointment not found');

        // 1. Cancel old reminders
        await this.engagementEngine.processEvent('APPOINTMENT_CANCELLED', { appointmentId: id });

        // 2. Create new appointment linked to old one
        const newAppt = await this.bookAppointment({
            patientId: oldAppt.patient_id,
            doctorId: oldAppt.doctor_id,
            date: newDate,
            notes: `Rescheduled: ${reason} (Original: ${id})`
        });

        // 3. Mark old as CANCELLED (Rescheduled status)
        await this.repository.updateAppointment(id, {
            status: AppointmentStatus.CANCELLED,
            cancellation_reason: `Rescheduled to ${newAppt.id}`
        });

        return newAppt;
    }

    async scanForMissedAppointments(): Promise<number> {
        this.logger.log('Scanning for missed (no-show) appointments...');
        const now = new Date();
        const missed = await this.repository.findPastDueAppointments(now);

        for (const appt of missed) {
            await this.repository.updateAppointment(appt.id, { status: AppointmentStatus.MISSED });
            // Notify Engagement engine to trigger a "Sorry we missed you" nudge
            await this.engagementEngine.processEvent('APPOINTMENT_MISSED', { patientId: appt.patient_id });
        }

        return missed.length;
    }

    async cancelAppointment(id: string, reason: string): Promise<void> {
        this.logger.log(`Cancelling appointment ${id}: ${reason}`);

        const appt = await this.repository.findAppointmentById(id);
        if (!appt) throw new BadRequestException('Appointment not found');

        // 1. Update Database Status
        await this.repository.updateAppointment(id, {
            status: AppointmentStatus.CANCELLED,
            cancellation_reason: reason
        });

        // 2. Kill pending reminders
        await this.engagementEngine.processEvent('APPOINTMENT_CANCELLED', { appointmentId: id });

        // 3. SMART HEALING: If cancellation is from clinic side, find next slot
        if (reason.toLowerCase().includes('doctor') || reason.toLowerCase().includes('clinic')) {
            const nextSlots = await this.findSlots(appt.doctor_id);
            const recommendation = nextSlots.length > 0 ? nextSlots[0].start_time : null;

            await this.engagementEngine.processEvent('DOCTOR_CANCELLED_WITH_SUGGESTION', {
                patient_id: appt.patient_id,
                doctor_id: appt.doctor_id,
                originalDate: appt.appointment_date,
                suggestedDate: recommendation,
                reason
            });
        }
    }

    async completeAppointment(id: string): Promise<void> {
        this.logger.log(`Marking appointment ${id} as COMPLETED.`);
        await this.repository.updateAppointment(id, { status: AppointmentStatus.COMPLETED });
        await this.engagementEngine.processEvent('APPOINTMENT_COMPLETED', { appointmentId: id });
    }
}
