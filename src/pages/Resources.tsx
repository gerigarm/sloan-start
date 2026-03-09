import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Resources = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Resources</h1>
        <p className="text-muted-foreground mt-1">Deadlines, links, policies, and contacts in one place</p>
      </div>

      <Tabs defaultValue="deadlines">
        <TabsList>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {["deadlines", "links", "policies", "contacts", "faq"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle className="font-sans text-base capitalize">{tab}</CardTitle>
                <CardDescription>Content managed by admins — Step 5</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  {tab} content will appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Resources;
