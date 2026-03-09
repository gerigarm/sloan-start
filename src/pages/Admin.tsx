import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Pencil, Trash2, X, Check, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type ContentType = "faq" | "deadline" | "contact" | "policy" | "link" | "milestone" | "weekly_guidance" | "resource";

interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  content_type: ContentType;
  url: string | null;
  tags: string[];
  week_relevant: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TABS: { value: ContentType; label: string }[] = [
  { value: "milestone", label: "Milestones" },
  { value: "resource", label: "Resources" },
  { value: "policy", label: "Policies" },
  { value: "faq", label: "FAQs" },
  { value: "contact", label: "Contacts" },
  { value: "deadline", label: "Deadlines" },
  { value: "link", label: "Links" },
  { value: "weekly_guidance", label: "Weekly Guidance" },
];

const TAG_OPTIONS = ["international", "family", "entrepreneur", "recruiting", "academics", "relocation"];

const Admin = () => {
  const [items, setItems] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentType>("milestone");
  const [editing, setEditing] = useState<Partial<KnowledgeSource> | null>(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filteredItems = items.filter((i) => i.content_type === activeTab);

  const handleSave = async () => {
    if (!editing?.title || !editing?.content) {
      toast({ title: "Missing fields", description: "Title and content are required.", variant: "destructive" });
      return;
    }

    const record = {
      title: editing.title,
      content: editing.content,
      content_type: activeTab,
      url: editing.url || null,
      tags: editing.tags || [],
      week_relevant: editing.week_relevant ?? null,
      is_active: editing.is_active ?? true,
    };

    if (editing.id) {
      const { error } = await supabase.from("knowledge_sources").update(record).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("knowledge_sources").insert([record as any]);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }

    toast({ title: editing.id ? "Updated" : "Created" });
    setEditing(null);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("knowledge_sources").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" });
    fetchItems();
  };

  const toggleTag = (tag: string) => {
    if (!editing) return;
    const tags = editing.tags || [];
    setEditing({
      ...editing,
      tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-serif text-3xl text-foreground">Admin Console</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage chatbot content sources and resources</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ContentType); setEditing(null); }}>
        <TabsList className="flex-wrap h-auto gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {items.filter((i) => i.content_type === t.value).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-3 mt-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
              </p>
              <Button
                size="sm"
                onClick={() => setEditing({ content_type: activeTab, tags: [], is_active: true })}
                className="text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add {tab.label.slice(0, -1)}
              </Button>
            </div>

            {/* Edit form */}
            {editing && (
              <Card className="border-primary/30 shadow-[var(--shadow-elevated)]">
                <CardContent className="p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={editing.title || ""}
                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                        placeholder="e.g., Health Insurance Enrollment"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">URL (optional)</Label>
                      <Input
                        value={editing.url || ""}
                        onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                        placeholder="https://..."
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Content</Label>
                    <Textarea
                      value={editing.content || ""}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      placeholder="Full content the chatbot will use to answer questions..."
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Week relevant (optional)</Label>
                      <Input
                        type="number"
                        min={-2}
                        max={6}
                        value={editing.week_relevant ?? ""}
                        onChange={(e) => setEditing({ ...editing, week_relevant: e.target.value ? Number(e.target.value) : null })}
                        placeholder="-2 to 6"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Audience tags</Label>
                      <div className="flex flex-wrap gap-1">
                        {TAG_OPTIONS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                              editing.tags?.includes(tag)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="text-xs h-7">
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} className="text-xs h-7">
                      <Check className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items list */}
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <Card key={item.id} className="shadow-[var(--shadow-card)]">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        {!item.is_active && (
                          <Badge variant="secondary" className="text-[10px] h-4">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.content}</p>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {item.tags.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] h-4 px-1.5">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditing(item)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!loading && filteredItems.length === 0 && !editing && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No {tab.label.toLowerCase()} yet. Add one to start.
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Admin;
