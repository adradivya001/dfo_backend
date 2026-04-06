const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://vhedpucowbjabgiklyea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZWRwdWNvd2JqYWJnaWtseWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4OTQzNywiZXhwIjoyMDg3NTY1NDM3fQ._RBmUFpQgwSrTOnuB6A9w_W4jaD80Seaqd8ydV1tIk8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(sql) {
    console.log('Running SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Error running SQL:', error);
        // Fallback for when exec_sql rpc is not available
        console.log('Falling back to direct table creation attempts...');
        // This is a bit limited in supabase-js, normally you'd use migrate or raw POST to /rest/v1/rpc/query
    } else {
        console.log('SQL applied successfully.');
    }
}

// Since I can't easily run arbitrary SQL via supabase-js without an RPC, 
// I'll try to check if the tables exist by querying them.
// If I can't run the SQL, I'll provide the SQL to the user to run in the Supabase Dashboard.

async function checkTables() {
    const tables = [
        'conversation_threads',
        'conversation_messages',
        'dfo_patients',
        'dfo_risk_logs',
        'dfo_summaries',
        'dfo_clinician_workload',
        'dfo_appointments',
        'dfo_consultations',
        'dfo_notification_logs',
        'dfo_prescriptions',
        'dfo_medical_reports',
        'dfo_doctors',
        'dfo_availability_slots',
        'audit_logs',
        'routing_events'
    ];

    console.log('Checking for required tables...');
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true }).limit(1);
        if (error) {
            console.log(`Table '${table}' might be missing: ${error.message}`);
        } else {
            console.log(`Table '${table}' exists.`);
        }
    }
}

checkTables();
