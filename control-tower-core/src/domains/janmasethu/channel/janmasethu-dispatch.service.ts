import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class JanmasethuDispatchService {
    private readonly logger = new Logger(JanmasethuDispatchService.name);

    private readonly whatsappUrl: string;
    private readonly smsUrl: string;
    private readonly webUrl: string;

    constructor(private readonly config: ConfigService) {
        // Pull actual API gateways from env, use local mocks only during dev
        this.whatsappUrl = this.config.get('WHATSAPP_GATEWAY_URL') || 'http://localhost:4005/send';
        this.smsUrl = this.config.get('SMS_GATEWAY_URL') || 'http://localhost:4007/send-sms';
        this.webUrl = this.config.get('WEB_GATEWAY_URL') || 'http://localhost:4006/send';
    }

    /**
     * Dispatch an outbound message to a patient's preferred channel.
     * Implements intelligent fallback routing.
     */
    async dispatchResponse(channel: string, userId: string, message: string) {
        this.logger.log(`Dispatching human response to ${channel} user ${userId}...`);

        try {
            if (channel === 'whatsapp') {
                await this.sendWhatsApp(userId, message);
            } else if (channel === 'web') {
                await axios.post(this.webUrl, { userId, message });
            }
            this.logger.log(`Successfully dispatched message to ${channel}`);
        } catch (err) {
            this.logger.error(`Failed to dispatch message to ${channel}: ${err.message}`);
            // We still return success to the Control Tower but log the failure
        }
    }

    private async sendWhatsApp(userId: string, message: string): Promise<void> {
        try {
            await axios.post(this.whatsappUrl, { userId, message }, { timeout: 3000 });
        } catch (error) {
            this.logger.warn(`WhatsApp delivery failed for ${userId}. Attempting SMS Fallback...`);
            await this.sendSms(userId, message);
        }
    }

    private async sendSms(phone: string, message: string): Promise<void> {
        try {
            await axios.post(this.smsUrl, { phone, message }, { timeout: 3000 });
            this.logger.log(`SMS Fallback delivered to ${phone}`);
        } catch (error) {
            this.logger.error(`SMS Fallback completely failed for ${phone}`);
            throw error; // Let the dispatchResponse catch it
        }
    }
}
