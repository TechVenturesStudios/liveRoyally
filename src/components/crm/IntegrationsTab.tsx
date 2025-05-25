
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Link, ExternalLink, Mail, MessageCircle, BarChart3 } from "lucide-react";

// Sample integrations data
const integrations = [
  {
    id: 1,
    name: "Zapier",
    description: "Connect with 3,000+ apps",
    icon: "https://cdn.zapier.com/zapier/images/logos/zapier-logo.svg",
    category: "automation",
    status: "connected",
    isPremium: false
  },
  {
    id: 2,
    name: "Mailchimp",
    description: "Email marketing platform",
    icon: "https://cdn.iconscout.com/icon/free/png-256/free-mailchimp-2752128-2284945.png",
    category: "marketing",
    status: "connected",
    isPremium: false
  },
  {
    id: 3,
    name: "Google Analytics",
    description: "Track website and campaign performance",
    icon: "https://cdn.iconscout.com/icon/free/png-256/free-google-analytics-2038788-1721675.png",
    category: "analytics",
    status: "connected",
    isPremium: false
  },
  {
    id: 4,
    name: "Slack",
    description: "Team messaging and notifications",
    icon: "https://cdn.iconscout.com/icon/free/png-256/free-slack-226533.png",
    category: "communication",
    status: "disconnected",
    isPremium: false
  },
  {
    id: 5,
    name: "Salesforce",
    description: "Enterprise CRM platform",
    icon: "https://cdn.iconscout.com/icon/free/png-256/free-salesforce-282298.png",
    category: "crm",
    status: "disconnected",
    isPremium: true
  },
  {
    id: 6,
    name: "Hubspot",
    description: "Marketing, sales and service platform",
    icon: "https://cdn.iconscout.com/icon/free/png-256/free-hubspot-1-2923644.png",
    category: "marketing",
    status: "disconnected",
    isPremium: true
  },
  {
    id: 7,
    name: "Shopify",
    description: "E-commerce platform integration",
    icon: "https://cdn.iconscout.com/icon/free/png-256/free-shopify-226579.png",
    category: "ecommerce",
    status: "disconnected",
    isPremium: false
  }
];

// Sample Zapier webhook template
const zapierTemplate = {
  title: "Zapier Webhook Connection",
  description: "Connect your Zapier workflow to automatically trigger actions when events occur in your CRM.",
  webhookUrl: ""
};

const IntegrationsTab = () => {
  const [activeIntegrations, setActiveIntegrations] = useState(
    integrations.filter(integration => integration.status === "connected")
  );
  const [availableIntegrations, setAvailableIntegrations] = useState(
    integrations.filter(integration => integration.status === "disconnected")
  );
  
  const [showZapierDialog, setShowZapierDialog] = useState(false);
  const [zapierWebhook, setZapierWebhook] = useState("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  
  const handleToggleIntegration = (id: number) => {
    const integration = [...activeIntegrations, ...availableIntegrations].find(i => i.id === id);
    
    if (!integration) return;
    
    if (integration.status === "connected") {
      // Disconnect the integration
      setActiveIntegrations(activeIntegrations.filter(i => i.id !== id));
      setAvailableIntegrations([...availableIntegrations, {...integration, status: "disconnected"}]);
      
      toast({
        title: `Disconnected from ${integration.name}`
      });
    } else {
      // Connect to the integration
      if (integration.isPremium) {
        toast({
          title: "Premium integration requires a paid plan",
          description: "Please upgrade your account to access this integration."
        });
        return;
      }
      
      // For Zapier, show the webhook dialog
      if (integration.name === "Zapier") {
        setShowZapierDialog(true);
        return;
      }
      
      setAvailableIntegrations(availableIntegrations.filter(i => i.id !== id));
      setActiveIntegrations([...activeIntegrations, {...integration, status: "connected"}]);
      
      toast({
        title: `Successfully connected to ${integration.name}`
      });
    }
  };
  
  const handleSaveZapierWebhook = () => {
    if (!zapierWebhook) {
      toast({
        title: "Please enter a valid webhook URL",
        variant: "destructive"
      });
      return;
    }
    
    setIsTestingWebhook(true);
    
    // Simulate API call to test webhook
    setTimeout(() => {
      // Find Zapier integration
      const zapierIntegration = availableIntegrations.find(i => i.name === "Zapier");
      
      if (zapierIntegration) {
        setAvailableIntegrations(availableIntegrations.filter(i => i.name !== "Zapier"));
        setActiveIntegrations([...activeIntegrations, {...zapierIntegration, status: "connected"}]);
        
        toast({
          title: "Zapier webhook connected",
          description: "Your Zapier integration is now active."
        });
      }
      
      setIsTestingWebhook(false);
      setShowZapierDialog(false);
    }, 1500);
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "marketing":
        return <Mail className="h-4 w-4" />;
      case "communication":
        return <MessageCircle className="h-4 w-4" />;
      case "analytics":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Link className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Integrations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <CardTitle>Active Integrations</CardTitle>
            <CardDescription>Currently connected third-party services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeIntegrations.length > 0 ? (
                activeIntegrations.map(integration => (
                  <div key={integration.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded bg-gray-100">
                          {/* Placeholder for icon */}
                          {getCategoryIcon(integration.category)}
                        </div>
                        <div>
                          <h3 className="font-medium">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">Configure</Button>
                      <Switch 
                        checked={true} 
                        onCheckedChange={() => handleToggleIntegration(integration.id)} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center border rounded-lg bg-muted/20">
                  <h3 className="font-medium mb-2">No active integrations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with third-party services to extend your CRM functionality
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>Connect with these services to enhance your CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableIntegrations.map(integration => (
              <div key={integration.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded bg-gray-100">
                      {/* Placeholder for icon */}
                      {getCategoryIcon(integration.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{integration.name}</h3>
                        {integration.isPremium && <Badge variant="outline">Premium</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <a 
                    href="#" 
                    className="text-sm flex items-center text-muted-foreground hover:text-foreground"
                  >
                    Learn more
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  <Button 
                    variant={integration.isPremium ? "outline" : "default"} 
                    size="sm"
                    onClick={() => handleToggleIntegration(integration.id)}
                  >
                    {integration.isPremium ? "Upgrade" : "Connect"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Zapier Webhook Dialog */}
      <Dialog open={showZapierDialog} onOpenChange={setShowZapierDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{zapierTemplate.title}</DialogTitle>
            <DialogDescription>
              {zapierTemplate.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="webhook-url" className="text-sm font-medium">
                Zapier Webhook URL
              </label>
              <Input 
                id="webhook-url" 
                placeholder="https://hooks.zapier.com/hooks/catch/..." 
                value={zapierWebhook}
                onChange={(e) => setZapierWebhook(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can find this URL in your Zapier Webhook configuration
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZapierDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveZapierWebhook} disabled={isTestingWebhook}>
              {isTestingWebhook ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsTab;
