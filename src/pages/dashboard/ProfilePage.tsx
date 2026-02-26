
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Edit, Save, X, Crown, CreditCard, CalendarDays, Users } from "lucide-react";
import ViewToggle from "@/components/ui/ViewToggle";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUserFromStorage, User as StorageUser } from "@/utils/userStorage";
import type { User as UserType, MemberUser, ProviderUser, PartnerUser, AdminUser } from "@/types/user";

const ProfilePage = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  useEffect(() => {
    const userData = getUserFromStorage();
    if (userData) {
      // Create a mock complete user object for display purposes
      const completeUser: UserType = {
        id: userData.id || "mock-id",
        networkName: (userData as any).networkName || "Baton Rouge Network",
        networkCode: (userData as any).networkCode || "BR-001",
        email: userData.email || "user@example.com",
        userType: userData.userType || "member",
        notificationEnabled: true,
        termsAccepted: true,
        // Add type-specific fields based on user type
        ...(userData.userType === "member" && {
          firstName: "John",
          lastName: "Doe",
          zipCode: "12345",
          phoneNumber: "(555) 123-4567"
        }),
        ...(userData.userType === "provider" && {
          agentFirstName: "Jane",
          agentLastName: "Smith", 
          agentPhone: "(555) 987-6543",
          partnerId: "PTR001",
          partnerName: "City Community Foundation",
          businessName: "Demo Business",
          businessCategory: "Service Provider",
          businessAddress: "123 Business St",
          businessCity: "Demo City",
          businessState: "CA",
          businessZip: "12345",
          businessEmail: "business@example.com",
          businessPhone: "(555) 111-2222"
        }),
        ...(userData.userType === "partner" && {
          partnerCode: (userData as any).partnerCode || `PTR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          agentFirstName: "Bob",
          agentLastName: "Johnson",
          agentPhone: "(555) 444-5555",
          organizationName: "Demo Organization",
          organizationAddress: "456 Organization Ave",
          organizationCity: "Demo City",
          organizationState: "CA",
          organizationZip: "12345",
          organizationCategory: "Non-Profit",
          organizationEmail: "org@example.com",
          organizationPhone: "(555) 666-7777",
          membershipPlan: "Standard",
          membershipPrice: 149,
          subscriptionStartDate: "2025-06-15",
          maxProviders: 25,
          currentProviders: 8,
        }),
        ...(userData.userType === "admin" && {
          firstName: "Admin",
          lastName: "User",
          department: "IT"
        })
      } as UserType;
      
      setUser(completeUser);
      setFormData(completeUser);
    }
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically save to your backend/database
    setUser(formData);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const renderMemberFields = (user: MemberUser) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          {isEditing ? (
            <Input id="firstName" value={formData.firstName || ""} onChange={(e) => handleInputChange("firstName", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          {isEditing ? (
            <Input id="lastName" value={formData.lastName || ""} onChange={(e) => handleInputChange("lastName", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.lastName}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">Zip Code</Label>
          {isEditing ? (
            <Input id="zipCode" value={formData.zipCode || ""} onChange={(e) => handleInputChange("zipCode", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.zipCode}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          {isEditing ? (
            <Input id="phoneNumber" value={formData.phoneNumber || ""} onChange={(e) => handleInputChange("phoneNumber", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.phoneNumber || "Not provided"}</p>
          )}
        </div>
      </div>
    </>
  );

  const renderProviderFields = (user: ProviderUser) => (
    <>
      <div className="rounded-lg border bg-primary/5 p-4 mb-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Assigned Partner</Label>
        <p className="font-semibold text-foreground mt-1">{user.partnerName}</p>
        <p className="text-xs text-muted-foreground">ID: {user.partnerId}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agentFirstName">Agent First Name</Label>
          {isEditing ? (
            <Input id="agentFirstName" value={formData.agentFirstName || ""} onChange={(e) => handleInputChange("agentFirstName", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.agentFirstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="agentLastName">Agent Last Name</Label>
          {isEditing ? (
            <Input id="agentLastName" value={formData.agentLastName || ""} onChange={(e) => handleInputChange("agentLastName", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.agentLastName}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        {isEditing ? (
          <Input id="businessName" value={formData.businessName || ""} onChange={(e) => handleInputChange("businessName", e.target.value)} />
        ) : (
          <p className="py-2 px-3 bg-muted rounded-md">{user.businessName}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessCategory">Business Category</Label>
          {isEditing ? (
            <Input id="businessCategory" value={formData.businessCategory || ""} onChange={(e) => handleInputChange("businessCategory", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.businessCategory}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessPhone">Business Phone</Label>
          {isEditing ? (
            <Input id="businessPhone" value={formData.businessPhone || ""} onChange={(e) => handleInputChange("businessPhone", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.businessPhone}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessAddress">Business Address</Label>
        {isEditing ? (
          <Input id="businessAddress" value={formData.businessAddress || ""} onChange={(e) => handleInputChange("businessAddress", e.target.value)} />
        ) : (
          <p className="py-2 px-3 bg-muted rounded-md">{user.businessAddress}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessCity">City</Label>
          {isEditing ? (
            <Input id="businessCity" value={formData.businessCity || ""} onChange={(e) => handleInputChange("businessCity", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.businessCity}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessState">State</Label>
          {isEditing ? (
            <Input id="businessState" value={formData.businessState || ""} onChange={(e) => handleInputChange("businessState", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.businessState}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessZip">Zip Code</Label>
          {isEditing ? (
            <Input id="businessZip" value={formData.businessZip || ""} onChange={(e) => handleInputChange("businessZip", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.businessZip}</p>
          )}
        </div>
      </div>
    </>
  );

  const renderPartnerFields = (user: PartnerUser) => {
    const plan = (user as any).membershipPlan || "Standard";
    const price = (user as any).membershipPrice || 149;
    const startDate = (user as any).subscriptionStartDate || "2025-06-15";
    const maxProviders = (user as any).maxProviders || 25;
    const currentProviders = (user as any).currentProviders || 8;
    const remaining = maxProviders - currentProviders;
    const usagePercent = Math.round((currentProviders / maxProviders) * 100);
    const formattedStart = new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return (
      <>
        <div className="rounded-lg border bg-primary/5 p-4 mb-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Partner Code</Label>
          <p className="font-semibold text-foreground mt-1 font-mono">{user.partnerCode}</p>
          <p className="text-xs text-muted-foreground">Share this code with providers to join your network</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="agentFirstName">Agent First Name</Label>
            {isEditing ? (
              <Input id="agentFirstName" value={formData.agentFirstName || ""} onChange={(e) => handleInputChange("agentFirstName", e.target.value)} />
            ) : (
              <p className="py-2 px-3 bg-muted rounded-md">{user.agentFirstName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="agentLastName">Agent Last Name</Label>
            {isEditing ? (
              <Input id="agentLastName" value={formData.agentLastName || ""} onChange={(e) => handleInputChange("agentLastName", e.target.value)} />
            ) : (
              <p className="py-2 px-3 bg-muted rounded-md">{user.agentLastName}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization Name</Label>
          {isEditing ? (
            <Input id="organizationName" value={formData.organizationName || ""} onChange={(e) => handleInputChange("organizationName", e.target.value)} />
          ) : (
            <p className="py-2 px-3 bg-muted rounded-md">{user.organizationName}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organizationCategory">Organization Category</Label>
            {isEditing ? (
              <Input id="organizationCategory" value={formData.organizationCategory || ""} onChange={(e) => handleInputChange("organizationCategory", e.target.value)} />
            ) : (
              <p className="py-2 px-3 bg-muted rounded-md">{user.organizationCategory}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationPhone">Organization Phone</Label>
            {isEditing ? (
              <Input id="organizationPhone" value={formData.organizationPhone || ""} onChange={(e) => handleInputChange("organizationPhone", e.target.value)} />
            ) : (
              <p className="py-2 px-3 bg-muted rounded-md">{user.organizationPhone}</p>
            )}
          </div>
        </div>

        {/* Subscription Card */}
        <Card className="mt-4 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="font-barlow font-bold flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-primary" /> Membership Subscription
            </CardTitle>
            <CardDescription>Managed via Square • {plan} Plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-bold">{plan}</p>
              </div>
              <Badge className="text-sm px-3 py-1">${price}/mo</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Subscribed Since</p>
                  <p className="font-medium">{formattedStart}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Payment via</p>
                  <p className="font-medium">Square</p>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Provider Slots</p>
                </div>
                <p className="text-sm text-muted-foreground">{currentProviders} of {maxProviders} used</p>
              </div>
              <Progress value={usagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{remaining} slot{remaining !== 1 ? "s" : ""} remaining</p>
            </div>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast({ title: "Redirecting to Square", description: "You'll be taken to Square to manage your subscription." });
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" /> Edit Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      </>
    );
  };

  const renderAdminFields = (user: AdminUser) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        {isEditing ? (
          <Input id="firstName" value={formData.firstName || ""} onChange={(e) => handleInputChange("firstName", e.target.value)} />
        ) : (
          <p className="py-2 px-3 bg-muted rounded-md">{user.firstName || "Not provided"}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        {isEditing ? (
          <Input id="lastName" value={formData.lastName || ""} onChange={(e) => handleInputChange("lastName", e.target.value)} />
        ) : (
          <p className="py-2 px-3 bg-muted rounded-md">{user.lastName || "Not provided"}</p>
        )}
      </div>
    </div>
  );

  const renderUserTypeFields = () => {
    switch (user.userType) {
      case "member":
        return renderMemberFields(user as MemberUser);
      case "provider":
        return renderProviderFields(user as ProviderUser);
      case "partner":
        return renderPartnerFields(user as PartnerUser);
      case "admin":
        return renderAdminFields(user as AdminUser);
      default:
        return null;
    }
  };

  const getProfileRows = (): { label: string; value: string; editable?: boolean; field?: string }[] => {
    const rows: { label: string; value: string; editable?: boolean; field?: string }[] = [
      { label: "User Type", value: user.userType },
      { label: "Network Name", value: user.networkName },
      { label: "Network Code", value: user.networkCode },
      { label: "Email", value: user.email },
    ];
    switch (user.userType) {
      case "member": {
        const m = user as MemberUser;
        rows.push(
          { label: "First Name", value: m.firstName, editable: true, field: "firstName" },
          { label: "Last Name", value: m.lastName, editable: true, field: "lastName" },
          { label: "Zip Code", value: m.zipCode, editable: true, field: "zipCode" },
          { label: "Phone", value: m.phoneNumber || "Not provided", editable: true, field: "phoneNumber" }
        );
        break;
      }
      case "provider": {
        const p = user as ProviderUser;
        rows.push(
          { label: "Agent First Name", value: p.agentFirstName, editable: true, field: "agentFirstName" },
          { label: "Agent Last Name", value: p.agentLastName, editable: true, field: "agentLastName" },
          { label: "Partner", value: p.partnerName },
          { label: "Business Name", value: p.businessName, editable: true, field: "businessName" },
          { label: "Category", value: p.businessCategory, editable: true, field: "businessCategory" },
          { label: "Business Phone", value: p.businessPhone, editable: true, field: "businessPhone" },
          { label: "Address", value: p.businessAddress, editable: true, field: "businessAddress" },
          { label: "City", value: p.businessCity, editable: true, field: "businessCity" },
          { label: "State", value: p.businessState, editable: true, field: "businessState" },
          { label: "Zip Code", value: p.businessZip, editable: true, field: "businessZip" }
        );
        break;
      }
      case "partner": {
        const pt = user as PartnerUser;
        const plan = (pt as any).membershipPlan || "Standard";
        const price = (pt as any).membershipPrice || 149;
        const startDate = (pt as any).subscriptionStartDate || "2025-06-15";
        const maxProv = (pt as any).maxProviders || 25;
        const curProv = (pt as any).currentProviders || 8;
        rows.push(
          { label: "Partner Code", value: pt.partnerCode },
          { label: "Membership Plan", value: `${plan} — $${price}/mo` },
          { label: "Subscribed Since", value: new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
          { label: "Provider Slots", value: `${curProv} of ${maxProv} used` },
          { label: "Payment", value: "Square" },
          { label: "Agent First Name", value: pt.agentFirstName, editable: true, field: "agentFirstName" },
          { label: "Agent Last Name", value: pt.agentLastName, editable: true, field: "agentLastName" },
          { label: "Organization", value: pt.organizationName, editable: true, field: "organizationName" },
          { label: "Category", value: pt.organizationCategory, editable: true, field: "organizationCategory" },
          { label: "Org Phone", value: pt.organizationPhone, editable: true, field: "organizationPhone" }
        );
        break;
      }
      case "admin": {
        const a = user as AdminUser;
        rows.push(
          { label: "First Name", value: a.firstName || "Not provided", editable: true, field: "firstName" },
          { label: "Last Name", value: a.lastName || "Not provided", editable: true, field: "lastName" }
        );
        break;
      }
    }
    rows.push(
      { label: "Notifications", value: user.notificationEnabled ? "Enabled" : "Disabled", editable: true, field: "notificationEnabled" },
      { label: "Terms", value: user.termsAccepted ? "Accepted" : "Pending" }
    );
    return rows;
  };

  return (
    <DashboardLayout>
      <div className="space-y-3 sm:space-y-6">
        {/* Header row: title + edit button */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-barlow font-bold text-xl sm:text-3xl text-foreground">Profile</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage your account info</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 px-2 sm:px-3">
                  <X className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Cancel</span>
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 px-2 sm:px-3">
                  <Save className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Save</span>
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)} className="h-8 px-2 sm:px-3">
                <Edit className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
          </div>
        </div>

        {/* Badge + View toggle row */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize text-xs">{user.userType}</Badge>
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="font-barlow font-bold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">User Type</Label>
                    <p className="font-medium capitalize">{user.userType}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Network Name</Label>
                    <p className="font-medium">{user.networkName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Network Code</Label>
                    <p className="font-medium">{user.networkCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-barlow font-bold">Personal Information</CardTitle>
                  <CardDescription>
                    {isEditing ? "Edit your personal details below" : "Your personal information on file"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderUserTypeFields()}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="font-barlow font-bold">Preferences</CardTitle>
                  <CardDescription>Manage your account preferences and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates and alerts via email</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={formData.notificationEnabled}
                      onCheckedChange={(checked) => handleInputChange("notificationEnabled", checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Terms and Conditions</Label>
                      <p className="text-sm text-muted-foreground">
                        {user.termsAccepted ? "Accepted" : "Not accepted"}
                      </p>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      {user.termsAccepted ? "✓ Accepted" : "Pending"}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px]">Field</TableHead>
                      <TableHead className="text-[11px]">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getProfileRows().map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="py-2 text-xs font-medium text-muted-foreground w-[160px]">
                          {row.label}
                          {isEditing && row.editable && (
                            <Edit className="inline h-3 w-3 ml-1 text-primary" />
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-xs capitalize">
                          {isEditing && row.editable && row.field ? (
                            row.field === "notificationEnabled" ? (
                              <Switch
                                checked={formData.notificationEnabled}
                                onCheckedChange={(checked) => handleInputChange("notificationEnabled", checked)}
                                className="scale-75"
                              />
                            ) : (
                              <Input
                                value={formData[row.field] || ""}
                                onChange={(e) => handleInputChange(row.field!, e.target.value)}
                                className="h-7 text-xs"
                              />
                            )
                          ) : (
                            row.value
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;