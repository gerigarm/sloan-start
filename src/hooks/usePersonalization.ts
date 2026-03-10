/**
 * Hook that assembles the PersonalizationContext from current user data.
 * Reusable across Dashboard, Resources, Wellbeing, etc.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInWeeks } from "date-fns";
import type { PersonalizationContext, WellbeingSignals, UserProfile } from "@/lib/personalization";

const isSkipAuth = () => localStorage.getItem("skip_auth") === "true";

export function usePersonalization(): {
  ctx: PersonalizationContext;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const skipAuth = isSkipAuth();
  const userId = user?.id;

  // Profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile_full", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("student_type, is_international, primary_goals, concerns, relocation_status, created_at")
        .eq("user_id", userId!)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  // Latest weekly checkin
  const { data: latestWeekly } = useQuery({
    queryKey: ["latest_weekly_checkin", userId],
    queryFn: async () => {
      if (skipAuth) return { stress_level: 3, control_level: 3, confidence_level: 3 };
      const { data } = await (supabase as any)
        .from("weekly_checkins")
        .select("stress_level, control_level, confidence_level")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!userId || skipAuth,
  });

  // Recent energy average
  const { data: recentEnergy } = useQuery({
    queryKey: ["recent_energy", userId],
    queryFn: async () => {
      if (skipAuth) return 65;
      const { data } = await supabase
        .from("wellbeing_checkins")
        .select("energy_level")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!data?.length) return null;
      return Math.round(data.reduce((s, c) => s + c.energy_level, 0) / data.length);
    },
    enabled: !!userId || skipAuth,
  });

  // Incomplete tasks count
  const { data: incompleteTasks } = useQuery({
    queryKey: ["incomplete_tasks_count", userId],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("user_notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!)
        .eq("is_completed", false);
      return count ?? 0;
    },
    enabled: !!userId,
  });

  // Current week
  const currentWeek = profile?.created_at
    ? Math.min(Math.max(differenceInWeeks(new Date(), new Date(profile.created_at)), 0), 5)
    : 0;

  const userProfile: UserProfile | null = profile
    ? {
        student_type: profile.student_type,
        is_international: profile.is_international,
        primary_goals: profile.primary_goals,
        concerns: profile.concerns,
        relocation_status: profile.relocation_status,
      }
    : null;

  const wellbeing: WellbeingSignals = {
    avgEnergy: recentEnergy ?? null,
    latestStress: latestWeekly?.stress_level ?? null,
    latestControl: latestWeekly?.control_level ?? null,
    latestConfidence: latestWeekly?.confidence_level ?? null,
  };

  return {
    ctx: {
      profile: userProfile,
      currentWeek,
      wellbeing,
      incompleteTasks: incompleteTasks ?? 0,
    },
    isLoading: profileLoading,
  };
}

/**
 * Track a personalization event for analytics.
 */
export async function trackPersonalizationEvent(
  eventType: string,
  eventData: Record<string, unknown> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await (supabase as any).from("personalization_events").insert({
    user_id: user.id,
    event_type: eventType,
    event_data: eventData,
  });
}
