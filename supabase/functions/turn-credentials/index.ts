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
      console.error("[TURN] Missing credentials - CLOUDFLARE_TURN_KEY_ID or CLOUDFLARE_TURN_API_TOKEN not set");
      return new Response(
        JSON.stringify({ 
          error: "TURN credentials not configured",
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[TURN] Fetching credentials from Cloudflare...");
    console.log("[TURN] Key ID:", turnKeyId.substring(0, 8) + "...");

    // CORRECT endpoint for Cloudflare TURN
    // Documentation: https://developers.cloudflare.com/calls/turn/generate-credentials/
    const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate`;
    
    console.log("[TURN] Request URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${turnApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        ttl: 86400 // 24 hours
      }),
    });

    console.log("[TURN] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TURN] Cloudflare error:", response.status, errorText);
      
      // Return fallback STUN servers on error
      return new Response(
        JSON.stringify({ 
          error: `Cloudflare TURN error: ${response.status}`,
          errorDetails: errorText,
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Log full response for debugging
    console.log("[TURN] Full Cloudflare response:", JSON.stringify(data, null, 2));

    // Cloudflare response format:
    // { iceServers: { urls: [...], username: "...", credential: "..." } }
    // We need to convert to array format for WebRTC
    
    let iceServers: any[] = [];
    
    if (data.iceServers) {
      if (Array.isArray(data.iceServers)) {
        // Already an array
        iceServers = data.iceServers;
        console.log("[TURN] iceServers is array with", iceServers.length, "entries");
      } else if (typeof data.iceServers === 'object') {
        // Single object - wrap in array
        iceServers = [data.iceServers];
        console.log("[TURN] iceServers is object, wrapped in array");
      }
    }

    // Check if Cloudflare includes STUN, if not add Google STUN as backup
    const hasStun = iceServers.some(server => {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      return urls.some((u: string) => u.startsWith('stun:'));
    });

    if (!hasStun) {
      console.log("[TURN] No STUN in response, adding Google STUN");
      iceServers.unshift({ urls: "stun:stun.l.google.com:19302" });
    }

    // Log what we're returning
    console.log("[TURN] Returning", iceServers.length, "ICE servers");
    iceServers.forEach((s, i) => {
      const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
      console.log(`[TURN] Server ${i}:`, urls.join(', '), s.username ? '(with auth)' : '');
    });

    return new Response(
      JSON.stringify({ iceServers }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    console.error("[TURN] Exception:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Return fallback on exception
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ]
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
