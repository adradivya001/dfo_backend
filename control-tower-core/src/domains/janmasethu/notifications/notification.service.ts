import { Injectable, Logger } from '@nestjs/common';
import { JanmasethuRepository } from '../janmasethu.repository';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(private readonly repository: JanmasethuRepository) { }

    /**
     * RESILIENT OMNICHANNEL DISPATCHER
     */
    async sendAlert(dto: {
        patientId?: string,
        target: string,
        channel: 'WHATSAPP' | 'DASHBOARD' | 'SMS',
        template: string,
        payload: any,
        priority?: 'HIGH' | 'MEDIUM' | 'LOW'
    }) {
        const priority = dto.priority || 'MEDIUM';
        this.logger.log(`[${priority}] Dispatching ${dto.channel} alert to ${dto.target}`);

        // 1. Create Initial Delivery Log
        const logId = await this.repository.createNotificationLog({
            patient_id: dto.patientId,
            channel: dto.channel,
            priority,
            template: dto.template,
            status: 'PENDING',
            payload: dto.payload
        });

        try {
            let success = false;
            switch (dto.channel) {
                case 'WHATSAPP': success = await this.deliverWhatsApp(dto.target, dto.template, dto.payload); break;
                case 'DASHBOARD': success = await this.deliverDashboardAlert(dto.target, dto.payload); break;
                case 'SMS': success = await this.deliverSMS(dto.target, dto.payload); break;
            }

            // 2. Update status on success
            await this.repository.updateNotificationLog(logId, {
                status: success ? 'SENT' : 'FAILED',
                updated_at: new Date()
            });

        } catch (error) {
            this.logger.error(`Notification failure: ${error.message}`);
            await this.repository.updateNotificationLog(logId, {
                status: 'FAILED',
                error_message: error.message,
                updated_at: new Date()
            });
        }
    }

    private async deliverWhatsApp(phone: string, template: string, data: any) {
        this.logger.log(`MOCK: Sending WhatsApp to ${phone} using Template ${template}`);
        // Integration point: WhatsApp API bridge
        return true;
    }

    private async deliverDashboardAlert(userId: string, data: any) {
        this.logger.log(`MOCK: Pushing real-time alert to Clinician Dashboard for user ${userId}`);
        // Integration point: Socket.io or Supabase Realtime
        return true;
    }

    private async deliverSMS(phone: string, data: any) {
        this.logger.warn(`MOCK: Sending backup SMS alert to ${phone}`);
        return true;
    }
}
