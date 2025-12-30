// ------------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION (HARDCODED FOR STABILITY)
// ------------------------------------------------------------------
// Amplify環境変数問題とLINEログイン競合を解決するための抜本的構成
const SUPABASE_URL = 'https://kypnapwqarggnamgeeza.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cG5hcHdxYXJnZ25hbWdlZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTUyNjQsImV4cCI6MjA4MjU5MTI2NH0.MrFwusYFroZoXcy-9BnkKbqeKRJEMPOlcmlSte_OXDc';

console.log('--- SUPABASE CLIENT REBUILT ---');
console.log('Mode: Hardcoded Credentials');
console.log('Auto-Detect Session: OFF');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    // 【重要】これをfalseにしないと、LINEログインのリダイレクトと競合してタイムアウトする
    detectSessionInUrl: false,
  }
});