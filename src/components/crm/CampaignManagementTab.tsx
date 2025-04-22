
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Calendar, Users, ChevronRight, BarChart3 } from "lucide-react";

// Sample campaign data
const campaigns = [
  {
    id: 1,
    name: "Summer Wellness Program",
    type: "Email",
    status: "active",
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    providers: 18,
    engagement: 72,
    budget: 1500,
    spent: 850
  },
  {
    id: 2,
    name: "Fall Membership Drive",
    type: "Multi-channel",
    status: "planned",
    startDate: "2025-09-15",
    endDate: "2025-10-31",
    providers: 24,
    engagement: 0,
    budget: 2000,
    spent: 0
  },
  {
    id: 3,
    name: "Holiday Special Promotions",
    type: "Social Media",
    status: "active",
    startDate: "2025-11-01",
    endDate: "2025-12-31",
    providers: 15,
    engagement: 65,
    budget: 1200,
    spent: 600
  },
  {
    id: 4,
    name: "New Provider Onboarding",
    type: "Email",
    status: "active",
    startDate: "2025-05-01",
    endDate: "2025-07-31",
    providers: 8,
    engagement: 85,
    budget: 800,
    spent: 650
  },
  {
    id: 5,
    name: "Spring Event Series",
    type: "Multi-channel",
    status: "completed",
    startDate: "2025-03-01",
    endDate: "2025-05-15",
    providers: 22,
    engagement: 78,
    budget: 1800,
    spent: 1800
  }
];

const CampaignManagementTab = () => {
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState(
    campaigns.filter(campaign => campaign.status === "active")
  );
  const [plannedCampaigns, setPlannedCampaigns] = useState(
    campaigns.filter(campaign => campaign.status === "planned")
  );
  const [completedCampaigns, setCompletedCampaigns] = useState(
    campaigns.filter(campaign => campaign.status === "completed")
  );

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "",
    startDate: "",
    endDate: "",
    budget: "",
    description: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCampaign({...newCampaign, [name]: value});
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewCampaign({...newCampaign, [name]: value});
  };

  const handleCreateCampaign = () => {
    // Add validation logic here
    console.log("Creating new campaign:", newCampaign);
    
    // Add to planned campaigns
    const newCampaignObj = {
      id: campaigns.length + 1,
      name: newCampaign.name,
      type: newCampaign.type,
      status: "planned",
      startDate: newCampaign.startDate,
      endDate: newCampaign.endDate,
      providers: 0,
      engagement: 0,
      budget: parseInt(newCampaign.budget) || 0,
      spent: 0
    };
    
    setPlannedCampaigns([...plannedCampaigns, newCampaignObj]);
    
    // Reset form and close dialog
    setNewCampaign({
      name: "",
      type: "",
      startDate: "",
      endDate: "",
      budget: "",
      description: ""
    });
    setShowNewCampaignDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Campaign Management</h2>
        <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new marketing campaign for your provider network.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={newCampaign.name} 
                  onChange={handleInputChange} 
                  placeholder="Enter campaign name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("type", value)}
                    defaultValue={newCampaign.type}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Multi-channel">Multi-channel</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input 
                    id="budget" 
                    name="budget" 
                    type="number" 
                    value={newCampaign.budget} 
                    onChange={handleInputChange} 
                    placeholder="Enter budget"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    name="startDate" 
                    type="date" 
                    value={newCampaign.startDate} 
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    name="endDate" 
                    type="date" 
                    value={newCampaign.endDate} 
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={newCampaign.description} 
                  onChange={handleInputChange} 
                  placeholder="Enter campaign details"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewCampaignDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign}>Create Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-100">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
              <CardTitle className="text-lg">Active Campaigns</CardTitle>
            </div>
            <CardDescription>{activeCampaigns.length} campaigns running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeCampaigns.map(campaign => (
                <div key={campaign.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{campaign.name}</h3>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget utilization</span>
                    <span>${campaign.spent} / ${campaign.budget}</span>
                  </div>
                  <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                  <div className="flex justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4" />
                      <span>{campaign.providers} providers</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Planned Campaigns</CardTitle>
            </div>
            <CardDescription>{plannedCampaigns.length} campaigns scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plannedCampaigns.map(campaign => (
                <div key={campaign.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{campaign.name}</h3>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Planned</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget</span>
                    <span>${campaign.budget}</span>
                  </div>
                  <div className="flex justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4" />
                      <span>Target: {campaign.providers} providers</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Campaign Performance</CardTitle>
            <CardDescription>Recent campaign results</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedCampaigns.concat(activeCampaigns).slice(0, 5).map(campaign => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={campaign.engagement} className="h-2 w-16" />
                        <span className="text-sm">{campaign.engagement}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.spent > 0 ? (
                        <Badge className={campaign.engagement > 70 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                          {((campaign.engagement / 100) * campaign.budget / campaign.spent).toFixed(2)}x
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full text-sm">View All Campaigns</Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Calendar</CardTitle>
          <CardDescription>Overview of upcoming campaign schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Campaign calendar visualization would be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignManagementTab;
