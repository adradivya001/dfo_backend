import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseClient } from '@supabase/supabase-js';
import {
    EngagementJobType,
    EngagementTriggerType,
    EngagementTemplate,
    PatientReminder
} from './engagement.types';
import { JourneyStage, DFOPatient } from '../dfo.types';

@Injectable()
export class EngagementService {
    private readonly logger = new Logger(EngagementService.name);

    constructor(
        @InjectQueue('engagement_queue') private readonly engagementQueue: Queue,
        @InjectQueue('reminder_queue') private readonly reminderQueue: Queue,
        @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient
    ) { }

    /**
     * 1. STAGE-BASED PROACTIVE MESSAGING
     * Triggers a message based on pregnancy week or journey stage transition.
     */
    async scheduleStagedMessage(patientId: string, week: number, stage: JourneyStage) {
        this.logger.log(`Scheduling staged message for patient ${patientId} at week ${week}`);

        // Find applicable template
        const { data: template } = await this.supabase
            .from('dfo_engagement_templates')
            .select('*')
            .eq('journey_stage', stage)
            .eq('trigger_type', 'STAGED')
            .ilike('template_key', `%W${week}%`)
            .single();

        if (template) {
            await this.enqueueEngagementJob(patientId, EngagementJobType.STAGED_MSG, {
                template_id: template.id,
                week,
                stage
            });
        }
    }

    /**
     * 2. MEDICATION & HEALTH REMINDERS
     * Register recurring jobs in the reminder_queue.
     */
    async createReminder(reminder: Partial<PatientReminder>) {
        this.logger.log(`Creating reminder for patient ${reminder.patient_id}: ${reminder.title}`);

        const { data, error } = await this.supabase
            .from('dfo_patient_reminders')
            .upsert([reminder])
            .select()
            .single();

        if (error) throw error;

        // Schedule BullMQ job with CRON or repeated pattern
        await this.reminderQueue.add(
            EngagementJobType.MED_REMINDER,
            { reminder_id: data.id, patient_id: data.patient_id },
            {
                repeat: {
                    pattern: this.convertToCron(data.schedule),
                },
                jobId: `REMINDER_${data.id}`
            }
        );

        return data;
    }

    /**
     * 3. EVENT-DRIVEN TRIGGERS
     * Triggered by external modules (Risk Engine, Appointments).
     */
    async triggerEventEngagement(patientId: string, event: string, payload: any = {}) {
        this.logger.log(`Triggering event engagement: ${event} for patient ${patientId}`);

        const { data: template } = await this.supabase
            .from('dfo_engagement_templates')
            .select('*')
            .eq('template_key', event)
            .single();

        if (!template) return;

        // Determine delay (e.g. 1 hour for high risk follow-up)
        const delay = payload.delay_ms || 0;

        await this.enqueueEngagementJob(patientId, EngagementJobType.FOLLOW_UP, {
            template_id: template.id,
            ...payload
        }, delay);
    }

    /**
     * INTERNAL UTILITIES
     */
    private async enqueueEngagementJob(patientId: string, type: EngagementJobType, payload: any, delay: number = 0) {
        // --- PROACTIVE CONSENT CHECK ---
        const isPermitted = await this.checkPatientConsent(patientId);
        if (!isPermitted) {
            this.logger.warn(`🚫 Engagement Suppressed: Patient ${patientId} has opted out of communications.`);
            return;
        }

        await this.engagementQueue.add(type, {
            patient_id: patientId,
            ...payload
        }, {
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
    }

    /**
     * Checks if the patient has consented to proactive messages.
     * Looks at engagement_preferences.opt_out_all flag.
     */
    public async checkPatientConsent(patientId: string): Promise<boolean> {
        const { data: patient } = await this.supabase
            .from('dfo_patients')
            .select('engagement_preferences')
            .eq('id', patientId)
            .single();

        if (!patient || !patient.engagement_preferences) return true; // Default to allow if no prefs set

        return !patient.engagement_preferences.opt_out_all;
    }

    private convertToCron(schedule: any): string {
        // Simple daily cron for now: "0 0 09 * * *" (9 AM daily)
        const time = (schedule && schedule.times && schedule.times[0]) || '09:00';
        const [hour, minute] = time.split(':');
        return `0 ${minute} ${hour} * * *`;
    }

    /**
     * TEMPLATE ENGINE: Dynamic Variable Injection
     */
    async processTemplate(content: string, patient: DFOPatient, variables: any = {}): Promise<string> {
        let processed = content;
        const replacers = {
            '{{patient_name}}': patient.full_name,
            '{{week}}': patient.pregnancy_stage?.toString() || 'N/A',
            ...variables
        };

        for (const [key, value] of Object.entries(replacers)) {
            processed = processed.replace(new RegExp(key, 'g'), value as string);
        }

        return processed;
    }
}
