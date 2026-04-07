import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DeadLetterRepository {
    constructor(@Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient) { }

    async persist(data: {
        routing_id: string;
        thread_id: string;
        reason: string;
        payload?: any;
    }): Promise<void> {
        const { error } = await this.supabase
            .from('dead_letter_jobs')
            .insert([{
                ...data,
                failed_at: new Date(),
            }]);

        if (error) throw error;
    }
}
