import { Injectable, Logger, Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SupabaseClient } from '@supabase/supabase-js';
import { JanmasethuDispatchService } from '../channel/janmasethu-dispatch.service';
import { EngagementService } from './engagement.service';
import { EngagementJobType } from './engagement.types';
import { DFOPatient } from '../dfo.types';

@Processor('engagement_queue')
@Injectable()
export class EngagementWorker extends WorkerHost {
    private readonly logger = new Logger(EngagementWorker.name);

    constructor(
        @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
        private readonly dispatcher: JanmasethuDispatchService,
        private readonly engagementService: EngagementService
    ) { super(); }

    async process(job: Job<any, any, string>): Promise<any> {
        const { patient_id, template_id, content, variables } = job.data;
        this.logger.log(`Processing engagement job ${job.id} for patient ${patient_id}`);

        try {
            // 1. Fetch Patient Profile & Preferences
            const { data: patient, error } = await this.supabase
                .from('dfo_patients')
                .select('*')
                .eq('id', patient_id)
                .single();

            if (error || !patient) throw new Error(`Patient ${patient_id} not found.`);

            // 2. Check Preferences (Opt-out)
            const preferences = (patient as DFOPatient).engagement_preferences || { opt_out_all: false };
            if (preferences.opt_out_all) {
                this.logger.warn(`Patient ${patient_id} has opted out of all engagement.`);
                return;
            }

            let messageContent = content || job.data.message;

            // 3. Get Template Content (If content not already provided via direct PROACTIVE_MSG)
            if (!messageContent && template_id) {
                const { data: template } = await this.supabase
                    .from('dfo_engagement_templates')
                    .select('*')
                    .eq('id', template_id)
                    .single();

                if (!template) throw new Error(`Template ${template_id} not found.`);

                // 4. Process Template Variables
                messageContent = await this.engagementService.processTemplate(template.content, patient as DFOPatient, variables);
            }

            if (!messageContent) throw new Error('No message content found for engagement job.');

            // 5. Dispatch via Selected Channel
            const channel = (preferences as any).preferred_channel || 'whatsapp';
            const userId = channel === 'whatsapp' ? (patient as DFOPatient).phone_number : (patient as DFOPatient).id;

            await this.dispatcher.dispatchResponse(channel, userId, messageContent);

            // 6. Log Engagement
            await this.supabase.from('dfo_engagement_logs').insert([{
                patient_id,
                template_id,
                job_id: job.id,
                channel,
                content: messageContent,
                status: 'SENT',
                sent_at: new Date()
            }]);

            return { success: true, channel };
        } catch (err) {
            this.logger.error(`Engagement job failed: ${err.message}`);
            throw err;
        }
    }
}

/**
 * Separate worker for recurring reminders
 */
@Processor('reminder_queue')
@Injectable()
export class ReminderWorker extends WorkerHost {
    private readonly logger = new Logger(ReminderWorker.name);

    constructor(
        @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
        private readonly dispatcher: JanmasethuDispatchService
    ) { super(); }

    async process(job: Job<any>): Promise<any> {
        const { reminder_id, patient_id } = job.data;
        this.logger.log(`Processing reminder ${reminder_id} for patient ${patient_id}`);

        const { data: reminder } = await this.supabase
            .from('dfo_patient_reminders')
            .select('*')
            .eq('id', reminder_id)
            .single();

        if (!reminder || !reminder.is_active) return;

        const { data: patient } = await this.supabase
            .from('dfo_patients')
            .select('*')
            .eq('id', patient_id)
            .single();

        if (!patient) return;

        // Dispatch
        const message = `⏰ Reminder: ${reminder.title}`;
        await this.dispatcher.dispatchResponse('whatsapp', (patient as DFOPatient).phone_number, message);

        // Update last sent
        await this.supabase.from('dfo_patient_reminders').update({ last_sent_at: new Date() }).eq('id', reminder_id);
    }
}
