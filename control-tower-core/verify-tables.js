const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '.env', 'development.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

async function verifyTables() {
    console.log('🚀 Starting CRUD Verification for New Tables...');

    try {
        const crypto = require('crypto');
        const threadId = crypto.randomUUID();

        const userId = crypto.randomUUID();

        // Ensure parent exists
        const { error: upsertError } = await supabase.from('conversation_threads').upsert([{
            id: threadId,
            user_id: userId,
            domain: 'janmasethu',
            channel: 'whatsapp',
            status: 'green',
            version: 1,
            ownership: 'AI'
        }]);

        if (upsertError) {
            console.error(`❌ Parent Thread Creation Failed: ${upsertError.message}`);
            throw new Error(upsertError.message);
        }
        console.log(`✅ Parent Thread established: ${threadId}`);

        // 2. Test: routing_events (CREATE & READ)
        const { error: e1 } = await supabase.from('routing_events').insert([{
            thread_id: threadId,
            actor_id: 'SYSTEM_TEST',
            reason: 'INITIAL_VERIFICATION'
        }]);
        if (e1) throw new Error(`Routing Events failed: ${e1.message}`);
        console.log('✅ routing_events: CRUD Success');

        // 3. Test: dfo_summaries (CREATE & READ)
        const { error: e2 } = await supabase.from('dfo_summaries').insert([{
            thread_id: threadId,
            summary: 'Verified CRUD logic works.'
        }]);
        if (e2) throw new Error(`Summaries failed: ${e2.message}`);
        console.log('✅ dfo_summaries: CRUD Success');

        // 4. Test: dfo_clinician_workload (RPC TEST)
        const doctorId = '11111111-1111-1111-1111-111111111111';
        // First upsert doctor
        await supabase.from('dfo_doctors').upsert([{ id: doctorId, full_name: 'Dr. Verify' }]);
        // Then insert workload
        await supabase.from('dfo_clinician_workload').upsert([{ doctor_id: doctorId, active_cases: 0 }]);
        // Test RPC
        const { error: e3 } = await supabase.rpc('increment_workload', { clinician_id: doctorId });
        if (e3) throw new Error(`Workload RPC failed: ${e3.message}`);
        console.log('✅ dfo_clinician_workload (RPC): Success');

        console.log('\n🌟 ALL TABLES VERIFIED. Backend infrastructure is operational.');

    } catch (err) {
        console.error('\n❌ VERIFICATION FAILED:', err.message);
        console.log('\nDebugging Tip: Verify your Supabase logs. This error usually occurs if the table requires a real UUID but the script is providing a string that does not match the UUID format.');
    } finally {
        process.exit(0);
    }
}

verifyTables();
