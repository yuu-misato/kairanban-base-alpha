import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ------------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION
// ------------------------------------------------------------------
// 環境変数を優先し、フォールバックとしてハードコード値を使用するハイブリッド構成
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kypnapwqarggnamgeeza.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cG5hcHdxYXJnZ25hbWdlZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTUyNjQsImV4cCI6MjA4MjU5MTI2NH0.MrFwusYFroZoXcy-9BnkKbqeKRJEMPOlcmlSte_OXDc';

console.log('--- SUPABASE CLIENT INITIALIZED ---');
console.log('URL Source:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Env Var' : 'Hardcoded Fallback');
// デバッグ用にURLの一部だけ出力（フルURLはセキュリティ的に控える）
console.log('Target URL:', SUPABASE_URL.substring(0, 20) + '...');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'kairanban-auth-v2',
    flowType: 'implicit', // Fix timeout issue: Edge Function generates non-PKCE tokens
  }
});