// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import bcrypt from "https://esm.sh/bcryptjs@2.4.3"

// Define helper for CORS headers
// These must be present on every response for the browser to accept the data
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS Preflight (sent by browser automatically)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if the request is a POST (as expected from invoke)
    if (req.method !== 'POST') {
      throw new Error("Method not allowed")
    }

    const { password } = await req.json()

    if (!password) {
      throw new Error("Password is required")
    }

    // Initialize Supabase with Service Role Key to bypass RLS
    // These are automatically provided in the Supabase environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch stored hashes from the 'passwords' table
    const { data: entries, error } = await supabase
      .from('passwords')
      .select('hashed_passwd')

    if (error || !entries) {
      console.error("Database Error:", error)
      throw new Error("Internal database error")
    }

    // 2. Compare user input against each hash in the list
    let isValid = false
    for (const entry of entries) {
      // bcrypt.compare is async in Deno
      const match = await bcrypt.compare(password, entry.hashed_passwd)
      if (match) {
        isValid = true
        break
      }
    }

    // 3. Send successful response
    // We always return 200 so the client can parse the JSON result
    return new Response(
      JSON.stringify({ success: isValid }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (err) {
    console.error("Function Error:", err.message)
    return new Response(
      JSON.stringify({ error: err.message, success: false }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/verify-password' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
