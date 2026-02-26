import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormField from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { ProviderUser } from "@/types/user";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, AlertCircle, Loader2 } from "lucide-react";

const STATE_OPTIONS = [
  { label: "Alabama", value: "AL" }, { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" }, { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" }, { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" }, { label: "Delaware", value: "DE" },
  { label: "Florida", value: "FL" }, { label: "Georgia", value: "GA" },
  { label: "Hawaii", value: "HI" }, { label: "Idaho", value: "ID" },
  { label: "Illinois", value: "IL" }, { label: "Indiana", value: "IN" },
  { label: "Iowa", value: "IA" }, { label: "Kansas", value: "KS" },
  { label: "Kentucky", value: "KY" }, { label: "Louisiana", value: "LA" },
  { label: "Maine", value: "ME" }, { label: "Maryland", value: "MD" },
  { label: "Massachusetts", value: "MA" }, { label: "Michigan", value: "MI" },
  { label: "Minnesota", value: "MN" }, { label: "Mississippi", value: "MS" },
  { label: "Missouri", value: "MO" }, { label: "Montana", value: "MT" },
  { label: "Nebraska", value: "NE" }, { label: "Nevada", value: "NV" },
  { label: "New Hampshire", value: "NH" }, { label: "New Jersey", value: "NJ" },
  { label: "New Mexico", value: "NM" }, { label: "New York", value: "NY" },
  { label: "North Carolina", value: "NC" }, { label: "North Dakota", value: "ND" },
  { label: "Ohio", value: "OH" }, { label: "Oklahoma", value: "OK" },
  { label: "Oregon", value: "OR" }, { label: "Pennsylvania", value: "PA" },
  { label: "Rhode Island", value: "RI" }, { label: "South Carolina", value: "SC" },
  { label: "South Dakota", value: "SD" }, { label: "Tennessee", value: "TN" },
  { label: "Texas", value: "TX" }, { label: "Utah", value: "UT" },
  { label: "Vermont", value: "VT" }, { label: "Virginia", value: "VA" },
  { label: "Washington", value: "WA" }, { label: "West Virginia", value: "WV" },
  { label: "Wisconsin", value: "WI" }, { label: "Wyoming", value: "WY" }
];

const BUSINESS_CATEGORIES = [
  { label: "Retail", value: "retail" },
  { label: "Food & Beverage", value: "food" },
  { label: "Entertainment", value: "entertainment" },
  { label: "Health & Wellness", value: "health" },
  { label: "Professional Services", value: "services" },
  { label: "Other", value: "other" }
];

// Mock partner lookup by code
const MOCK_PARTNERS: Record<string, { id: string; name: string; networkName: string; networkCode: string }> = {
  "PTR-001": { id: "PTR001", name: "City Community Foundation", networkName: "Baton Rouge Network", networkCode: "BR-001" },
  "PTR-002": { id: "PTR002", name: "Downtown Business Alliance", networkName: "Lafayette Network", networkCode: "LAF-002" },
  "PTR-003": { id: "PTR003", name: "Metro Chamber of Commerce", networkName: "New Orleans Network", networkCode: "NOLA-003" },
  "PTR-DEMO": { id: "PTR999", name: "Live Royally Demo Partner", networkName: "Houston Network", networkCode: "HOU-009" },
};

const lookupPartner = (code: string) => {
  const normalized = code.trim().toUpperCase();
  return MOCK_PARTNERS[normalized] || null;
};

const ProviderForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [partnerCode, setPartnerCode] = useState("");
  const [partnerLookupStatus, setPartnerLookupStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [partnerInfo, setPartnerInfo] = useState<{ id: string; name: string; networkName: string; networkCode: string } | null>(null);
  const [cameFromInvite, setCameFromInvite] = useState(false);

  const [formData, setFormData] = useState<Partial<ProviderUser>>({
    networkName: "",
    networkCode: "",
    partnerId: "",
    partnerName: "",
    agentFirstName: "",
    agentLastName: "",
    agentPhone: "",
    businessName: "",
    businessCategory: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    businessEmail: "",
    businessPhone: "",
    notificationEnabled: false,
    termsAccepted: false
  });

  // Check for partner code in URL (from email invite)
  useEffect(() => {
    const inviteCode = searchParams.get("partnerCode");
    if (inviteCode) {
      setPartnerCode(inviteCode);
      setCameFromInvite(true);
      handleLookup(inviteCode);
    }
  }, []);

  const handleLookup = (code?: string) => {
    const codeToLookup = code || partnerCode;
    if (!codeToLookup.trim()) return;

    setPartnerLookupStatus("loading");
    // Simulate API call
    setTimeout(() => {
      const result = lookupPartner(codeToLookup);
      if (result) {
        setPartnerInfo(result);
        setPartnerLookupStatus("found");
        setFormData((prev) => ({
          ...prev,
          partnerId: result.id,
          partnerName: result.name,
          networkName: result.networkName,
          networkCode: result.networkCode,
        }));
      } else {
        setPartnerInfo(null);
        setPartnerLookupStatus("not_found");
        setFormData((prev) => ({
          ...prev,
          partnerId: "",
          partnerName: "",
          networkName: "",
          networkCode: "",
        }));
      }
    }, 800);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerInfo) return;
    const userId = `20001${Math.floor(Math.random() * 10000)}`;
    console.log("Submitting provider data:", { ...formData, id: userId, userType: "provider" });
    localStorage.setItem("user", JSON.stringify({ 
      ...formData, 
      id: userId, 
      userType: "provider",
      email: formData.businessEmail
    }));
    navigate("/dashboard");
  };

  return (
    <Card className="royal-card w-full max-w-4xl mx-auto p-8 md:p-10">
      <h2 className="text-2xl font-barlow font-bold mb-2 royal-header">Provider Registration</h2>
      <p className="text-sm text-muted-foreground mb-8">Register your business to join a partner network and start offering deals.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Partner Code Section */}
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Partner Connection</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {cameFromInvite
                ? "Your partner code was pre-filled from the invitation link."
                : "Enter the partner code provided by your partner organization, or from the invite email you received."}
            </p>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Partner Code <span className="text-destructive">*</span>
              </Label>
              <Input
                value={partnerCode}
                onChange={(e) => {
                  setPartnerCode(e.target.value);
                  if (partnerLookupStatus !== "idle") {
                    setPartnerLookupStatus("idle");
                    setPartnerInfo(null);
                    setFormData((prev) => ({ ...prev, partnerId: "", partnerName: "", networkName: "", networkCode: "" }));
                  }
                }}
                placeholder="e.g. PTR-001"
                className="h-11"
                disabled={cameFromInvite && partnerLookupStatus === "found"}
              />
            </div>
            <Button
              type="button"
              onClick={() => handleLookup()}
              disabled={!partnerCode.trim() || partnerLookupStatus === "loading" || (cameFromInvite && partnerLookupStatus === "found")}
              variant="outline"
              className="h-11 px-6 border-royal text-royal"
            >
              {partnerLookupStatus === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>

          {/* Lookup result */}
          {partnerLookupStatus === "found" && partnerInfo && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-green-800">Partner verified</p>
                <p className="text-xs text-green-700">
                  <span className="font-medium">Organization:</span> {partnerInfo.name}
                </p>
                <p className="text-xs text-green-700">
                  <span className="font-medium">Network:</span> {partnerInfo.networkName} ({partnerInfo.networkCode})
                </p>
              </div>
            </div>
          )}

          {partnerLookupStatus === "not_found" && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-destructive">Partner code not found</p>
                <p className="text-xs text-muted-foreground">
                  Please double-check the code from your invite email or contact your partner organization.
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Network (auto-populated from partner) */}
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Network Information</h3>
            <p className="text-xs text-muted-foreground mt-1">Automatically assigned based on your connected partner.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Partner Organization</Label>
              <div className="h-11 px-3 flex items-center rounded-md border bg-muted text-sm text-muted-foreground">
                {formData.partnerName || "Verify partner code above"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Network Name</Label>
              <div className="h-11 px-3 flex items-center rounded-md border bg-muted text-sm text-muted-foreground">
                {formData.networkName || "Verify partner code above"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Network Code</Label>
              <div className="h-11 px-3 flex items-center rounded-md border bg-muted text-sm text-muted-foreground">
                {formData.networkCode || "Verify partner code above"}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Agent Section */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-foreground">Authorized Agent</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="First Name" name="agentFirstName" type="text" placeholder="Enter agent's first name" required value={formData.agentFirstName} onChange={handleInputChange} />
            <FormField label="Last Name" name="agentLastName" type="text" placeholder="Enter agent's last name" required value={formData.agentLastName} onChange={handleInputChange} />
            <FormField label="Phone Number" name="agentPhone" type="tel" placeholder="Enter agent's phone number" required value={formData.agentPhone} onChange={handleInputChange} />
          </div>
        </div>

        <Separator />

        {/* Business Section */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-foreground">Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Business Name" name="businessName" type="text" placeholder="Enter business name" required value={formData.businessName} onChange={handleInputChange} />
            <FormField label="Business Category" name="businessCategory" type="select" required options={BUSINESS_CATEGORIES} value={formData.businessCategory} onSelectChange={handleSelectChange("businessCategory")} />
            <FormField label="Business Address" name="businessAddress" type="text" placeholder="Enter business address" required value={formData.businessAddress} onChange={handleInputChange} />
            <FormField label="City" name="businessCity" type="text" placeholder="Enter business city" required value={formData.businessCity} onChange={handleInputChange} />
            <FormField label="State" name="businessState" type="select" required options={STATE_OPTIONS} value={formData.businessState} onSelectChange={handleSelectChange("businessState")} />
            <FormField label="Zip Code" name="businessZip" type="text" placeholder="Enter business zip" required value={formData.businessZip} onChange={handleInputChange} />
            <FormField label="Business Email" name="businessEmail" type="email" placeholder="Enter business email" required value={formData.businessEmail} onChange={handleInputChange} />
            <FormField label="Business Phone" name="businessPhone" type="tel" placeholder="Enter business phone" required value={formData.businessPhone} onChange={handleInputChange} />
          </div>
        </div>

        <Separator />

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Preferences</h3>
          <FormField label="Notifications" name="notificationEnabled" type="checkbox" placeholder="I want to receive email/text notifications" checked={formData.notificationEnabled} onCheckboxChange={handleCheckboxChange("notificationEnabled")} />
          <FormField label="Terms of Agreement" name="termsAccepted" type="checkbox" placeholder="I accept the Terms of Agreement" required checked={formData.termsAccepted} onCheckboxChange={handleCheckboxChange("termsAccepted")} />
        </div>
        
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/")} className="border-royal text-royal px-6">
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-royal hover:bg-royal-dark text-white px-8"
            disabled={partnerLookupStatus !== "found"}
          >
            Create Account
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProviderForm;
