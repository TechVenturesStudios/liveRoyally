
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { PartnerUser } from "@/types/user";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, ArrowLeft, CreditCard, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getNetworkFromZip, getNetworkFromZipWithFallback } from "@/utils/networkMapping";

const MEMBERSHIP_PLANS = [
  {
    value: "spotlight",
    label: "Spotlight",
    price: "$49/mo",
    monthlyPrice: 49,
    description: "Basic visibility with network listing and up to 5 providers.",
    features: ["Network listing", "Up to 5 providers", "Basic analytics", "Email support"],
  },
  {
    value: "standard",
    label: "Standard",
    price: "$99/mo",
    monthlyPrice: 99,
    description: "Enhanced tools with campaigns, events, and up to 25 providers.",
    features: ["Everything in Spotlight", "Up to 25 providers", "Campaign management", "Event creation", "Priority support"],
  },
  {
    value: "premium",
    label: "Premium",
    price: "$199/mo",
    monthlyPrice: 199,
    description: "Full platform access with unlimited providers and advanced CRM.",
    features: ["Everything in Standard", "Unlimited providers", "Advanced CRM & analytics", "Custom branding", "Dedicated account manager"],
  },
];

const ORGANIZATION_CATEGORIES = [
  { label: "Educational", value: "education" },
  { label: "Non-Profit", value: "nonprofit" },
  { label: "Government", value: "government" },
  { label: "Corporate", value: "corporate" },
  { label: "Community", value: "community" },
  { label: "Other", value: "other" }
];

const STATE_OPTIONS = [
  { label: "Alabama", value: "AL" }, { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" }, { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" }, { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" }, { label: "Delaware", value: "DE" },
  { label: "Florida", value: "FL" }, { label: "Georgia", value: "GA" },
];

const PartnerForm = () => {
  const navigate = useNavigate();
  const [membershipPlan, setMembershipPlan] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState<Partial<PartnerUser>>({
    networkName: "",
    networkCode: "",
    agentFirstName: "",
    agentLastName: "",
    agentPhone: "",
    organizationName: "",
    organizationAddress: "",
    organizationCity: "",
    organizationState: "",
    organizationZip: "",
    organizationCategory: "",
    organizationEmail: "",
    organizationPhone: "",
    notificationEnabled: false,
    termsAccepted: false
  });

  useEffect(() => {
    const zip = formData.organizationZip || "";
    if (zip.length >= 5) {
      const network = getNetworkFromZipWithFallback(zip);
      setFormData((prev) => ({ ...prev, networkName: network.name, networkCode: network.code }));
    } else {
      setFormData((prev) => ({ ...prev, networkName: "", networkCode: "" }));
    }
  }, [formData.organizationZip]);

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
    if (!membershipPlan) return;
    setShowCheckout(true);
  };

  const handlePay = () => {
    const userId = `10001${Math.floor(Math.random() * 10000)}`;
    const partnerCode = `PTR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log("Submitting partner data:", { ...formData, id: userId, userType: "partner", partnerCode, membershipPlan });
    localStorage.setItem("user", JSON.stringify({ 
      ...formData, 
      id: userId, 
      userType: "partner",
      partnerCode,
      membershipPlan,
      email: formData.organizationEmail
    }));
    navigate("/dashboard");
  };

  const selectedPlan = MEMBERSHIP_PLANS.find((p) => p.value === membershipPlan);

  // ── Checkout / Summary View ──
  if (showCheckout && selectedPlan) {
    const platformFee = 0;
    const subtotal = selectedPlan.monthlyPrice;
    const total = subtotal + platformFee;

    return (
      <Card className="royal-card w-full max-w-2xl mx-auto p-8 md:p-10">
        <button
          onClick={() => setShowCheckout(false)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to registration
        </button>

        <h2 className="text-2xl font-barlow font-bold mb-2 royal-header">Order Summary</h2>
        <p className="text-sm text-muted-foreground mb-8">Review your membership details before completing payment.</p>

        {/* Account Info */}
        <div className="rounded-lg border bg-muted/30 p-5 mb-6 space-y-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Account Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Organization</span>
            <span className="text-foreground font-medium text-right">{formData.organizationName || "—"}</span>
            <span className="text-muted-foreground">Agent</span>
            <span className="text-foreground font-medium text-right">
              {formData.agentFirstName} {formData.agentLastName}
            </span>
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground font-medium text-right">{formData.organizationEmail || "—"}</span>
            <span className="text-muted-foreground">Network</span>
            <span className="text-foreground font-medium text-right">{formData.networkName || "—"}</span>
          </div>
        </div>

        {/* Plan Summary */}
        <div className="rounded-lg border p-5 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">{selectedPlan.label} Plan</h3>
              <p className="text-xs text-muted-foreground mt-1">{selectedPlan.description}</p>
            </div>
            <span className="text-xl font-bold text-primary">{selectedPlan.price}</span>
          </div>
          <ul className="space-y-1.5">
            {selectedPlan.features.map((f) => (
              <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-lg border p-5 mb-8 space-y-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">Cost Breakdown</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{selectedPlan.label} Membership (monthly)</span>
            <span className="text-foreground">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee</span>
            <span className="text-foreground">${platformFee.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span className="text-foreground">Total due today</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Billed monthly. Cancel anytime.</p>
        </div>

        {/* Pay Button */}
        <div className="space-y-4">
          <Button
            onClick={handlePay}
            className="w-full bg-royal hover:bg-royal-dark text-white h-12 text-base font-semibold gap-2"
          >
            <CreditCard className="h-5 w-5" />
            Pay ${total.toFixed(2)} &amp; Create Account
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Secure payment — your information is encrypted
          </div>
        </div>
      </Card>
    );
  }

  // ── Registration Form View ──
  return (
    <Card className="royal-card w-full max-w-4xl mx-auto p-8 md:p-10">
      <h2 className="text-2xl font-barlow font-bold mb-2 royal-header">Partner Registration</h2>
      <p className="text-sm text-muted-foreground mb-8">Set up your partner account and choose a membership plan.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Membership Plan Selection */}
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Choose Your Membership Plan</h3>
            <p className="text-xs text-muted-foreground mt-1">Select the plan that best fits your organization's needs.</p>
          </div>
          <RadioGroup value={membershipPlan} onValueChange={setMembershipPlan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MEMBERSHIP_PLANS.map((plan) => (
              <Label
                key={plan.value}
                htmlFor={`plan-${plan.value}`}
                className={`relative flex flex-col rounded-xl border-2 p-5 cursor-pointer transition-all ${
                  membershipPlan === plan.value
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <RadioGroupItem value={plan.value} id={`plan-${plan.value}`} className="sr-only" />
                {membershipPlan === plan.value && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <span className="text-lg font-bold text-foreground">{plan.label}</span>
                <span className="text-xl font-bold text-primary mt-1">{plan.price}</span>
                <span className="text-xs text-muted-foreground mt-2">{plan.description}</span>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Label>
            ))}
          </RadioGroup>
          {!membershipPlan && (
            <p className="text-xs text-destructive">Please select a membership plan to continue.</p>
          )}
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

        {/* Organization Section */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-foreground">Organization Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Organization Name" name="organizationName" type="text" placeholder="Enter organization name" required value={formData.organizationName} onChange={handleInputChange} />
            <FormField label="Organization Category" name="organizationCategory" type="select" required options={ORGANIZATION_CATEGORIES} value={formData.organizationCategory} onSelectChange={handleSelectChange("organizationCategory")} />
            <FormField label="Address" name="organizationAddress" type="text" placeholder="Enter organization address" required value={formData.organizationAddress} onChange={handleInputChange} />
            <FormField label="City" name="organizationCity" type="text" placeholder="Enter organization city" required value={formData.organizationCity} onChange={handleInputChange} />
            <FormField label="State" name="organizationState" type="select" required options={STATE_OPTIONS} value={formData.organizationState} onSelectChange={handleSelectChange("organizationState")} />
            <FormField label="Zip Code" name="organizationZip" type="text" placeholder="Enter organization zip" required value={formData.organizationZip} onChange={handleInputChange} />
            <FormField label="Email Address" name="organizationEmail" type="email" placeholder="Enter organization email" required value={formData.organizationEmail} onChange={handleInputChange} />
            <FormField label="Phone Number" name="organizationPhone" type="tel" placeholder="Enter organization phone" required value={formData.organizationPhone} onChange={handleInputChange} />
          </div>
        </div>

        <Separator />

        {/* Network (auto-assigned) */}
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Network Assignment</h3>
            <p className="text-xs text-muted-foreground mt-1">Automatically determined by your organization's zip code.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Network Name</Label>
              <div className="h-11 px-3 flex items-center rounded-md border bg-muted text-sm text-muted-foreground">
                {formData.networkName || "Enter zip code above"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Network Code</Label>
              <div className="h-11 px-3 flex items-center rounded-md border bg-muted text-sm text-muted-foreground">
                {formData.networkCode || "Enter zip code above"}
              </div>
            </div>
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
          <Button type="submit" className="bg-royal hover:bg-royal-dark text-white px-8">
            Review &amp; Pay
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PartnerForm;
