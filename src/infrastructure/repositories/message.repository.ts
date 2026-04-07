import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Message } from '../../types';

@Injectable()
export class MessageRepository {
    constructor(@Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient) { }

    async create(data: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
        const { data: created, error } = await this.supabase
            .from('conversation_messages')
            .insert([{
                thread_id: data.thread_id,
                sender_id: data.sender_id,
                sender_type: data.sender_type,
                content: data.content,
                created_at: new Date(),
            }])
            .select()
            .single();

        if (error) throw error;
        return created;
    }

    async findByThread(threadId: string): Promise<Message[]> {
        const { data, error } = await this.supabase
            .from('conversation_messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }
}
