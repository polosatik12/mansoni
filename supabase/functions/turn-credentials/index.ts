import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const turnKeyId = Deno.env.get("CLOUDFLARE_TURN_KEY_ID");
    const turnApiToken = Deno.env.get("CLOUDFLARE_TURN_API_TOKEN");

    if (!turnKeyId || !turnApiToken) {
      console.error("Missing TURN credentials");
      return new Response(
        JSON.stringify({ error: "TURN credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Request ICE servers from Cloudflare TURN
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${turnApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: 86400 }), // 24 hours
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudflare TURN error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate ICE servers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Generated ICE servers:", data.iceServers?.length || 0, "servers");

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    console.error("Error generating TURN credentials:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
