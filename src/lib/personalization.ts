/**
 * Rules-based personalization engine for Sloan 6W.
 *
 * Scores and ranks knowledge_sources based on:
 *  - profile match (goals, international, relocation, student_type)
 *  - week relevance
 *  - audience_tags match
 *  - stress-adjusted priority (high stress → fewer items, top urgency only)
 */

import type { Tables } from "@/integrations/supabase/types";

// ─── Types ───────────────────────────────────────────────────────

export interface UserProfile {
  student_type: string | null;
  is_international: boolean | null;
  primary_goals: string[] | null;
  concerns: string[] | null;
  relocation_status: string | null;
}

export interface WellbeingSignals {
  avgEnergy: number | null;        // 0-100
  latestStress: number | null;     // 1-5
  latestControl: number | null;    // 1-5
  latestConfidence: number | null; // 1-5
}

export interface PersonalizationContext {
  profile: UserProfile | null;
  currentWeek: number; // 0-5
  wellbeing: WellbeingSignals;
  incompleteTasks: number;
}

type KnowledgeSource = Tables<"knowledge_sources"> & {
  audience_tags?: string[];
  urgency?: number;
};

interface ScoredSource extends KnowledgeSource {
  _score: number;
}

// ─── Tag extraction from profile ─────────────────────────────────

export function getProfileTags(profile: UserProfile | null): string[] {
  if (!profile) return [];
  const tags: string[] = [];

  if (profile.is_international) tags.push("international");
  if (profile.relocation_status && profile.relocation_status !== "none" && profile.relocation_status !== "no")
    tags.push("relocation");

  const goals = profile.primary_goals ?? [];
  for (const g of goals) {
    const lower = g.toLowerCase();
    if (lower.includes("recruit")) tags.push("recruiting");
    if (lower.includes("entrepren")) tags.push("entrepreneurship");
    if (lower.includes("academ")) tags.push("academics");
    if (lower.includes("explor")) tags.push("exploration");
    if (lower.includes("network")) tags.push("networking");
  }

  const concerns = profile.concerns ?? [];
  for (const c of concerns) {
    const lower = c.toLowerCase();
    if (lower.includes("family") || lower.includes("partner")) tags.push("family");
    if (lower.includes("hous") || lower.includes("relocat")) tags.push("relocation");
  }

  if (profile.student_type) {
    tags.push(profile.student_type.toLowerCase());
  }

  return [...new Set(tags)];
}

// ─── Stress mode detection ───────────────────────────────────────

export function isHighStress(wellbeing: WellbeingSignals): boolean {
  return (wellbeing.latestStress !== null && wellbeing.latestStress >= 4) ||
    (wellbeing.latestControl !== null && wellbeing.latestControl <= 2);
}

export function isLowConfidence(wellbeing: WellbeingSignals): boolean {
  return wellbeing.latestConfidence !== null && wellbeing.latestConfidence <= 2;
}

// ─── Scoring engine ──────────────────────────────────────────────

function scoreSource(
  source: KnowledgeSource,
  profileTags: string[],
  currentWeek: number,
  wellbeing: WellbeingSignals
): number {
  let score = 0;

  // 1. Week relevance (0 or +30)
  if (source.week_relevant === null) {
    score += 10; // always-relevant gets a baseline
  } else if (source.week_relevant === currentWeek) {
    score += 30; // exact week match is high value
  } else if (Math.abs(source.week_relevant - currentWeek) === 1) {
    score += 15; // adjacent week
  }
  // future weeks get 0

  // 2. Audience tag match (+15 per matching tag)
  const audienceTags = source.audience_tags ?? [];
  if (audienceTags.length === 0 || audienceTags.includes("all")) {
    score += 5; // universal content gets small baseline
  } else {
    const matches = audienceTags.filter(t => profileTags.includes(t)).length;
    score += matches * 15;
  }

  // 3. Content tags match (+10 per match)
  const contentTags = source.tags ?? [];
  const tagMatches = contentTags.filter(t => profileTags.includes(t)).length;
  score += tagMatches * 10;

  // 4. Urgency boost
  const urgency = source.urgency ?? 0;
  score += urgency * 5;

  // 5. Stress adjustment: in high-stress mode, boost high-urgency and penalize low-urgency
  if (isHighStress(wellbeing)) {
    if (urgency >= 3) score += 20;
    else if (urgency <= 1) score -= 10;
  }

  return score;
}

// ─── Public API ──────────────────────────────────────────────────

export function rankSources(
  sources: KnowledgeSource[],
  ctx: PersonalizationContext
): ScoredSource[] {
  const profileTags = getProfileTags(ctx.profile);
  
  return sources
    .map(s => ({
      ...s,
      _score: scoreSource(s, profileTags, ctx.currentWeek, ctx.wellbeing),
    }))
    .sort((a, b) => b._score - a._score);
}

/**
 * Get personalized items for a specific content_type.
 * In high-stress mode, returns fewer items.
 */
export function getPersonalizedItems(
  sources: KnowledgeSource[],
  contentType: string | string[],
  ctx: PersonalizationContext,
  limit?: number
): ScoredSource[] {
  const types = Array.isArray(contentType) ? contentType : [contentType];
  const filtered = sources.filter(s => types.includes(s.content_type));
  const ranked = rankSources(filtered, ctx);

  const stressMode = isHighStress(ctx.wellbeing);
  const defaultLimit = stressMode ? 3 : limit ?? 8;
  
  return ranked.slice(0, defaultLimit);
}

/**
 * Generate contextual nudges based on user state.
 */
export interface Nudge {
  type: "focus" | "defer" | "deadline" | "support";
  icon: string;
  title: string;
  description: string;
  sourceId?: string;
  url?: string;
}

export function generateNudges(
  sources: KnowledgeSource[],
  ctx: PersonalizationContext
): Nudge[] {
  const nudges: Nudge[] = [];
  const profileTags = getProfileTags(ctx.profile);
  const stressMode = isHighStress(ctx.wellbeing);

  // 1. Top priority nudge
  const priorities = getPersonalizedItems(sources, "milestone", ctx, 5);
  if (priorities.length > 0) {
    nudges.push({
      type: "focus",
      icon: "🎯",
      title: "Focus on this now",
      description: priorities[0].title,
      sourceId: priorities[0].id,
    });
  }

  // 2. Defer nudge (lowest scored milestone)
  if (priorities.length > 2) {
    const last = priorities[priorities.length - 1];
    nudges.push({
      type: "defer",
      icon: "⏸️",
      title: "This can wait",
      description: last.title,
      sourceId: last.id,
    });
  }

  // 3. Upcoming deadline nudge
  const deadlines = getPersonalizedItems(sources, "deadline", ctx, 3);
  if (deadlines.length > 0) {
    nudges.push({
      type: "deadline",
      icon: "📅",
      title: "Don't miss this deadline",
      description: deadlines[0].title,
      sourceId: deadlines[0].id,
      url: deadlines[0].url ?? undefined,
    });
  }

  // 4. Support nudge when stressed
  if (stressMode) {
    const support = getPersonalizedItems(sources, ["contact", "resource"], ctx, 3);
    const relevant = support.find(s =>
      s.title.toLowerCase().includes("mental") ||
      s.title.toLowerCase().includes("counsel") ||
      s.title.toLowerCase().includes("wellness")
    ) ?? support[0];

    if (relevant) {
      nudges.push({
        type: "support",
        icon: "💙",
        title: "This resource may help you",
        description: relevant.title,
        sourceId: relevant.id,
        url: relevant.url ?? undefined,
      });
    }
  }

  return stressMode ? nudges.slice(0, 3) : nudges;
}

/**
 * Build a context summary string for the chatbot system prompt.
 */
export function buildChatbotContext(ctx: PersonalizationContext): string {
  const parts: string[] = [];
  const profileTags = getProfileTags(ctx.profile);

  parts.push(`Current program week: ${ctx.currentWeek + 1} of 6`);

  if (profileTags.length > 0) {
    parts.push(`Student profile tags: ${profileTags.join(", ")}`);
  }

  if (ctx.profile?.primary_goals?.length) {
    parts.push(`Primary goals: ${ctx.profile.primary_goals.join(", ")}`);
  }

  if (ctx.profile?.concerns?.length) {
    parts.push(`Key concerns: ${ctx.profile.concerns.join(", ")}`);
  }

  if (ctx.wellbeing.latestStress !== null) {
    parts.push(`Current stress level: ${ctx.wellbeing.latestStress}/5`);
  }
  if (ctx.wellbeing.latestControl !== null) {
    parts.push(`Sense of control: ${ctx.wellbeing.latestControl}/5`);
  }
  if (ctx.wellbeing.latestConfidence !== null) {
    parts.push(`Priority confidence: ${ctx.wellbeing.latestConfidence}/5`);
  }
  if (ctx.wellbeing.avgEnergy !== null) {
    parts.push(`Recent average energy: ${ctx.wellbeing.avgEnergy}%`);
  }

  if (ctx.incompleteTasks > 0) {
    parts.push(`Incomplete dashboard tasks: ${ctx.incompleteTasks}`);
  }

  // Add behavioral guidance based on state
  if (isHighStress(ctx.wellbeing)) {
    parts.push("\n⚠️ PERSONALIZATION NOTE: This student is currently experiencing HIGH STRESS or LOW CONTROL. Give shorter, more practical, prioritization-oriented answers. Focus on what matters most RIGHT NOW and what can be deferred. Be extra calm and supportive.");
  }

  if (isLowConfidence(ctx.wellbeing)) {
    parts.push("\n⚠️ PERSONALIZATION NOTE: This student has LOW CONFIDENCE in their priorities. Help them identify what matters most. Be clear and decisive in recommendations.");
  }

  return parts.join("\n");
}
