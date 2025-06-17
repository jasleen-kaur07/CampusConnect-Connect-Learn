import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://ietfisygbdobsoelrzwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldGZpc3lnYmRvYnNvZWxyendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODQ4ODMsImV4cCI6MjA2NTQ2MDg4M30.3eZR5CLcKokUOLZRiVj6iNk_Rxu0P009fDLuKnXd_ho";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Temporarily disable Supabase client for testing UI without DB
// export const supabase = {
//   auth: {
//     getSession: async () => ({ data: { session: null } }),
//     onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
//     signUp: async () => ({ data: null, error: new Error("Supabase signup disabled for testing") }),
//     signInWithPassword: async () => ({ data: null, error: new Error("Supabase signin disabled for testing") }),
//     signOut: async () => {},
//   },
//   from: (table: string) => {
//     // This object represents the final return structure for queries
//     const queryResult = { data: [], error: null };

//     // This object represents the methods that can be chained after select
//     const chainableQueryMethods = {
//       eq: (column: string, value: any) => chainableQueryMethods, // eq returns itself for further chaining
//       order: (column: string, options?: { ascending: boolean }) => queryResult, // order returns the final result
//       single: () => ({ data: null, error: null }), // single returns a single item result
//       ...queryResult, // Also includes data/error directly if no more chaining
//     };

//     return {
//       select: (query?: string) => chainableQueryMethods,
//       insert: (data: any) => ({ ...queryResult, select: () => queryResult }),
//       update: (data: any) => ({ eq: (column: string, value: any) => queryResult }),
//       delete: () => ({ eq: (column: string, value: any) => queryResult }),
//     };
//   },
// };

export type Database = any; // Temporarily set to any for disabled DB
