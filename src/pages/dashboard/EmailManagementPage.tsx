import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send } from "lucide-react";
import { EmailDeliveryContent } from "./EmailDeliveryPage";
import { EmailTemplatesContent } from "./EmailTemplatesPage";

export default function EmailManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-purple">Email Management</h1>
          <p className="text-sm text-muted-foreground">Review email delivery and manage the platform’s email templates.</p>
        </div>

        <Tabs defaultValue="delivery" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="delivery" className="gap-2">
              <Send className="h-4 w-4" />
              Email Delivery
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="delivery">
            <EmailDeliveryContent />
          </TabsContent>
          <TabsContent value="templates">
            <EmailTemplatesContent />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
