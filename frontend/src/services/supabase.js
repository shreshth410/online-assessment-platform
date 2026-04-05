import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please create a .env file in the frontend directory with:\n' +
    'VITE_SUPABASE_URL=your_project_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_anon_key'
  );
}

// 🔥 Create client with auto session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// 🚀 FIX: Clear invalid/stale sessions automatically
(async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    await supabase.auth.signOut(); // clears bad cached session
  }
})();

// 🔄 Listen for auth state changes (extra safety)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    localStorage.clear(); // remove broken tokens
  }
});
