import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "ashashivanna670@gmail.com";

const BodySchema = z.object({
  rating: z.number().min(0).max(5),
  feedback: z.string().max(5000),
  userEmail: z.string().email().optional(),
  timestamp: z.string(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rating, feedback, userEmail, timestamp } = parsed.data;

    // Save feedback to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase.from("feedback").insert({
      user_email: userEmail || "anonymous",
      rating,
      feedback,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
    }

    // Forward to n8n webhook (best-effort)
    const webhookUrl = "https://mssharmila.app.n8n.cloud/webhook/user-feedback";

    const payload = {
      rating,
      feedback,
      userEmail: userEmail || "anonymous",
      timestamp,
      source: "RUE Feedback Panel",
      adminEmail: ADMIN_EMAIL,
    };

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!webhookResponse.ok) {
        console.error("n8n webhook failed:", webhookResponse.status, await webhookResponse.text());
      }
    } catch (webhookErr) {
      console.error("n8n webhook error:", webhookErr);
    }

    return new Response(JSON.stringify({ success: true, message: "Feedback received" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-feedback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
