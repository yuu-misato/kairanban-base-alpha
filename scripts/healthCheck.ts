
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Environment Variables!");
    process.exit(1);
}

console.log(`Checking connection to: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHealth() {
    console.log("--- 🕵️‍♀️ Starting Deep Health Check ---");

    // 1. Database Connection (Reading Profiles)
    console.log("\n[1] Checking Database Read (profiles)...");
    const { data: profiles, error: dbError } = await supabase.from('profiles').select('id').limit(1);
    if (dbError) {
        console.error("❌ Database Read Failed:", dbError.message);
    } else {
        console.log(`✅ Database Reachable. Found ${profiles.length} profiles.`);
    }

    // 2. Database Write (Post Creation - temporary)
    // We'll skip actual write to avoid junk data, but we can try RLS check by reading a restrictive table?
    // Actually, let's try reading 'kairanbans' which we know exists.
    console.log("\n[2] Checking Table 'kairanbans'...");
    const { data: kairans, error: kError } = await supabase.from('kairanbans').select('id').limit(1);
    if (kError) {
        console.error("❌ 'kairanbans' Access Failed:", kError.message);
    } else {
        console.log(`✅ 'kairanbans' Table Reachable.`);
    }

    // 3. Edge Function Reachability (analyze-kairanban)
    console.log("\n[3] Checking Edge Function (analyze-kairanban)...");
    // Send a dummy request (no file) to see if we get a defined error (400) or a crash (500) or valid response
    const { data: funcData, error: funcError } = await supabase.functions.invoke('analyze-kairanban', {
        body: { file: null, mimeType: 'test/plain' }
    });

    if (funcError) {
        // If we get "File content is missing" (custom 500 or 400), that basically means the function RAN.
        // The previous error was a HARD 500 due to API Key issues.
        // My updated code returns JSON error with 500 status for handled exceptions.
        console.log("ℹ️ Function returned error (Expected for empty body):");
        await printFunctionError(funcError);
    } else {
        console.log("✅ Function returned success:", funcData);
    }

    // 4. Check 'line-broadcast' function (Ping test if possible? No, it sends messages. Skip.)

    console.log("\n--- Health Check Complete ---");
}

async function printFunctionError(err: any) {
    try {
        // Supabase functions invoke error usually has context
        // If it's a 500 response from the function, the 'err' object might wrap it
        if (err && err.context && typeof err.context.json === 'function') {
            const json = await err.context.json();
            console.log("   -> Response JSON:", json);
        } else {
            console.log("   -> Error Message:", err.message || err);
        }
    } catch {
        console.log("   -> Raw Error:", err);
    }
}

checkHealth();
