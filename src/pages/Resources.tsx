import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock, ExternalLink, FileText, Users, HelpCircle, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type KnowledgeSource = Tables<"knowledge_sources">;

const tabConfig = [
  { value: "deadline", label: "Deadlines", icon: CalendarClock, iconClass: "text-destructive" },
  { value: "link", label: "Links", icon: ExternalLink, iconClass: "text-info" },
  { value: "policy", label: "Policies", icon: FileText, iconClass: "text-warning" },
  { value: "contact", label: "Contacts", icon: Users, iconClass: "text-success" },
  { value: "faq", label: "FAQ", icon: HelpCircle, iconClass: "text-muted-foreground" },
  { value: "resource", label: "Resources", icon: ExternalLink, iconClass: "text-primary" },
] as const;

const useKnowledgeSources = () =>
  useQuery({
    queryKey: ["knowledge_sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("knowledge_sources").select("*").eq("is_active", true).order("week_relevant", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as KnowledgeSource[];
    },
  });

const ResourceItem = ({ item }: { item: KnowledgeSource }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-foreground">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary transition-colors">
              {item.title}
            </a>
          ) : item.title}
        </h3>
        {item.week_relevant !== null && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Week {item.week_relevant + 1}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.content}</p>
      {item.tags.length > 0 && item.tags[0] !== "all" && (
        <div className="flex gap-1 mt-1.5">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  </div>
);

const Resources = () => {
  const { data: sources, isLoading } = useKnowledgeSources();

  const getItems = (type: string) => (sources ?? []).filter((s) => s.content_type === type);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Resources</h1>
        <p className="text-muted-foreground mt-1">Deadlines, links, policies, and contacts in one place</p>
      </div>

      <Tabs defaultValue="deadline">
        <TabsList className="flex-wrap h-auto gap-1">
          {tabConfig.map((tab) => {
            const count = getItems(tab.value).length;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                <tab.icon className={`h-3.5 w-3.5 ${tab.iconClass}`} />
                {tab.label}
                {count > 0 && (
                  <span className="ml-0.5 text-[10px] bg-muted rounded-full px-1.5">{count}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabConfig.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader className="pb-3">
                <CardTitle className="font-sans text-base flex items-center gap-2">
                  <tab.icon className={`h-4 w-4 ${tab.iconClass}`} />
                  {tab.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : getItems(tab.value).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No {tab.label.toLowerCase()} available yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getItems(tab.value).map((item) => (
                      <ResourceItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Resources;
