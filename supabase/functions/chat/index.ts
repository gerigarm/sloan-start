import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, sessionId } = await req.json();
    const userMessage = messages[messages.length - 1]?.content || "";

    // 1. Retrieve relevant knowledge sources
    const { data: sources } = await supabase
      .from("knowledge_sources")
      .select("id, title, content, content_type, url, tags, week_relevant, metadata, updated_at")
      .eq("is_active", true)
      .order("content_type");

    // 2. Get user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, onboarding_completed")
      .eq("user_id", user.id)
      .single();

    // 3. Get recent wellbeing data
    const { data: recentCheckins } = await supabase
      .from("wellbeing_checkins")
      .select("energy_level, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const avgEnergy = recentCheckins?.length
      ? Math.round(recentCheckins.reduce((s, c) => s + c.energy_level, 0) / recentCheckins.length)
      : null;

    // 4. Build context for the AI
    const sourcesContext = sources?.length
      ? sources.map((s) =>
          `[SOURCE id="${s.id}" type="${s.content_type}" title="${s.title}"${s.url ? ` url="${s.url}"` : ""}${s.week_relevant !== null ? ` week=${s.week_relevant}` : ""} updated="${s.updated_at}"]\n${s.content}\n[/SOURCE]`
        ).join("\n\n")
      : "No approved content sources are available yet.";

    const studentContext = [
      profile?.full_name ? `Student name: ${profile.full_name}` : null,
      profile?.onboarding_completed ? "Onboarding: completed" : "Onboarding: in progress",
      avgEnergy !== null ? `Recent average energy level: ${avgEnergy}% (0=empty, 100=fully charged)` : null,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are the Ask 6W assistant — the AI layer of Sloan 6W, an onboarding companion for MIT Sloan MBA students during their first six weeks.

## Your role
You help students navigate onboarding by answering questions about deadlines, policies, contacts, resources, milestones, and weekly guidance. You are calm, clear, factual, and supportive — never robotic, never overly cheerful.

## CRITICAL RULES
1. **Only answer from the approved sources provided below.** Never invent deadlines, policies, contacts, or requirements.
2. **Cite your sources.** For every factual claim, include the source title and type. Format citations as: [Source: "Title" (type)].
3. **If you cannot find a verified answer in the sources, say so explicitly.** Suggest the best next step — a contact, office, or resource to try.
4. **Never give legal, immigration, medical, or mental health advice.** Route to official resources instead.
5. **Be proactive when relevant.** Highlight what matters most this week, what can wait, and recommend next actions.
6. **Keep answers concise and actionable.** These are busy, sometimes stressed adults. Prioritize clarity.

## Student context
${studentContext}

## Approved content sources
${sourcesContext}

## Response format
- Use markdown for structure (headers, lists, bold)
- After factual answers, list the sources you used in a "Sources" section at the end
- Format each source as: **Title** (Type)${sources?.some(s => s.url) ? " — [Link](url)" : ""}
- If your confidence is low, prefix with: "⚠️ I'm not fully certain about this."
- If you have no relevant source, say: "I don't have a verified answer for this. Here's what I'd suggest..."`;

    // 5. Build messages array with history
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // 6. Call Lovable AI with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Return the stream
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
