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

    // Auth check — allow unauthenticated demo mode
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
      if (!anonKey) throw new Error("SUPABASE_ANON_KEY is not configured");
      const userClient = createClient(SUPABASE_URL, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (!userError && user) {
        userId = user.id;
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { messages, sessionId } = await req.json();
    const userMessage = messages[messages.length - 1]?.content || "";

    // 1. Retrieve relevant knowledge sources
    const { data: sources } = await supabase
      .from("knowledge_sources")
      .select("id, title, content, content_type, url, tags, week_relevant, metadata, updated_at, audience_tags, urgency")
      .eq("is_active", true)
      .order("content_type");

    // 2. Get user profile for context
    let profile: any = null;
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, onboarding_completed, student_type, is_international, relocation_status, primary_goals, concerns, created_at")
        .eq("user_id", userId)
        .single();
      profile = data;
    }

    // 3. Get wellbeing data
    let recentCheckins: any[] | null = null;
    let latestWeekly: any = null;
    if (userId) {
      const { data: energy } = await supabase
        .from("wellbeing_checkins")
        .select("energy_level, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      recentCheckins = energy;

      const { data: weekly } = await supabase
        .from("weekly_checkins")
        .select("stress_level, control_level, confidence_level, stress_causes")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (weekly?.length) latestWeekly = weekly[0];
    }

    // 4. Get incomplete tasks count
    let incompleteTasks = 0;
    if (userId) {
      const { count } = await supabase
        .from("user_notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", false);
      incompleteTasks = count ?? 0;
    }

    const avgEnergy = recentCheckins?.length
      ? Math.round(recentCheckins.reduce((s: number, c: any) => s + c.energy_level, 0) / recentCheckins.length)
      : null;

    // 5. Compute current week
    let currentWeek = 0;
    if (profile?.created_at) {
      const diffMs = Date.now() - new Date(profile.created_at).getTime();
      currentWeek = Math.min(Math.max(Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)), 0), 5);
    }

    // 6. Build profile tags for personalization
    const profileTags: string[] = [];
    if (profile?.is_international) profileTags.push("international");
    if (profile?.relocation_status && profile.relocation_status !== "none" && profile.relocation_status !== "no")
      profileTags.push("relocation");
    for (const g of (profile?.primary_goals ?? [])) {
      const lower = g.toLowerCase();
      if (lower.includes("recruit")) profileTags.push("recruiting");
      if (lower.includes("entrepren")) profileTags.push("entrepreneurship");
      if (lower.includes("academ")) profileTags.push("academics");
      if (lower.includes("explor")) profileTags.push("exploration");
    }
    if (profile?.student_type) profileTags.push(profile.student_type.toLowerCase());

    // 7. Build context for the AI
    const sourcesContext = sources?.length
      ? sources.map((s: any) =>
          `[SOURCE id="${s.id}" type="${s.content_type}" title="${s.title}"${s.url ? ` url="${s.url}"` : ""}${s.week_relevant !== null ? ` week=${s.week_relevant}` : ""}${s.audience_tags?.length ? ` audience="${s.audience_tags.join(",")}"` : ""} urgency=${s.urgency ?? 0} updated="${s.updated_at}"]\n${s.content}\n[/SOURCE]`
        ).join("\n\n")
      : "No approved content sources are available yet.";

    const highStress = (latestWeekly?.stress_level ?? 0) >= 4 || (latestWeekly?.control_level ?? 5) <= 2;
    const lowConfidence = (latestWeekly?.confidence_level ?? 5) <= 2;

    const studentContext = [
      profile?.full_name ? `Student name: ${profile.full_name}` : null,
      profile?.student_type ? `Program: ${profile.student_type.toUpperCase()}` : null,
      profile?.is_international ? "International student: yes" : null,
      profile?.relocation_status ? `Relocation: ${profile.relocation_status}` : null,
      profile?.primary_goals?.length ? `Goals: ${profile.primary_goals.join(", ")}` : null,
      profile?.concerns?.length ? `Concerns: ${profile.concerns.join(", ")}` : null,
      profileTags.length ? `Profile tags: ${profileTags.join(", ")}` : null,
      profile?.onboarding_completed ? "Onboarding: completed" : "Onboarding: in progress",
      `Current program week: ${currentWeek + 1} of 6`,
      avgEnergy !== null ? `Recent average energy level: ${avgEnergy}% (0=empty, 100=fully charged)` : null,
      latestWeekly ? `Latest stress level: ${latestWeekly.stress_level}/5` : null,
      latestWeekly ? `Latest sense of control: ${latestWeekly.control_level}/5` : null,
      latestWeekly ? `Latest priority confidence: ${latestWeekly.confidence_level}/5` : null,
      latestWeekly?.stress_causes?.length ? `Current stress causes: ${latestWeekly.stress_causes.join(", ")}` : null,
      incompleteTasks > 0 ? `Incomplete dashboard tasks: ${incompleteTasks}` : null,
    ].filter(Boolean).join("\n");

    const personalizationGuidance = [
      highStress ? "\n⚠️ PERSONALIZATION: This student is experiencing HIGH STRESS or LOW CONTROL. Give shorter, more practical, prioritization-oriented answers. Focus on what matters most RIGHT NOW and what can be deferred. Be extra calm and supportive. Reduce cognitive load." : null,
      lowConfidence ? "\n⚠️ PERSONALIZATION: This student has LOW CONFIDENCE in their priorities. Help them identify what matters most. Be clear and decisive in recommendations." : null,
      profileTags.includes("international") && currentWeek <= 2 ? "\n📌 PERSONALIZATION: International student in early weeks — prioritize logistics, visa, housing, and settling-in guidance over career/recruiting content." : null,
      profileTags.includes("recruiting") && currentWeek >= 1 && currentWeek <= 4 ? "\n📌 PERSONALIZATION: Recruiting-focused student in peak recruiting weeks — prioritize career-related guidance, deadlines, and networking opportunities." : null,
      profileTags.includes("relocation") && currentWeek <= 2 ? "\n📌 PERSONALIZATION: Student with relocation/family needs — prioritize housing, logistics, and family support resources." : null,
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
7. **Use audience_tags and urgency on sources to prioritize the most relevant content** for this student's profile and week.

## Student context
${studentContext}
${personalizationGuidance}

## Approved content sources
${sourcesContext}

## Response format
- Use markdown for structure (headers, lists, bold)
- After factual answers, list the sources you used in a "Sources" section at the end
- Format each source as: **Title** (Type)${sources?.some((s: any) => s.url) ? " — [Link](url)" : ""}
- If your confidence is low, prefix with: "⚠️ I'm not fully certain about this."
- If you have no relevant source, say: "I don't have a verified answer for this. Here's what I'd suggest..."`;

    // 8. Build messages array with history
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // 9. Call Lovable AI with streaming
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

    // 10. Return the stream
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
