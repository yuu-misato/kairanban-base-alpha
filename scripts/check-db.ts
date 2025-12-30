
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('--- Database Connection Test ---');

    // 1. Fetch Kairanbans
    try {
        const { data: kairanbans, error: kError } = await supabase
            .from('kairanbans')
            .select('*')
            .limit(5);

        if (kError) {
            console.error('❌ Kairanbans Fetch Failed:', kError.message);
        } else {
            console.log('✅ Kairanbans Fetch OK:', kairanbans.length, 'items');
        }
    } catch (e: any) {
        console.error('❌ Kairanbans Fetch Error:', e.message);
    }

    // 2. Fetch Communities
    try {
        const { data: communities, error: cError } = await supabase
            .from('communities')
            .select('*')
            .limit(5);

        if (cError) {
            console.error('❌ Communities Fetch Failed:', cError.message);
        } else {
            console.log('✅ Communities Fetch OK:', communities.length, 'items');
        }
    } catch (e: any) {
        console.error('❌ Communities Fetch Error:', e.message);
    }

    // 3. Fetch Posts
    try {
        const { data: posts, error: pError } = await supabase
            .from('posts')
            .select('*')
            .limit(5);

        if (pError) {
            console.error('❌ Posts Fetch Failed:', pError.message);
        } else {
            console.log('✅ Posts Fetch OK:', posts.length, 'items');
        }
    } catch (e: any) {
        console.error('❌ Posts Fetch Error:', e.message);
    }

    // 4. Fetch Coupons
    try {
        const { data: coupons, error: cpError } = await supabase
            .from('coupons')
            .select('*')
            .limit(5);

        if (cpError) {
            console.error('❌ Coupons Fetch Failed:', cpError.message);
        } else {
            console.log('✅ Coupons Fetch OK:', coupons.length, 'items');
        }
    } catch (e: any) {
        console.error('❌ Coupons Fetch Error:', e.message);
    }

    // 5. Fetch Profiles
    try {
        const { data: profiles, error: prError } = await supabase
            .from('profiles')
            .select('*')
            .limit(5);

        if (prError) {
            console.error('❌ Profiles Fetch Failed:', prError.message);
        } else {
            console.log('✅ Profiles Fetch OK:', profiles.length, 'items');
        }
    } catch (e: any) {
        console.error('❌ Profiles Fetch Error:', e.message);
    }

    console.log('--- Test Finished ---');
}

checkDatabase();
